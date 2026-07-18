"""
Infrastructure layer — concrete adapters for ports.

Organised by *kind of adapter*, not by technology:

- `persistence/`    — SQLAlchemy engine, sessions, ORM models, repositories
- `messaging/`      — queues / event buses (empty until first use case)
- `storage/`        — object / file storage (empty until first use case)
- `identity/`       — auth providers, JWKS, external IdPs (empty until first use case)
- `observability/`  — metrics / tracing exporters beyond process logging
                      (empty until first use case)

Process logging, DI composition, and request/tenant context live in
`bootstrap/` — they wire the app together rather than adapting an external
system.

May import SQLAlchemy, boto3, or any external library. Must not import from
`api/`.
"""
