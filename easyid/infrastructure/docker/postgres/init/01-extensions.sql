-- Enable extensions the schema will rely on. Alembic can also do this later
-- via `op.execute("CREATE EXTENSION ...")` — this file simply gives us a
-- clean baseline on first-time volume init.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";
