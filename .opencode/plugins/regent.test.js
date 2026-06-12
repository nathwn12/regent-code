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
