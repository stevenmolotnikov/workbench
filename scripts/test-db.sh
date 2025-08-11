#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" >/dev/null 2>&1; pwd -P)"
REPO_ROOT="${SCRIPT_DIR:h}"

python3 "${SCRIPT_DIR}/test_db.py" | cat

# Point the app and drizzle to the SQLite DB
export DATABASE_DIALECT=sqlite
export DATABASE_URL="file:${SCRIPT_DIR}/test.db"

echo "DATABASE_URL set to ${DATABASE_URL}"
echo "To run migrations against SQLite, from web dir run:"
echo "  (cd \"${REPO_ROOT}/workbench/_web\" && bunx drizzle migrate)"


