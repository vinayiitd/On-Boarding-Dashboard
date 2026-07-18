"""
Persistence mappings (ORM table classes).

Do **not** name this package `models`. Mappings are infrastructure
persistence concerns — not domain models. Import every concrete mapping
module here so Alembic's `env.py` and metadata discovery see all tables.

FND-003 ships no business mappings (no Organisation, Party, User, etc.).
"""

# Import concrete mapping modules below as they are added, e.g.:
# from easyid_api.infrastructure.persistence.mappings import example  # noqa: F401

__all__: list[str] = []
