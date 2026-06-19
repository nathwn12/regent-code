import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { RegentPlugin } from './regent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');

// ── 1. VERIFY TOOL (no SDK dependency) ─────────────────────

test('[LIVE] verify — all requirements met with matching vocabulary', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const result = JSON.parse(
    await plugin.tool.verify.execute({
      requirements: ['Add user login form', 'Validate email format', 'Handle error states'].join(
        '\n',
      ),
      implementation_context:
        'Created login form with user login form, validate email format implementation, handle error states on submit',
    }),
  );
  assert.equal(result.compliant, true);
  assert.equal(result.requirements_met.length, 3);
  assert.equal(result.requirements_unmet.length, 0);
});

test('[LIVE] verify — some requirements unmet', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const result = JSON.parse(
    await plugin.tool.verify.execute({
      requirements: [
        'Add user login form',
        'Implement payment processing',
        'Send confirmation email',
      ].join('\n'),
      implementation_context: 'Created src/login.tsx with login form only',
    }),
  );
  assert.equal(result.compliant, false);
  assert.ok(result.requirements_unmet.length >= 1);
});

test('[LIVE] verify — empty requirements returns compliant (not "missing args")', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const result = JSON.parse(
    await plugin.tool.verify.execute({
      requirements: '',
      implementation_context: 'Some code built',
    }),
  );
  assert.equal(result.compliant, true);
  assert.equal(result.requirements_met.length, 0);
  assert.doesNotMatch(result.summary, /Missing required/);
});

test('[LIVE] verify — markdown checkbox lines handled', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const result = JSON.parse(
    await plugin.tool.verify.execute({
      requirements: [
        '- [ ] Add user login',
        '- [x] Add API endpoint',
        '* [ ] Add test coverage',
      ].join('\n'),
      implementation_context:
        'Added user login form, added API endpoint route, added test coverage suite',
    }),
  );
  assert.ok(result.requirements_met.length >= 2);
});

test('[LIVE] verify — bigram avoids false positives', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const result = JSON.parse(
    await plugin.tool.verify.execute({
      requirements: 'Implement quantum encryption',
      implementation_context: 'Added counter component with buttons',
    }),
  );
  assert.equal(result.compliant, false);
  assert.equal(result.requirements_met.length, 0);
});

test('[LIVE] verify — detects YAGNI extras on separate lines', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const result = JSON.parse(
    await plugin.tool.verify.execute({
      requirements: 'Add login form',
      implementation_context: [
        'Added login form component with validation',
        'Added admin dashboard with charts',
      ].join('\n'),
    }),
  );
  assert.ok(result.extras_built.some((e) => e.includes('admin') || e.includes('dashboard')));
});

test('[LIVE] verify — case insensitive bigram matching', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const result = JSON.parse(
    await plugin.tool.verify.execute({
      requirements: 'ADD USER LOGIN FORM',
      implementation_context: 'added user login form component',
    }),
  );
  assert.equal(result.compliant, true);
});

test('[LIVE] verify — missing args returns structured error', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const bare = JSON.parse(await plugin.tool.verify.execute());
  assert.equal(bare.compliant, false);
  assert.match(bare.summary, /Missing required arguments/);

  const partial = JSON.parse(await plugin.tool.verify.execute({ requirements: 'req' }));
  assert.equal(partial.compliant, false);
});

test('[LIVE] verify — short words fallback to unigrams', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const result = JSON.parse(
    await plugin.tool.verify.execute({
      requirements: 'fix bug on prod',
      implementation_context: 'fixed production bug',
    }),
  );
  assert.equal(result.compliant, true);
});

// ── 2. EXPLORE TOOL (filesystem-based) ─────────────────────

test('[LIVE] explore — reads project structure', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const output = JSON.parse(
    await plugin.tool.explore.execute({ query: 'project structure' }, { worktree: repoRoot }),
  );
  assert.match(output.structure, /package\.json/);
  assert.match(output.structure, /CONSTITUTION\.md/);
  assert.match(output.summary, /project structure/i);
});

test('[LIVE] explore — focus on specific file', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const output = JSON.parse(
    await plugin.tool.explore.execute(
      { query: 'read metadata', focus: 'package.json' },
      { worktree: repoRoot },
    ),
  );
  assert.match(output.structure, /"name": "regent"/);
  assert.match(output.structure, /"version": "2\.3\.0"/);
});

test('[LIVE] explore — focus on directory', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const output = JSON.parse(
    await plugin.tool.explore.execute(
      { query: 'skills list', focus: '.opencode\\skills' },
      { worktree: repoRoot },
    ),
  );
  assert.match(output.structure, /orchestrator/);
  assert.match(output.structure, /using-regent/);
});

test('[LIVE] explore — missing focus path', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const output = JSON.parse(
    await plugin.tool.explore.execute(
      { query: 'nonexistent', focus: 'does-not-exist-12345.xyz' },
      { worktree: repoRoot },
    ),
  );
  assert.match(output.structure, /path not found/);
});

test('[LIVE] explore — blocks directory traversal', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const output = JSON.parse(
    await plugin.tool.explore.execute(
      { query: 'traversal', focus: '../../../etc/passwd' },
      { worktree: repoRoot },
    ),
  );
  assert.match(output.structure, /outside project directory/);
});

test('[LIVE] explore — no context falls back to process.cwd', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const output = JSON.parse(await plugin.tool.explore.execute({ query: 'test' }));
  assert.ok(output.structure, 'should return structure from process.cwd() fallback');
  assert.doesNotMatch(output.structure, /Error/);
});

test('[LIVE] explore — uses context.directory fallback', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const output = JSON.parse(
    await plugin.tool.explore.execute({ query: 'test' }, { directory: repoRoot }),
  );
  assert.match(output.structure, /package\.json/);
});

test('[LIVE] explore — src directory walk depth limit 3', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const tmpDir = fs.mkdtempSync(path.join(repoRoot, '.opencode', '.test-src-walk-'));
  try {
    const nestedDir = path.join(tmpDir, 'src', 'a', 'b', 'c', 'd');
    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'src', 'index.js'), 'x');
    fs.writeFileSync(path.join(tmpDir, 'src', 'a', 'file1.js'), 'x');
    fs.writeFileSync(path.join(tmpDir, 'src', 'a', 'b', 'file2.js'), 'x');
    fs.writeFileSync(path.join(tmpDir, 'src', 'a', 'b', 'c', 'file3.js'), 'x');
    fs.writeFileSync(path.join(tmpDir, 'src', 'a', 'b', 'c', 'd', 'file4.js'), 'x');

    const output = JSON.parse(
      await plugin.tool.explore.execute({ query: 'src walk' }, { worktree: tmpDir }),
    );
    assert.match(output.structure, /index\.js/);
    assert.match(output.structure, /file3\.js/);
    assert.doesNotMatch(output.structure, /file4\.js/); // exceeds depth 3
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('[LIVE] explore — no src directory skips src walk', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const tmpDir = fs.mkdtempSync(path.join(repoRoot, '.opencode', '.test-no-src-'));
  try {
    fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Test');
    const output = JSON.parse(
      await plugin.tool.explore.execute({ query: 'structure' }, { worktree: tmpDir }),
    );
    assert.match(output.structure, /README\.md/);
    assert.doesNotMatch(output.structure, /src\/ directory/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('[LIVE] explore — focus path exactly equals worktree root', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const output = JSON.parse(
    await plugin.tool.explore.execute({ query: 'root', focus: '' }, { worktree: repoRoot }),
  );
  assert.doesNotMatch(output.structure, /outside project directory/);
});

test('[LIVE] explore — focus path with trailing slash', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const output = JSON.parse(
    await plugin.tool.explore.execute(
      { query: 'test', focus: '.opencode\\skills\\' },
      { worktree: repoRoot },
    ),
  );
  assert.match(output.structure, /orchestrator/);
});

test('[LIVE] explore — displays first 3000 chars of focused file', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const output = JSON.parse(
    await plugin.tool.explore.execute(
      { query: 'read package.json', focus: 'package.json' },
      { worktree: repoRoot },
    ),
  );
  assert.ok(output.structure.length > 100);
  assert.match(output.structure, /```/);
});

test('[LIVE] explore — hidden files filtered from top-level listing', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const tmpDir = fs.mkdtempSync(path.join(repoRoot, '.opencode', '.test-hidden-'));
  try {
    fs.writeFileSync(path.join(tmpDir, '.hidden-file'), 'secret');
    fs.writeFileSync(path.join(tmpDir, 'visible.txt'), 'visible');
    const output = JSON.parse(
      await plugin.tool.explore.execute({ query: 'hidden test' }, { worktree: tmpDir }),
    );
    assert.doesNotMatch(output.structure, /\.hidden-file/);
    assert.match(output.structure, /visible\.txt/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('[LIVE] explore — .gitignore exception is visible', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const output = JSON.parse(
    await plugin.tool.explore.execute({ query: 'find gitignore' }, { worktree: repoRoot }),
  );
  // .gitignore should be visible because of the exception
  assert.match(output.structure, /\.gitignore/);
});

// ── 3. CONFIG REGISTRATION ──────────────────────────────────

test('[LIVE] config — registers all 6 commands properly', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const config = {};
  await plugin.config(config);
  for (const name of ['orchestrate', 'delegate', 'research', 'tdd', 'diagnose', 'verify']) {
    assert.equal(typeof config.command[name].description, 'string', `${name} missing description`);
    assert.equal(typeof config.command[name].template, 'string', `${name} missing template`);
    assert.match(
      config.command[name].template,
      /\$ARGUMENTS/,
      `${name} missing $ARGUMENTS placeholder`,
    );
  }
});

test('[LIVE] config — orchestrator marked as subtask with regent-general agent', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const config = {};
  await plugin.config(config);
  assert.equal(config.command.orchestrate.subtask, true);
  assert.equal(config.command.orchestrate.agent, 'regent-general');
});

test('[LIVE] config — all commands route to regent-general', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const config = {};
  await plugin.config(config);
  for (const name of ['orchestrate', 'delegate', 'research', 'tdd', 'diagnose', 'verify']) {
    assert.equal(config.command[name].agent, 'regent-general', `${name} wrong agent`);
  }
});

test('[LIVE] config — registers both custom subagents', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const config = {};
  await plugin.config(config);
  assert.equal(config.agent['regent-general'].mode, 'subagent');
  assert.equal(config.agent['regent-explore'].mode, 'subagent');
});

test('[LIVE] config — agents have correct colors', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const config = {};
  await plugin.config(config);
  assert.equal(config.agent['regent-general'].color, 'primary');
  assert.equal(config.agent['regent-explore'].color, 'info');
});

test('[LIVE] config — deduplicates against user commands', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const config = {
    command: {
      tdd: { description: 'custom tdd', template: 'custom template', agent: 'custom-agent' },
    },
  };
  await plugin.config(config);
  assert.equal(config.command.tdd.template, 'custom template');
  assert.equal(config.command.tdd.agent, 'custom-agent');
});

test('[LIVE] config — deduplicates against user agents', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const config = {
    agent: {
      'regent-general': { description: 'custom', mode: 'subagent', prompt: 'custom prompt' },
    },
  };
  await plugin.config(config);
  assert.equal(config.agent['regent-general'].description, 'custom');
  assert.match(config.agent['regent-general'].prompt, /custom/);
});

// ── 4. BOOTSTRAP INJECTION ──────────────────────────────────

test('[LIVE] bootstrap — injects EXTREMELY_IMPORTANT marker into first user message', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const output = {
    messages: [{ info: { role: 'user' }, parts: [{ type: 'text', text: 'Do work' }] }],
  };
  await plugin['experimental.chat.messages.transform']({}, output);
  const bootText = output.messages[0].parts[0].text;
  assert.match(bootText, /EXTREMELY_IMPORTANT/);
  assert.match(bootText, /Iron Laws/);
  assert.match(bootText, /Tool Catalog/);
});

test('[LIVE] bootstrap — does not inject twice', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const output = {
    messages: [{ info: { role: 'user' }, parts: [{ type: 'text', text: 'Do work' }] }],
  };
  await plugin['experimental.chat.messages.transform']({}, output);
  const partCount = output.messages[0].parts.length;
  await plugin['experimental.chat.messages.transform']({}, output);
  assert.equal(output.messages[0].parts.length, partCount);
});

test('[LIVE] bootstrap — no inject when no user messages', async () => {
  const plugin = await RegentPlugin({ client: {} });
  for (const msgs of [
    { messages: [] },
    { messages: [{ info: { role: 'assistant' }, parts: [{ type: 'text', text: 'Hi' }] }] },
  ]) {
    await plugin['experimental.chat.messages.transform']({}, msgs);
    const allText = msgs.messages
      .flatMap((m) => m.parts || [])
      .filter((p) => p.type === 'text')
      .map((p) => p.text)
      .join('');
    assert.doesNotMatch(allText, /EXTREMELY_IMPORTANT/);
  }
});

test('[LIVE] bootstrap — prepends not appends', async () => {
  const plugin = await RegentPlugin({ client: {} });
  const userMsg = 'Hello, do something';
  const output = {
    messages: [{ info: { role: 'user' }, parts: [{ type: 'text', text: userMsg }] }],
  };
  await plugin['experimental.chat.messages.transform']({}, output);
  assert.match(output.messages[0].parts[0].text, /EXTREMELY_IMPORTANT/);
  assert.equal(output.messages[0].parts[1].text, userMsg);
});

// ── 5. SKILL FILES VALIDATION ──────────────────────────────

test('[LIVE] all skill directories have valid SKILL.md with frontmatter', () => {
  const skillsDir = path.join(repoRoot, '.opencode', 'skills');
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory());
  assert.ok(entries.length >= 7);
  for (const entry of entries) {
    const skillPath = path.join(skillsDir, entry.name, 'SKILL.md');
    assert.ok(fs.existsSync(skillPath), `Missing SKILL.md in ${entry.name}`);
    const content = fs.readFileSync(skillPath, 'utf8');
    assert.match(content, /^---\n[\s\S]*?\n---\n/, `${entry.name} missing frontmatter`);
    assert.match(content, new RegExp(`name: ${entry.name}`), `${entry.name} name mismatch`);
    assert.match(content, /\ndescription: .+\n/, `${entry.name} missing description`);
  }
});

// ── 6. CONSTITUTION.md ─────────────────────────────────────

test('[LIVE] CONSTITUTION.md exists with all required content', () => {
  const cPath = path.join(repoRoot, 'CONSTITUTION.md');
  assert.ok(fs.existsSync(cPath));
  const c = fs.readFileSync(cPath, 'utf8');
  for (const role of [
    'Strategist',
    'Architect',
    'Fleet Commander',
    'Inspector',
    'Publisher',
    'Mentor',
  ]) {
    assert.match(c, new RegExp(role), `Missing role: ${role}`);
  }
  assert.match(c, /Iron Laws/);
  assert.match(c, /Karpathy/);
  assert.match(c, /Chain of Command/);
});

// ── 7. COMMAND/AGENT FILES VALIDATION ─────────────────────

test('[LIVE] all 6 command files exist with valid frontmatter', () => {
  const cmdDir = path.join(__dirname, '../commands');
  for (const name of ['orchestrate', 'delegate', 'research', 'tdd', 'diagnose', 'verify']) {
    const cmdPath = path.join(cmdDir, `${name}.md`);
    assert.ok(fs.existsSync(cmdPath), `Missing: ${name}`);
    const c = fs.readFileSync(cmdPath, 'utf8');
    assert.match(c, /description: /, `${name} missing description`);
    assert.match(c, /\$ARGUMENTS/, `${name} missing $ARGUMENTS`);
    assert.match(c, /agent: regent-general/, `${name} wrong agent`);
  }
});

test('[LIVE] both agent files exist', () => {
  const aDir = path.join(__dirname, '../agents');
  for (const name of ['regent-general', 'regent-explore']) {
    const aPath = path.join(aDir, `${name}.md`);
    assert.ok(fs.existsSync(aPath), `Missing agent: ${name}`);
    const c = fs.readFileSync(aPath, 'utf8');
    assert.match(c, /mode: subagent/);
    assert.match(c, /description: /);
  }
});

// ── 8. TOOL ARG SCHEMAS ──────────────────────────────────

test('[LIVE] all 5 tools have valid Zod schemas', async () => {
  const plugin = await RegentPlugin({ client: {} });
  for (const [name, def] of Object.entries(plugin.tool)) {
    for (const [argName, schema] of Object.entries(def.args)) {
      assert.equal(typeof schema.safeParse, 'function', `${name}.${argName} not Zod`);
      const r = schema.safeParse('test value');
      assert.ok(r.success === true || r.success === false, `${name}.${argName} safeParse failed`);
    }
  }
});

// ── 9. ERROR HANDLING EDGE CASES ──────────────────────────

test('[LIVE] delegate_many handles empty tasks', async () => {
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create() {
          return { data: { id: 's-e' } };
        },
        async prompt() {
          return { data: { parts: [{ type: 'text', text: 'ok' }] } };
        },
        async delete() {
          return { data: {} };
        },
      },
    },
  });
  const o = JSON.parse(
    await plugin.tool.delegate_many.execute({ tasks: [] }, { directory: repoRoot }),
  );
  assert.equal(o.results.length, 0);
  assert.equal(o.summary.total, 0);
});

test('[LIVE] research handles empty questions', async () => {
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create() {
          return { data: { id: 's-er' } };
        },
        async prompt() {
          return { data: { parts: [{ type: 'text', text: 'ok' }] } };
        },
        async delete() {
          return { data: {} };
        },
      },
    },
  });
  const o = JSON.parse(
    await plugin.tool.research.execute({ questions: [] }, { directory: repoRoot }),
  );
  assert.equal(o.findings.length, 0);
});

test('[LIVE] delegate — subagent creation failure is graceful', async () => {
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create() {
          throw new Error('API unavailable');
        },
      },
    },
  });
  const o = JSON.parse(
    await plugin.tool.delegate.execute(
      { task: 'Any', context: 'ctx', expected_output: 'done' },
      { directory: repoRoot },
    ),
  );
  assert.equal(o.status, 'blocked');
  assert.match(o.output, /API unavailable/);
});

// ── 10. DISPATCH SUBAGENT STATUS DETECTION ──────────────────

test('[LIVE] dispatch — BLOCKED status detection', async () => {
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create() {
          return { data: { id: 's-b' } };
        },
        async prompt() {
          return { data: { parts: [{ type: 'text', text: 'BLOCKED\nCannot proceed' }] } };
        },
        async delete() {
          return { data: {} };
        },
      },
    },
  });
  const o = JSON.parse(
    await plugin.tool.delegate.execute(
      { task: 'X', context: 'ctx', expected_output: 'done' },
      { directory: repoRoot },
    ),
  );
  assert.equal(o.status, 'blocked');
});

test('[LIVE] dispatch — NEEDS_CONTEXT status detection', async () => {
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create() {
          return { data: { id: 's-n' } };
        },
        async prompt() {
          return { data: { parts: [{ type: 'text', text: 'NEEDS_CONTEXT\nNeed endpoint URL' }] } };
        },
        async delete() {
          return { data: {} };
        },
      },
    },
  });
  const o = JSON.parse(
    await plugin.tool.delegate.execute(
      { task: 'Y', context: 'ctx', expected_output: 'done' },
      { directory: repoRoot },
    ),
  );
  assert.equal(o.status, 'needs_context');
});

test('[LIVE] dispatch — CONCERN status detection', async () => {
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create() {
          return { data: { id: 's-c' } };
        },
        async prompt() {
          return {
            data: { parts: [{ type: 'text', text: 'Done\nCONCERN: Performance may degrade' }] },
          };
        },
        async delete() {
          return { data: {} };
        },
      },
    },
  });
  const o = JSON.parse(
    await plugin.tool.delegate.execute(
      { task: 'Z', context: 'ctx', expected_output: 'done' },
      { directory: repoRoot },
    ),
  );
  assert.equal(o.status, 'done_with_concerns');
  assert.ok(o.concerns.length > 0);
  assert.match(o.concerns[0], /Performance/);
});

test('[LIVE] dispatch — session cleanup on prompt failure', async () => {
  let deletedId = null;
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create() {
          return { data: { id: 's-leak' } };
        },
        async prompt() {
          throw new Error('fail');
        },
        async delete(input) {
          deletedId = input.path.id;
          return { data: {} };
        },
      },
    },
  });
  const o = JSON.parse(
    await plugin.tool.delegate.execute(
      { task: 'Fail', context: 'ctx', expected_output: 'done' },
      { directory: repoRoot },
    ),
  );
  assert.equal(o.status, 'blocked');
  assert.equal(deletedId, 's-leak');
});

// ── 11. FILES CHANGED PARSING ──────────────────────────────

test('[LIVE] filesChanged — excludes numbered list items', async () => {
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create() {
          return { data: { id: 's-fc' } };
        },
        async prompt() {
          return {
            data: {
              parts: [
                {
                  type: 'text',
                  text: [
                    '## Summary',
                    '1. Fixed login crash',
                    '2. Added validation',
                    '',
                    'src/index.js',
                    'package.json',
                  ].join('\n'),
                },
              ],
            },
          };
        },
        async delete() {
          return { data: {} };
        },
      },
    },
  });
  const o = JSON.parse(
    await plugin.tool.delegate.execute(
      { task: 'Fix', context: 'ctx', expected_output: 'done' },
      { directory: repoRoot, worktree: repoRoot },
    ),
  );
  assert.equal(o.files_changed.includes('1. Fixed'), false);
  assert.equal(o.files_changed.includes('2. Added'), false);
  assert.ok(o.files_changed.includes('src/index.js'));
  assert.ok(o.files_changed.includes('package.json'));
});

test('[LIVE] filesChanged — matches extensionless paths with separators', async () => {
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create() {
          return { data: { id: 's-f2' } };
        },
        async prompt() {
          return {
            data: {
              parts: [
                {
                  type: 'text',
                  text: ['### Files', 'src/components/Header', 'src/index.js', 'Makefile'].join(
                    '\n',
                  ),
                },
              ],
            },
          };
        },
        async delete() {
          return { data: {} };
        },
      },
    },
  });
  const o = JSON.parse(
    await plugin.tool.delegate.execute(
      { task: 'Fix', context: 'ctx', expected_output: 'done' },
      { directory: repoRoot, worktree: repoRoot },
    ),
  );
  assert.ok(o.files_changed.includes('src/index.js'));
  assert.ok(o.files_changed.includes('src/components/Header'));
  assert.equal(o.files_changed.includes('Makefile'), false);
});

// ── 12. PLUGIN ENTRY POINT EXPORT ─────────────────────────

test('[LIVE] RegentPlugin is an async function', () => {
  assert.equal(typeof RegentPlugin, 'function');
  assert.equal(RegentPlugin.constructor.name, 'AsyncFunction');
});

test('[LIVE] RegentPlugin returns all required hooks', async () => {
  const plugin = await RegentPlugin({ client: {} });
  assert.equal(typeof plugin.config, 'function');
  assert.equal(typeof plugin['experimental.chat.messages.transform'], 'function');
  assert.equal(typeof plugin.tool, 'object');
  assert.equal(Object.keys(plugin.tool).length, 5);
});

// ── 13. RESEARCH SYNTHESIS ─────────────────────────────────

test('[LIVE] research synthesis includes addressed findings', async () => {
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create() {
          return { data: { id: 's-syn' } };
        },
        async prompt() {
          return { data: { parts: [{ type: 'text', text: 'Findings' }] } };
        },
        async delete() {
          return { data: {} };
        },
      },
    },
  });
  const o = JSON.parse(
    await plugin.tool.research.execute(
      { questions: [{ id: 'q1', question: 'What is Regent?' }] },
      { directory: repoRoot },
    ),
  );
  assert.match(o.synthesis, /Regent/);
});

test('[LIVE] research synthesis reports blocked questions', async () => {
  const plugin = await RegentPlugin({
    client: {
      session: {
        async create() {
          return { data: { id: 's-br' } };
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
  const o = JSON.parse(
    await plugin.tool.research.execute(
      { questions: [{ id: 'q1', question: 'Secret API' }] },
      { directory: repoRoot },
    ),
  );
  assert.match(o.synthesis, /Blocked/);
});
