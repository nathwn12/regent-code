import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { tool } from '@opencode-ai/plugin';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.resolve(__dirname, '../../skills');
const commandsDir = path.resolve(__dirname, '../commands');
const agentsDir = path.resolve(__dirname, '../agent');

// ── Frontmatter extraction ──────────────────────────────────
const parseFrontmatter = (content) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return {};

  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const parsed = line.match(/^(\w+):\s*(.*)$/);
    if (!parsed) continue;

    let value = parsed[2].trim();
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[parsed[1]] = value;
  }
  return result;
};

const extractContent = (content) => {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  return match ? match[1] : content;
};

const readMarkdownAssets = (dir) => {
  try {
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
  } catch {
    return [];
  }
};

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
let bootstrapCache;

const getBootstrap = () => {
  if (bootstrapCache !== undefined) return bootstrapCache;

  const skillPath = path.join(skillsDir, 'using-regent', 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    bootstrapCache = null;
    return null;
  }

  const content = extractContent(fs.readFileSync(skillPath, 'utf8'));

  bootstrapCache = `<EXTREMELY_IMPORTANT>
${content}
</EXTREMELY_IMPORTANT>`;

  return bootstrapCache;
};

// ── Shared subagent dispatch ─────────────────────────────────
async function dispatchSubagent(client, task, context, expectedOutput, toolContext = {}) {
  try {
    const sessionResult = await client.session.create({
      ...(toolContext.directory ? { query: { directory: toolContext.directory } } : {}),
      body: { title: `regent: ${task.replace(/[^a-zA-Z0-9 ]/g, '').slice(0, 60)}` },
    });
    const session = sessionResult.data ?? sessionResult;

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

    await client.session.delete({
      path: { id: session.id },
      ...(toolContext.directory ? { query: { directory: toolContext.directory } } : {}),
    });

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

    const filesChanged =
      responseText
        .match(/(?:^|\n)(?:[\w.\-/\\]+\.[a-zA-Z0-9]+)/gm)
        ?.map((f) => f.trim())
        .filter(
          (f) =>
            !f.startsWith('CONCERN:') && !f.startsWith('NEEDS_CONTEXT') && !f.startsWith('BLOCKED'),
        )
        .slice(0, 20) || [];

    return { status, output, concerns, files_changed: filesChanged };
  } catch (err) {
    return { status: 'blocked', output: `Subagent error: ${err.message}`, concerns: [] };
  }
}

// ── Plugin export ────────────────────────────────────────────
export const RegentPlugin = async ({ client }) => {
  return {
    // Register skills path so OpenCode discovers regent skills
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }

      config.command = config.command || {};
      for (const command of discoverBundledCommands()) {
        if (!config.command[command.name]) {
          config.command[command.name] = command.config;
        }
      }

      config.agent = config.agent || {};
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

          return JSON.stringify({
            findings: results,
            synthesis: 'Research complete. Review individual findings above.',
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
          const worktree = context?.worktree || context?.directory || process.cwd();
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
            const focusPath = path.resolve(worktree, args.focus);
            result += `\n## Focus: ${args.focus}\n`;
            if (fs.existsSync(focusPath)) {
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
          if (!args?.requirements || !args?.implementation_context) {
            return JSON.stringify({
              compliant: false,
              requirements_met: [],
              requirements_unmet: [],
              extras_built: [],
              summary:
                'Missing required arguments: provide "requirements" and "implementation_context"',
            });
          }

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
            const reqLower = req.toLowerCase();
            const found = reqLower
              .split(/\s+/)
              .some((word) => word.length > 3 && impl.includes(word));
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
              const reqWords = req
                .toLowerCase()
                .split(/\s+/)
                .filter((w) => w.length > 3);
              return reqWords.some((w) => lineLower.includes(w));
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
