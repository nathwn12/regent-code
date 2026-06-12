# Installation

## Add to opencode.jsonc

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["regent@git+https://github.com/nathwn12/regent.git#v2.1.0"],
}
```

## Use Latest Branch

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["regent@git+https://github.com/nathwn12/regent.git"],
}
```

The pinned version is recommended. Use the unpinned branch only when you intentionally want the latest changes.

Requires an OpenCode version that supports git plugin specs. If plugin loading fails, use the troubleshooting checks below and report your OpenCode version.

## Verify

Start a new session. The AutoPowers bootstrap injects automatically. Run `/orchestrate` to test.

## Troubleshooting

**Plugin not loading:**

- Make sure the URL is correct and the repo is accessible
- Restart the OpenCode session

**Skills not found:**

- Verify the plugin installed correctly — check `~/.cache/opencode/packages/regent@git+https_*/node_modules/regent/skills/`

**Orchestrator not auto-triggering:**

- The orchestrator loads on `/orchestrate` or when user states a goal
- The bootstrap skill injects into the first user message of every session
