import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { tool } from '@opencode-ai/plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const skillsDir = path.resolve(rootDir, '.opencode', 'skills');
const commandsDir = path.resolve(__dirname, '../commands');
const agentsDir = path.resolve(__dirname, '../agents');

let regentVersion = 'unknown';
try {
  const pkgPath = path.join(rootDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    regentVersion = pkg.version || 'unknown';
  }
} catch {
  /* version non-critical */
}

/** @typedef {Record<string, string | boolean>} Frontmatter */
/** @typedef {{ name: string, frontmatter: Frontmatter, body: string }} MdAsset */

// ── Frontmatter extraction ──────────────────────────────────
/** @param {string} content @returns {Frontmatter} */
const parseFrontmatter = (content) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return {};

  /** @type {Frontmatter} */
  const result = {};
  let currentKey = /** @type {string | null} */ (null);
  let currentValue = '';

  for (const line of match[1].split(/\r?\n/)) {
    const parsed = line.match(/^(\w+):\s*(.*)$/);
    if (parsed) {
      if (currentKey !== null) {
        result[currentKey] = currentValue;
      }
      currentKey = parsed[1];
      currentValue = parsed[2].trim();
    } else if (currentKey !== null && line.trim()) {
      currentValue += ' ' + line.trim();
    }
  }
  if (currentKey !== null) {
    result[currentKey] = currentValue;
  }

  for (const [key, value] of Object.entries(result)) {
    if (typeof value !== 'string') continue;
    if (value === 'true') result[key] = true;
    else if (value === 'false') result[key] = false;
    else if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      result[key] = value.slice(1, -1);
    }
  }

  return result;
};

/** @param {string} content @returns {string} */
const extractContent = (content) => {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  return match ? match[1] : content;
};

/** @param {string} msg */
const log = (msg) => {
  console.error(`[regent v${regentVersion}] ${msg}`);
};

/** @param {string} dir @returns {MdAsset[]} */
const readMarkdownAssets = (dir) => {
  try {
    if (!fs.existsSync(dir)) {
      log(`directory not found: ${dir}`);
      return [];
    }
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => {
        const filePath = path.join(dir, entry.name);
        const raw = fs.readFileSync(filePath, 'utf8');
        return {
          name: entry.name.slice(0, -3),
          frontmatter: parseFrontmatter(raw),
          body: extractContent(raw).trim(),
        };
      });
  } catch (err) {
    log(`error reading ${dir}: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  }
};

/** @returns {Array<{ name: string, config: Record<string, unknown> }>} */
const discoverBundledCommands = () =>
  readMarkdownAssets(commandsDir)
    .filter((command) => command.body)
    .map((command) => ({
      name: command.name,
      config: {
        description: command.frontmatter.description || command.name.replace(/-/g, ' '),
        template: command.body,
        ...(typeof command.frontmatter.subtask === 'boolean'
          ? { subtask: command.frontmatter.subtask }
          : {}),
        ...(typeof command.frontmatter.agent === 'string'
          ? { agent: command.frontmatter.agent }
          : {}),
        ...(typeof command.frontmatter.model === 'string'
          ? { model: command.frontmatter.model }
          : {}),
        ...(typeof command.frontmatter.variant === 'string'
          ? { variant: command.frontmatter.variant }
          : {}),
      },
    }));

/** @returns {Array<{ name: string, config: Record<string, unknown> }>} */
const discoverBundledAgents = () =>
  readMarkdownAssets(agentsDir)
    .filter((agent) => agent.body && agent.frontmatter.description)
    .map((agent) => ({
      name: agent.name,
      config: {
        description: agent.frontmatter.description,
        mode: agent.frontmatter.mode || 'subagent',
        prompt: agent.body,
        ...(typeof agent.frontmatter.model === 'string' ? { model: agent.frontmatter.model } : {}),
        ...(typeof agent.frontmatter.variant === 'string'
          ? { variant: agent.frontmatter.variant }
          : {}),
        ...(typeof agent.frontmatter.color === 'string' ? { color: agent.frontmatter.color } : {}),
        ...(typeof agent.frontmatter.hidden === 'boolean'
          ? { hidden: agent.frontmatter.hidden }
          : {}),
      },
    }));

// ── Bootstrap cache ──────────────────────────────────────────
/** @type {string | null | undefined} */
let bootstrapCache;

const getBootstrap = () => {
  if (bootstrapCache !== undefined) return bootstrapCache;

  const skillPath = path.join(skillsDir, 'using-regent', 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    bootstrapCache = null;
    return null;
  }

  const content = extractContent(fs.readFileSync(skillPath, 'utf8'));

  let constitutionText = '';
  const constitutionPath = path.join(rootDir, 'CONSTITUTION.md');
  if (fs.existsSync(constitutionPath)) {
    constitutionText = fs.readFileSync(constitutionPath, 'utf8');
  }

  bootstrapCache = `<EXTREMELY_IMPORTANT>
${content}

${constitutionText}

## Regent Version
Regent v${regentVersion}
</EXTREMELY_IMPORTANT>`;

  return bootstrapCache;
};

// ── Shared subagent dispatch ─────────────────────────────────
/**
 * @param {{ session: { create: Function, prompt: Function, delete: Function } }} client
 * @param {string} task
 * @param {string} context
 * @param {string} expectedOutput
 * @param {{ directory?: string, worktree?: string }} [toolContext]
 * @returns {Promise<{ status: string, output: string, concerns: string[], files_changed: string[] }>}
 */
async function dispatchSubagent(client, task, context, expectedOutput, toolContext = {}) {
  let session;
  try {
    const sessionResult = await client.session.create({
      ...(toolContext.directory ? { query: { directory: toolContext.directory } } : {}),
      body: {
        title: `regent v${regentVersion}: ${task.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 50)}`,
      },
    });
    session = sessionResult.data ?? sessionResult;

    const prompt = [
      `## Task`,
      task,
      ``,
      `## Context`,
      context,
      ``,
      `## Expected Output`,
      expectedOutput,
      ``,
      `Complete the task. When you finish, provide:`,
      `1. A brief summary of what you did`,
      `2. Any concerns or issues encountered`,
      `3. List of files changed`,
      ``,
      `If you need more context, say NEEDS_CONTEXT and explain what you need.`,
      `If you cannot complete the task, say BLOCKED and explain why.`,
    ].join('\n');

    const result = await client.session.prompt({
      path: { id: session.id },
      ...(toolContext.directory ? { query: { directory: toolContext.directory } } : {}),
      body: {
        agent: 'regent-general',
        parts: [{ type: 'text', text: prompt }],
      },
    });
    const message = result.data ?? result;

    const responseText =
      message.parts
        ?.filter((p) => p.type === 'text')
        .map((p) => p.text)
        .filter(Boolean)
        .join('\n') || '';

    let status = 'done';
    let output = responseText;
    let concerns = [];

    if (responseText.includes('BLOCKED')) {
      status = 'blocked';
    } else if (responseText.includes('NEEDS_CONTEXT')) {
      status = 'needs_context';
    } else if (responseText.includes('CONCERN:')) {
      status = 'done_with_concerns';
      concerns =
        responseText.match(/CONCERN:.*$/gm)?.map((c) => c.replace('CONCERN:', '').trim()) || [];
    }

    const filesChanged = (() => {
      const pathPattern =
        /(?:^|\n)(?:[\w./\\-]+\.[a-zA-Z0-9]+|[\w.-]+(?:[\\/][\w.-]+)+(?:\.[a-zA-Z0-9]+)?)/gm;
      const matches = responseText.match(pathPattern);
      return (matches || [])
        .map((f) => f.trim())
        .filter(
          (f) =>
            !f.startsWith('CONCERN:') &&
            !f.startsWith('NEEDS_CONTEXT') &&
            !f.startsWith('BLOCKED') &&
            !/^\d+\.\s/.test(f),
        )
        .slice(0, 20);
    })();

    return { status, output, concerns, files_changed: filesChanged };
  } catch (err) {
    return {
      status: 'blocked',
      output: `Subagent error: ${err instanceof Error ? err.message : String(err)}`,
      concerns: [],
      files_changed: [],
    };
  } finally {
    if (session?.id) {
      try {
        await client.session.delete({
          path: { id: session.id },
          ...(toolContext.directory ? { query: { directory: toolContext.directory } } : {}),
        });
      } catch {
        /* cleanup failure is non-fatal */
      }
    }
  }
}

// ── Plugin export ────────────────────────────────────────────
/** @param {{ client: { session: { create: Function, prompt: Function, delete: Function } } }} params */
export const RegentPlugin = async ({ client }) => {
  return {
    // Register skills path so OpenCode discovers regent skills
    /** @param {{ skills?: { paths?: string[] }, command?: Record<string, unknown>, agent?: Record<string, unknown> }} config */
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }

      config.command = config.command || /** @type {Record<string, unknown>} */ ({});
      for (const command of discoverBundledCommands()) {
        if (!config.command[command.name]) {
          config.command[command.name] = command.config;
        }
      }

      config.agent = config.agent || /** @type {Record<string, unknown>} */ ({});
      for (const agent of discoverBundledAgents()) {
        if (!config.agent[agent.name]) {
          config.agent[agent.name] = agent.config;
        }
      }
    },

    // Inject bootstrap into first user message
    'experimental.chat.messages.transform': async (_input, output) => {
      const bootstrap = getBootstrap();
      if (!bootstrap || !output.messages.length) return;

      const firstUser = output.messages.find((m) => m.info?.role === 'user');
      if (!firstUser?.parts?.length) return;

      // Guard: skip if any text part at any position already has the marker
      const allText = output.messages
        .flatMap((m) => m.parts || [])
        .filter((p) => p.type === 'text')
        .map((p) => p.text)
        .join('');
      if (allText.includes('EXTREMELY_IMPORTANT')) return;

      firstUser.text = firstUser.text || '';
      firstUser.parts.unshift({
        type: 'text',
        text: bootstrap,
      });
    },

    // ── 5 Custom Tools ──────────────────────────────────────
    tool: {
      // 1. delegate — single subagent
      delegate: tool({
        description:
          'Dispatch a single focused task to a subagent. Returns structured result with status (done, blocked, needs_context). Use when a task is well-defined and self-contained.',
        args: {
          task: tool.schema.string().describe('The specific task for the subagent to complete'),
          context: tool.schema
            .string()
            .describe('Background context: files, architecture, decisions, constraints'),
          expected_output: tool.schema
            .string()
            .describe('What done looks like: file list, test output, decision'),
        },
        async execute(args, context) {
          const result = await dispatchSubagent(
            client,
            args.task,
            args.context,
            args.expected_output,
            context,
          );
          return JSON.stringify(result);
        },
      }),

      // 2. delegate_many — parallel multi-subagent
      delegate_many: tool({
        description:
          'Dispatch multiple independent tasks to subagents in PARALLEL. All tasks run simultaneously via Promise.all. Use for tasks that have no dependencies on each other.',
        args: {
          tasks: tool.schema
            .array(
              tool.schema.object({
                id: tool.schema.string().describe('Unique identifier for this task'),
                task: tool.schema.string().describe('What this subagent should do'),
                context: tool.schema.string().describe('Background context for this task'),
                expected_output: tool.schema
                  .string()
                  .describe('What done looks like for this task'),
              }),
            )
            .describe('Array of independent tasks to run in parallel'),
        },
        async execute(args, context) {
          const results = await Promise.all(
            args.tasks.map(async (t) => {
              const result = await dispatchSubagent(
                client,
                t.task,
                t.context,
                t.expected_output,
                context,
              );
              return { id: t.id, ...result };
            }),
          );

          return JSON.stringify({
            results,
            summary: {
              total: results.length,
              completed: results.filter(
                (r) => r.status === 'done' || r.status === 'done_with_concerns',
              ).length,
              failed: results.filter((r) => r.status === 'blocked').length,
              needs_context: results.filter((r) => r.status === 'needs_context').length,
            },
          });
        },
      }),

      // 3. research — parallel research
      research: tool({
        description:
          'Research multiple questions in parallel by dispatching independent research subagents. Each question gets a focused agent. Returns combined findings with synthesis.',
        args: {
          questions: tool.schema
            .array(
              tool.schema.object({
                id: tool.schema.string().describe('Unique identifier'),
                question: tool.schema.string().describe('The question to research'),
                scope: tool.schema.string().optional().describe('Optional narrowing scope'),
              }),
            )
            .describe('Questions to research in parallel'),
        },
        async execute(args, context) {
          const results = await Promise.all(
            args.questions.map(async (q) => {
              const task = `Research this question thoroughly:\n${q.question}`;
              const taskContext = q.scope
                ? `Scope: ${q.scope}`
                : 'Be thorough and concise. Return key findings, data points, and sources.';
              const result = await dispatchSubagent(
                client,
                task,
                taskContext,
                'Key findings, data points, sources, and recommendations',
                context,
              );
              return { id: q.id, question: q.question, ...result };
            }),
          );

          const completed = results.filter(
            (r) => r.status === 'done' || r.status === 'done_with_concerns',
          );
          const blocked = results.filter((r) => r.status === 'blocked');
          const needsContext = results.filter((r) => r.status === 'needs_context');

          const summaryParts = [];
          const findingsList = completed.map((r) => r.question);
          if (findingsList.length > 0) {
            summaryParts.push(`Addressed: ${findingsList.join(', ')}`);
          }
          if (blocked.length > 0) {
            summaryParts.push(`Blocked: ${blocked.map((r) => r.question).join(', ')}`);
          }
          if (needsContext.length > 0) {
            summaryParts.push(`Needs context: ${needsContext.map((r) => r.question).join(', ')}`);
          }

          return JSON.stringify({
            findings: results,
            synthesis:
              summaryParts.length > 0
                ? summaryParts.join('. ') + '.'
                : 'No research results returned.',
          });
        },
      }),

      // 4. explore — codebase analysis
      explore: tool({
        description:
          'Analyze the project codebase to answer structural questions. Uses SDK file operations to understand directory layout, key files, and patterns. Call this before planning to understand what exists.',
        args: {
          query: tool.schema
            .string()
            .describe(
              'What to understand: "project structure", "API routes", "database schema", "component tree"',
            ),
          focus: tool.schema
            .string()
            .optional()
            .describe('Optional narrowing: directory path, file pattern, or topic'),
        },
        async execute(args, context) {
          const worktree = context?.directory || context?.worktree || '';
          if (!worktree) {
            return JSON.stringify({
              structure:
                'Error: Cannot determine project directory. OpenCode runtime did not provide context.directory or context.worktree.',
              summary: 'Exploration requires context.directory or context.worktree',
            });
          }
          let result = `Codebase exploration for: ${args.query}\n\n`;

          // Top-level listing
          try {
            const items = fs.readdirSync(worktree, { withFileTypes: true });
            result += '## Top-level contents\n';
            for (const item of items) {
              if (item.name.startsWith('.') && item.name !== '.gitignore') continue;
              result += `${item.isDirectory() ? '/' : ''} ${item.name}\n`;
            }
            result += '\n';
          } catch {
            /* ignore read errors */
          }

          // Walk src/ if it exists (up to 3 levels)
          try {
            const srcDir = path.join(worktree, 'src');
            if (fs.existsSync(srcDir)) {
              result += '## src/ directory\n';
              /** @param {string} dir @param {number} depth */
              const walk = (dir, depth) => {
                if (depth > 3) return;
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                  if (entry.name.startsWith('.')) continue;
                  const full = path.join(dir, entry.name);
                  const indent = '  '.repeat(depth);
                  if (entry.isDirectory()) {
                    result += `${indent}${entry.name}/\n`;
                    walk(full, depth + 1);
                  } else {
                    result += `${indent}${entry.name}\n`;
                  }
                }
              };
              walk(srcDir, 0);
            }
          } catch {
            /* ignore read errors */
          }

          // Focus path
          if (args.focus) {
            const worktreeRoot = path.resolve(worktree);
            const focusPath = path.resolve(worktree, args.focus);
            if (!focusPath.startsWith(worktreeRoot + path.sep) && focusPath !== worktreeRoot) {
              result += `\n## Focus: ${args.focus}\n(path outside project directory)\n`;
            } else if (fs.existsSync(focusPath)) {
              const stat = fs.statSync(focusPath);
              if (stat.isDirectory()) {
                const items = fs.readdirSync(focusPath);
                result += items.join('\n') + '\n';
              } else {
                try {
                  const content = fs.readFileSync(focusPath, 'utf8').slice(0, 3000);
                  result += '```\n' + content + '\n```\n';
                } catch {
                  result += '(path not found)\n';
                }
              }
            } else {
              result += '(path not found)\n';
            }
          }

          return JSON.stringify({ structure: result, summary: `Explored ${args.query}` });
        },
      }),

      // 5. verify — compliance check
      verify: tool({
        description:
          'Compare implementation against requirements. Returns structured pass/fail per requirement, flags extras (YAGNI). Use after execution to check if work meets the plan.',
        args: {
          requirements: tool.schema
            .string()
            .describe('The spec, plan, or requirements text — line by line requirements'),
          implementation_context: tool.schema
            .string()
            .describe('What was built: file list, summary of changes, or diff'),
        },
        async execute(args) {
          if (!args || args.requirements == null || args.implementation_context == null) {
            return JSON.stringify({
              compliant: false,
              requirements_met: [],
              requirements_unmet: [],
              extras_built: [],
              summary:
                'Missing required arguments: provide "requirements" and "implementation_context"',
            });
          }

          /** @param {string} s */
          const getKeyBigrams = (s) => {
            const words = s
              .toLowerCase()
              .split(/\s+/)
              .filter((w) => w.length > 3);
            const bigrams = /** @type {string[]} */ ([]);
            for (let i = 0; i < words.length - 1; i++) {
              bigrams.push(words[i] + ' ' + words[i + 1]);
            }
            return bigrams;
          };

          /** @param {string} s */
          const getKeyUnigrams = (s) =>
            s
              .toLowerCase()
              .split(/\s+/)
              .filter((w) => w.length > 3);

          /** @param {string} s */
          const stripCheckbox = (s) =>
            s
              .replace(/^[-*]\s*\[\s*[x ]?\s*\]\s*/i, '')
              .replace(/^[-*\d+.]\s+/, '')
              .trim();

          const reqs = args.requirements
            .split('\n')
            .map((r) => stripCheckbox(r))
            .filter((r) => r.length > 2 && !r.startsWith('#') && !r.startsWith('```'));

          const impl = args.implementation_context.toLowerCase();

          const met = [];
          const unmet = [];

          for (const req of reqs) {
            const reqBigrams = getKeyBigrams(req);
            const reqUnigrams = getKeyUnigrams(req);
            let found;
            if (reqBigrams.length > 0) {
              found = reqBigrams.some((b) => impl.includes(b));
            } else {
              found = reqUnigrams.some((w) => impl.includes(w));
            }
            if (found) {
              met.push(req);
            } else {
              unmet.push(req);
            }
          }

          const implLines = args.implementation_context
            .split('\n')
            .map((l) => stripCheckbox(l))
            .filter((l) => l.length > 3 && !l.startsWith('#') && !l.startsWith('```'));

          const extras = implLines.filter((line) => {
            const lineLower = line.toLowerCase();
            return !reqs.some((req) => {
              const reqBigrams = getKeyBigrams(req);
              const reqUnigrams = getKeyUnigrams(req);
              if (reqBigrams.length > 0) {
                return reqBigrams.some((b) => lineLower.includes(b));
              }
              return reqUnigrams.some((w) => lineLower.includes(w));
            });
          });

          return JSON.stringify({
            compliant: unmet.length === 0,
            requirements_met: met,
            requirements_unmet: unmet,
            extras_built: extras,
            summary: `${met.length}/${reqs.length} requirements met, ${extras.length} extras flagged`,
          });
        },
      }),
    },
  };
};
