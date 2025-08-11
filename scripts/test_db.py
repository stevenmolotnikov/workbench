#!/usr/bin/env python3
import os
import sqlite3
from pathlib import Path


def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    db_dir = repo_root / "scripts"
    db_dir.mkdir(parents=True, exist_ok=True)
    db_path = db_dir / "test.db"

    conn = sqlite3.connect(db_path.as_posix())
    try:
        cur = conn.cursor()
        # Simple probe table so file exists and is writable
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS __probe__ (
                id INTEGER PRIMARY KEY,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
        conn.commit()
    finally:
        conn.close()

    print(f"SQLite test DB ready at: {db_path}")
    print("Export this to use it with Drizzle:")
    print(f"  export DATABASE_DIALECT=sqlite && export DATABASE_URL=file:{db_path}")


if __name__ == "__main__":
    main()


