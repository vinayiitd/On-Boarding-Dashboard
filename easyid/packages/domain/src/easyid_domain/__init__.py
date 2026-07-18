"""
easyid_domain — the shared domain layer for the easyID platform.

Entities, value objects, and pure business rules live here and nowhere
else. The FastAPI service (`apps/api`) is the sole runtime consumer;
the web app never imports this package — it consumes the domain only
through the HTTP contract in `@easyid/types`.

Rules
-----
- Framework-independent. No FastAPI, no SQLAlchemy, no I/O of any kind.
- No Pydantic for entity modelling. Pydantic models belong at the HTTP
  boundary in `apps/api` (and are mirrored for the web in `@easyid/types`).
- Every function must be trivially unit-testable.

See docs/adr/0003-domain-is-a-python-package.md for the rationale.
"""

__all__: list[str] = []
