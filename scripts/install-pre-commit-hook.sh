#!/usr/bin/env bash
set -euo pipefail

HOOK_DIR=".git/hooks"
HOOK_FILE="$HOOK_DIR/pre-commit"

if [ ! -d ".git" ]; then
  echo "This repository does not have a .git directory here. Run this script from the repository root."
  exit 1
fi

mkdir -p "$HOOK_DIR"
cat > "$HOOK_FILE" <<'HOOK'
#!/usr/bin/env sh
# Pre-commit hook: verify repository files don't contain invisible/unicode control characters
pnpm verify:no-invisible-chars || { echo "Pre-commit: invisible/unicode control characters detected. Aborting commit."; exit 1; }
HOOK

chmod +x "$HOOK_FILE"
echo "Installed pre-commit hook at $HOOK_FILE"

echo "To enable repository-maintained hooks instead, consider using 'git config core.hooksPath .githooks' and committing .githooks/ instead."
