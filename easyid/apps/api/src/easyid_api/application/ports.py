"""
Ports — abstract interfaces the application layer needs from the outside
world.

Concrete implementations live under `infrastructure/` (persistence,
messaging, storage, identity, observability). `bootstrap/container.py`
wires the two together at composition time. The shared domain package
(`easyid_domain`) never depends on this module.

Intentionally empty for now — ports land alongside the first real use case.
"""
