import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { RegentPlugin } from './regent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

test('config registers bundled Regent assets for OpenCode discovery', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const config = {};

  await plugin.config(config);

  assert.ok(config.skills?.paths?.some((p) => p.endsWith('skills')));

  for (const name of ['orchestrate', 'delegate', 'research', 'tdd', 'diagnose', 'verify']) {
    assert.equal(typeof config.command?.[name]?.description, 'string');
    assert.equal(typeof config.command?.[name]?.template, 'string');
    assert.match(config.command[name].template, /\$ARGUMENTS/);
  }

  assert.equal(config.command.orchestrate.subtask, true);

  for (const name of ['regent-explore', 'regent-general']) {
    assert.equal(config.agent?.[name]?.mode, 'subagent');
    assert.equal(typeof config.agent?.[name]?.description, 'string');
    assert.equal(typeof config.agent?.[name]?.prompt, 'string');
  }
});

test('config preserves user-defined commands and agents', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const config = {
    command: {
      tdd: { description: 'custom', template: 'custom template' },
    },
    agent: {
      'regent-explore': { description: 'custom agent', mode: 'subagent', prompt: 'custom prompt' },
    },
  };

  await plugin.config(config);

  assert.equal(config.command.tdd.template, 'custom template');
  assert.equal(config.agent['regent-explore'].prompt, 'custom prompt');
});

test('bundled Regent skills have OpenCode-discoverable frontmatter', () => {
  const skillsDir = path.join(repoRoot, 'skills');
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());

  for (const entry of entries) {
    const content = fs.readFileSync(path.join(skillsDir, entry.name, 'SKILL.md'), 'utf8');
    assert.match(content, /^---\n[\s\S]*?\n---\n/);
    assert.match(content, new RegExp(`\\nname: ${entry.name}\\n`));
    assert.match(content, /\ndescription: .+\n/);
  }
});

test('custom tool args are OpenCode-compatible Zod schemas', async () => {
  const plugin = await RegentPlugin({ client: {} });

  for (const [name, definition] of Object.entries(plugin.tool)) {
    for (const [argName, schema] of Object.entries(definition.args)) {
      assert.equal(typeof schema.safeParse, 'function', `${name}.${argName} should be a Zod schema`);
    }
  }
});

test('delegate handles wrapped SDK responses', async () => {
  const calls = [];
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create(input) {
          calls.push(['create', input]);
          return { data: { id: 'session-1' } };
        },
        async prompt(input) {
          calls.push(['prompt', input]);
          return { data: { parts: [{ type: 'text', text: 'Completed task' }] } };
        },
        async delete(input) {
          calls.push(['delete', input]);
          return { data: {} };
        },
      },
    },
  });

  const output = JSON.parse(await plugin.tool.delegate.execute({
    task: 'Check dispatch',
    context: 'Use fake SDK',
    expected_output: 'Structured result',
  }, { directory: repoRoot, worktree: repoRoot }));

  assert.equal(output.status, 'done');
  assert.match(output.output, /Completed task/);
  assert.equal(calls[1][1].path.id, 'session-1');
  assert.equal(calls[2][1].path.id, 'session-1');
});

test('explore uses OpenCode worktree context when provided', async () => {
  const plugin = await RegentPlugin({ client: {} });

  const output = JSON.parse(await plugin.tool.explore.execute({
    query: 'package metadata',
    focus: 'package.json',
  }, { worktree: repoRoot }));

  assert.match(output.structure, /"name": "regent"/);
});

test('bootstrap keeps using-regent as the single tool mapping source', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const output = {
    messages: [{
      info: { role: 'user' },
      parts: [{ type: 'text', text: 'Do work' }],
    }],
  };

  await plugin['experimental.chat.messages.transform']({}, output);

  const bootstrap = output.messages[0].parts[0].text;
  assert.match(bootstrap, /EXTREMELY_IMPORTANT/);
  assert.doesNotMatch(bootstrap, /`Task` with subagents → `task` tool/);
});

test('verify returns structured error on missing args', async () => {
  const plugin = await RegentPlugin({ client: {} });

  const bare = JSON.parse(await plugin.tool.verify.execute());
  assert.equal(bare.compliant, false);
  assert.match(bare.summary, /Missing required arguments/);

  const partial = JSON.parse(await plugin.tool.verify.execute({ requirements: 'req' }));
  assert.equal(partial.compliant, false);
  assert.match(partial.summary, /Missing required arguments/);
});
