#!/usr/bin/env bash
#
# setup-design-stack.sh
# ---------------------
# Installs the "premium website" design tech stack into the CURRENT project so
# Claude Code stops shipping generic AI-slop UI and builds intentional, premium
# designs instead.
#
# What it installs (all as version-controllable project files):
#   1. Emil Kowalski skills   -> animation + design-engineering fluency
#   2. Taste Skill            -> anti-slop, high-end frontend direction
#   3. Impeccable             -> design vocabulary / critique / polish commands
#   4. .mcp.json              -> Figma MCP (design import) + Playwright MCP (view/test)
#
# Usage:
#   From the root of any project:
#     bash scripts/setup-design-stack.sh
#
#   Copy it into a new project first, then run it:
#     curl -fsSL <raw-url>/setup-design-stack.sh -o setup-design-stack.sh
#     bash setup-design-stack.sh
#
# Re-running is safe: `npx skills add` updates in place, and the .mcp.json step
# never overwrites an existing file (it prints the block to merge instead).
#
# Requirements: Node.js 18+ (for npx). No global installs are performed.

set -euo pipefail

AGENT="claude-code"
SKILLS_CLI="skills@latest"

info()  { printf '\033[1;36m›\033[0m %s\n' "$1"; }
ok()    { printf '\033[1;32m✓\033[0m %s\n' "$1"; }
warn()  { printf '\033[1;33m!\033[0m %s\n' "$1"; }

if ! command -v npx >/dev/null 2>&1; then
  echo "npx (Node.js 18+) is required but was not found on PATH." >&2
  exit 1
fi

info "Installing design skills into ./.claude/skills (copied, so they commit with the repo)"

# repo -> space-separated skill names ("*" means every skill in the repo)
add_skills() {
  local repo="$1"; shift
  local skills=("$@")
  for skill in "${skills[@]}"; do
    info "  $repo :: $skill"
    npx --yes "$SKILLS_CLI" add "$repo" --skill "$skill" -a "$AGENT" --copy -y >/dev/null 2>&1 \
      && ok "  installed $skill" \
      || warn "  could not install $skill (skipped)"
  done
}

# 1. Emil Kowalski — animation + design engineering (all 7 skills)
add_skills "emilkowalski/skill" "*"

# 2. Impeccable — design fluency / critique / polish
add_skills "pbakaus/impeccable" "*"

# 3. Taste Skill — anti-slop premium frontend (curated web-relevant subset)
add_skills "Leonxlnx/taste-skill" \
  "design-taste-frontend" \
  "high-end-visual-design" \
  "redesign-existing-projects" \
  "full-output-enforcement" \
  "imagegen-frontend-web" \
  "brandkit" \
  "minimalist-ui" \
  "industrial-brutalist-ui"

ok "Skills installed."

# 4. MCP servers: Figma (design import) + Playwright (browser view/test)
MCP_FILE=".mcp.json"
read -r -d '' MCP_BLOCK <<'JSON' || true
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"]
    },
    "figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": {
        "FIGMA_API_KEY": "${FIGMA_API_KEY}"
      }
    }
  }
}
JSON

if [ -f "$MCP_FILE" ]; then
  warn "$MCP_FILE already exists — not overwriting. Merge these servers if missing:"
  printf '%s\n' "$MCP_BLOCK"
else
  printf '%s\n' "$MCP_BLOCK" > "$MCP_FILE"
  ok "Wrote $MCP_FILE (Figma + Playwright MCP)."
fi

cat <<'NEXT'

Done. Next steps:
  1. Add a Figma token to .env (or your shell):  FIGMA_API_KEY=figd_...
     Get one at https://www.figma.com/developers/api#access-tokens
  2. Restart Claude Code so it picks up ./.claude/skills and .mcp.json.
  3. Ask for a build, e.g.:
       "Build the landing page. Use the design-taste-frontend and impeccable
        skills, pull the palette from this Figma file <url>, then open it in
        Playwright and tighten the spacing."

The Figma MCP is optional — the skills alone stop the generic-design problem.
NEXT
