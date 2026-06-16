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
  const entries = fs
    .readdirSync(skillsDir, { withFileTypes: true })
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
      assert.equal(
        typeof schema.safeParse,
        'function',
        `${name}.${argName} should be a Zod schema`,
      );
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

  const output = JSON.parse(
    await plugin.tool.delegate.execute(
      {
        task: 'Check dispatch',
        context: 'Use fake SDK',
        expected_output: 'Structured result',
      },
      { directory: repoRoot, worktree: repoRoot },
    ),
  );

  assert.equal(output.status, 'done');
  assert.match(output.output, /Completed task/);
  assert.equal(calls[1][1].path.id, 'session-1');
  assert.equal(calls[2][1].path.id, 'session-1');
});

test('explore uses OpenCode worktree context when provided', async () => {
  const plugin = await RegentPlugin({ client: {} });

  const output = JSON.parse(
    await plugin.tool.explore.execute(
      {
        query: 'package metadata',
        focus: 'package.json',
      },
      { worktree: repoRoot },
    ),
  );

  assert.match(output.structure, /"name": "regent"/);
});

test('bootstrap keeps using-regent as the single tool mapping source', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const output = {
    messages: [
      {
        info: { role: 'user' },
        parts: [{ type: 'text', text: 'Do work' }],
      },
    ],
  };

  await plugin['experimental.chat.messages.transform']({}, output);

  const bootstrap = output.messages[0].parts[0].text;
  assert.match(bootstrap, /EXTREMELY_IMPORTANT/);
  assert.doesNotMatch(bootstrap, /`Task` with subagents → `task` tool/);
});

test('filesChanged regex excludes numbered list items (Bug 1: false positive)', async () => {
  const calls = [];
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create(input) {
          calls.push(['create', input]);
          return { data: { id: 's-files' } };
        },
        async prompt(input) {
          calls.push(['prompt', input]);
          return {
            data: {
              parts: [
                {
                  type: 'text',
                  text: [
                    '## Summary',
                    '1. Fixed the login crash',
                    '2. Added form validation',
                    '',
                    '### Files Changed',
                    'src/index.js',
                    'package.json',
                  ].join('\n'),
                },
              ],
            },
          };
        },
        async delete(input) {
          calls.push(['delete', input]);
          return { data: {} };
        },
      },
    },
  });

  const output = JSON.parse(
    await plugin.tool.delegate.execute(
      { task: 'Fix bugs', context: 'Various fixes', expected_output: 'Working' },
      { directory: repoRoot, worktree: repoRoot },
    ),
  );

  assert.equal(output.files_changed.includes('1. Fixed'), false);
  assert.equal(output.files_changed.includes('2. Added'), false);
  assert.ok(output.files_changed.includes('src/index.js'));
  assert.ok(output.files_changed.includes('package.json'));
  assert.equal(output.files_changed.length, 2);
});

test('delegate_many dispatches multiple tasks and returns summary', async () => {
  let callCount = 0;
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create(_input) {
          callCount++;
          return { data: { id: `session-${callCount}` } };
        },
        async prompt(_input) {
          return {
            data: {
              parts: [{ type: 'text', text: 'Completed' }],
            },
          };
        },
        async delete(_input) {
          return { data: {} };
        },
      },
    },
  });

  const output = JSON.parse(
    await plugin.tool.delegate_many.execute(
      {
        tasks: [
          { id: 'a', task: 'Task A', context: 'ctx a', expected_output: 'done a' },
          { id: 'b', task: 'Task B', context: 'ctx b', expected_output: 'done b' },
        ],
      },
      { directory: repoRoot },
    ),
  );

  assert.equal(output.results.length, 2);
  assert.equal(output.results[0].id, 'a');
  assert.equal(output.results[1].id, 'b');
  assert.equal(output.summary.total, 2);
  assert.equal(output.summary.completed, 2);
});

test('research dispatches a task per question', async () => {
  let callCount = 0;
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create(_input) {
          callCount++;
          return { data: { id: `session-r-${callCount}` } };
        },
        async prompt(_input) {
          return {
            data: {
              parts: [{ type: 'text', text: 'Findings here' }],
            },
          };
        },
        async delete(_input) {
          return { data: {} };
        },
      },
    },
  });

  const output = JSON.parse(
    await plugin.tool.research.execute(
      {
        questions: [
          { id: 'q1', question: 'What is X?' },
          { id: 'q2', question: 'How does Y work?', scope: 'Focus on performance' },
        ],
      },
      { directory: repoRoot },
    ),
  );

  assert.equal(output.findings.length, 2);
  assert.equal(output.findings[0].id, 'q1');
  assert.equal(output.findings[0].question, 'What is X?');
});

test('dispatchSubagent detects BLOCKED status', async () => {
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create(_input) {
          return { data: { id: 's-blocked' } };
        },
        async prompt(_input) {
          return {
            data: {
              parts: [{ type: 'text', text: 'BLOCKED\nCannot access the database' }],
            },
          };
        },
        async delete(_input) {
          return { data: {} };
        },
      },
    },
  });

  const output = JSON.parse(
    await plugin.tool.delegate.execute(
      { task: 'Do X', context: 'ctx', expected_output: 'done' },
      { directory: repoRoot },
    ),
  );

  assert.equal(output.status, 'blocked');
});

test('dispatchSubagent detects NEEDS_CONTEXT status', async () => {
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create(_input) {
          return { data: { id: 's-nc' } };
        },
        async prompt(_input) {
          return {
            data: {
              parts: [{ type: 'text', text: 'NEEDS_CONTEXT\nNeed the API endpoint URL' }],
            },
          };
        },
        async delete(_input) {
          return { data: {} };
        },
      },
    },
  });

  const output = JSON.parse(
    await plugin.tool.delegate.execute(
      { task: 'Do Y', context: 'ctx', expected_output: 'done' },
      { directory: repoRoot },
    ),
  );

  assert.equal(output.status, 'needs_context');
});

test('dispatchSubagent detects CONCERN status and captures concerns', async () => {
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create(_input) {
          return { data: { id: 's-concern' } };
        },
        async prompt(_input) {
          return {
            data: {
              parts: [
                {
                  type: 'text',
                  text: 'Completed task\nCONCERN: Performance may degrade with large inputs',
                },
              ],
            },
          };
        },
        async delete(_input) {
          return { data: {} };
        },
      },
    },
  });

  const output = JSON.parse(
    await plugin.tool.delegate.execute(
      { task: 'Do Z', context: 'ctx', expected_output: 'done' },
      { directory: repoRoot },
    ),
  );

  assert.equal(output.status, 'done_with_concerns');
  assert.ok(output.concerns.length > 0);
  assert.match(output.concerns[0], /Performance/);
});

test('explore handles missing focus path', async () => {
  const plugin = await RegentPlugin({ client: {} });

  const output = JSON.parse(
    await plugin.tool.explore.execute(
      { query: 'test missing', focus: 'nonexistent-file.xyz' },
      { worktree: repoRoot },
    ),
  );

  assert.match(output.structure, /path not found/);
});

test('explore returns error when no context provided (Bug: process.cwd fallback)', async () => {
  const plugin = await RegentPlugin({ client: {} });

  const output = JSON.parse(
    await plugin.tool.explore.execute({
      query: 'test',
    }),
  );

  assert.match(output.structure, /Error/);
  assert.match(output.structure, /context/);
  assert.match(output.summary, /context/);
});

test('transform returns early when no user messages', async () => {
  const plugin = await RegentPlugin({ client: {} });

  const noMessages = { messages: [] };
  await plugin['experimental.chat.messages.transform']({}, noMessages);
  assert.equal(noMessages.messages.length, 0);

  const noUser = {
    messages: [{ info: { role: 'assistant' }, parts: [{ type: 'text', text: 'Hello' }] }],
  };
  await plugin['experimental.chat.messages.transform']({}, noUser);
  assert.equal(noUser.messages[0].parts.length, 1);
  assert.doesNotMatch(noUser.messages[0].parts[0].text, /EXTREMELY_IMPORTANT/);
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

test('dispatchSubagent cleans up session when prompt throws', async () => {
  let deletedId = null;
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create() {
          return { data: { id: 's-leak-test' } };
        },
        async prompt() {
          throw new Error('Simulated prompt failure');
        },
        async delete(input) {
          deletedId = input.path.id;
          return { data: {} };
        },
      },
    },
  });

  const output = JSON.parse(
    await plugin.tool.delegate.execute(
      { task: 'Fail', context: 'ctx', expected_output: 'done' },
      { directory: repoRoot },
    ),
  );

  assert.equal(output.status, 'blocked');
  assert.equal(deletedId, 's-leak-test', 'session must be deleted even after prompt failure');
});

test('explore blocks path traversal outside worktree', async () => {
  const plugin = await RegentPlugin({ client: {} });

  const output = JSON.parse(
    await plugin.tool.explore.execute(
      { query: 'traversal attempt', focus: '../../../etc/passwd' },
      { worktree: repoRoot },
    ),
  );

  assert.match(output.structure, /outside project directory/);
});

test('verify uses bigram matching for accuracy', async () => {
  const plugin = await RegentPlugin({ client: {} });

  const resultWithMatch = JSON.parse(
    await plugin.tool.verify.execute({
      requirements: '- Add user login form',
      implementation_context:
        'src/login.tsx contains the user login form with email and password fields',
    }),
  );
  assert.equal(resultWithMatch.requirements_met.length, 1);
  assert.equal(resultWithMatch.requirements_unmet.length, 0);

  const resultWithoutMatch = JSON.parse(
    await plugin.tool.verify.execute({
      requirements: '- Implement payment processing',
      implementation_context: 'src/login.tsx has the login form',
    }),
  );
  assert.equal(resultWithoutMatch.requirements_met.length, 0);
  assert.equal(resultWithoutMatch.requirements_unmet.length, 1);
});

test('research synthesis returns meaningful summary', async () => {
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create() {
          return { data: { id: 's-synth' } };
        },
        async prompt() {
          return { data: { parts: [{ type: 'text', text: 'Key findings here' }] } };
        },
        async delete() {
          return { data: {} };
        },
      },
    },
  });

  const output = JSON.parse(
    await plugin.tool.research.execute(
      {
        questions: [{ id: 'q1', question: 'What is Regent?' }],
      },
      { directory: repoRoot },
    ),
  );

  assert.match(output.synthesis, /Regent/);
  assert.doesNotMatch(output.synthesis, /Review individual findings/);
});

test('research synthesis reports blocked questions', async () => {
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create() {
          return { data: { id: 's-block-r' } };
        },
        async prompt() {
          return { data: { parts: [{ type: 'text', text: 'BLOCKED\nNo access' }] } };
        },
        async delete() {
          return { data: {} };
        },
      },
    },
  });

  const output = JSON.parse(
    await plugin.tool.research.execute(
      {
        questions: [{ id: 'q1', question: 'Secret API' }],
      },
      { directory: repoRoot },
    ),
  );

  assert.match(output.synthesis, /Blocked/);
});

test('filesChanged regex matches extensionless paths with separators', async () => {
  const calls = [];
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create(input) {
          calls.push(['create', input]);
          return { data: { id: 's-files2' } };
        },
        async prompt(_input) {
          return {
            data: {
              parts: [
                {
                  type: 'text',
                  text: [
                    '### Files Changed',
                    'src/components/Header',
                    'src/index.js',
                    'Makefile',
                  ].join('\n'),
                },
              ],
            },
          };
        },
        async delete(input) {
          calls.push(['delete', input]);
          return { data: {} };
        },
      },
    },
  });

  const output = JSON.parse(
    await plugin.tool.delegate.execute(
      { task: 'Fix bugs', context: 'Various fixes', expected_output: 'Working' },
      { directory: repoRoot, worktree: repoRoot },
    ),
  );

  assert.ok(output.files_changed.includes('src/index.js'), 'should match path with extension');
  assert.ok(
    output.files_changed.includes('src/components/Header'),
    'should match extensionless path with separator',
  );
  assert.equal(output.files_changed.length, 2);
});
