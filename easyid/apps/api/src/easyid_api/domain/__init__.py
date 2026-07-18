"""
Domain layer.

Contains entities, value objects, and pure domain services. This layer is
framework-independent:

- No FastAPI imports.
- No SQLAlchemy imports (ORM models live in `infrastructure/db/`).
- No I/O of any kind.

If a module here starts to require Pydantic or SQLAlchemy, it belongs in
`application/` or `infrastructure/` instead.
"""
