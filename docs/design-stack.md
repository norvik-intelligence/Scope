# Premium Website Design Tech Stack

This project ships with a curated **design tech stack** for [Claude Code](https://claude.com/claude-code) so the AI builds intentional, premium interfaces instead of generic, templated "AI slop."

It's the stack popularised in [@nateherkai's](https://www.tiktok.com/@nateherkai) walkthrough: a set of Agent Skills that give the model design *taste* and *vocabulary*, plus two MCP servers so it can pull real design references and see what it built.

## What's installed

### Agent Skills — `.claude/skills/`

Installed as real files (copied, not symlinked) via the [`skills` CLI](https://github.com/vercel-labs/skills), so they are committed with the repo and Claude Code auto-loads them each session.

| Source | Skills | Purpose |
| --- | --- | --- |
| **Emil Kowalski** — [`emilkowalski/skill`](https://github.com/emilkowalski/skill) | `emil-design-eng`, `apple-design`, `animation-vocabulary`, `find-animation-opportunities`, `improve-animations`, `review-animations`, `pick-ui-library` | UI polish + animation fluency distilled from [animations.dev](https://animations.dev). Sub-300ms motion, custom easing, "does this even deserve an animation?" |
| **Impeccable** — [`pbakaus/impeccable`](https://github.com/pbakaus/impeccable) | `impeccable` | Design vocabulary + commands (polish, audit, critique, distill, bolder, quieter…). Forces design context before generating code. |
| **Taste Skill** — [`Leonxlnx/taste-skill`](https://github.com/Leonxlnx/taste-skill) ([tasteskill.dev](https://www.tasteskill.dev)) | `design-taste-frontend`, `high-end-visual-design`, `redesign-existing-projects`, `full-output-enforcement`, `imagegen-frontend-web`, `brandkit`, `minimalist-ui`, `industrial-brutalist-ui` | Anti-slop frontend direction: real design systems, editorial typography, generous spacing, premium detailing. |

The exact versions are pinned in [`skills-lock.json`](../skills-lock.json).

### MCP servers — `.mcp.json`

| Server | Package | Purpose |
| --- | --- | --- |
| **Figma** | `figma-developer-mcp` | Pull colors, type, spacing and layout from real Figma files as design reference/inspiration. Requires `FIGMA_API_KEY`. |
| **Playwright** | `@playwright/mcp` | Let Claude open the running site in a real browser, screenshot it, and iterate on spacing/layout by *looking* at the result. |

> The Figma server is optional — the skills alone solve the generic-design problem. Add a token only when you want to import from Figma.

## Using it in this project

1. **Add a Figma token** (optional). Copy `.env.example` to `.env` and set:
   ```
   FIGMA_API_KEY=figd_your_token_here
   ```
   Create a token at <https://www.figma.com/developers/api#access-tokens> (read-only scopes are enough).
2. **Restart Claude Code** so it loads `.claude/skills/` and `.mcp.json`.
3. **Ask for design work.** The skills trigger automatically on design tasks, or invoke them by name:
   ```
   Redesign the hero. Use design-taste-frontend and impeccable, keep it in the
   existing palette, then open it in Playwright and tighten the vertical rhythm.
   ```

## Applying it to future website projects

Run the bootstrap script from the root of any new project:

```bash
bash scripts/setup-design-stack.sh
```

It installs every skill above into that project's `.claude/skills/` and writes a `.mcp.json` (without overwriting an existing one). Copy `scripts/setup-design-stack.sh` into the new repo first if you're starting from scratch.

To update the skills later:

```bash
npx skills update --project
```

## Notes

- Skills run with full agent permissions. They're third-party — skim `.claude/skills/**/SKILL.md` before relying on them.
- In this managed web environment, global (`~/.claude`) installs don't persist between sessions, which is why the stack is committed into the repo instead. That also makes it portable: anything cloned from here already has the stack.
- Playwright's browser is preinstalled in the Claude Code web environment; locally, `npx playwright install chromium` once if prompted.
