"""
Ports — abstract interfaces the application layer needs from the outside
world.

Concrete implementations live in `infrastructure/`. `api/` wires the two
together at composition time. `domain/` never depends on this module.

Intentionally empty for now — ports land alongside the first real use case.
"""
