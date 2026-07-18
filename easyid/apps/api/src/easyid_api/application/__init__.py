"""
Application layer.

Use cases and orchestration live here. This layer depends on the shared
domain model (`@easyid/domain`, consumed at the API boundary via
`@easyid/types`) and on abstract ports defined in `ports.py`; it never
imports from `infrastructure/` or `api/` directly.
"""
