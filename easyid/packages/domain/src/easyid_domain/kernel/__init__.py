"""
Domain kernel — reusable building blocks for Clean Architecture / DDD.

Contains no business concepts. Bounded-context entities and rules compose
these primitives in later foundations.
"""

from easyid_domain.kernel.aggregate import AggregateRoot
from easyid_domain.kernel.clock import Clock, FixedClock, SystemClock
from easyid_domain.kernel.domain_event import DomainEvent
from easyid_domain.kernel.entity import Entity
from easyid_domain.kernel.errors import (
    ConflictError,
    DomainError,
    InvariantViolationError,
    ValidationError,
)
from easyid_domain.kernel.identity import Identifier, new_id, parse_id
from easyid_domain.kernel.result import Err, Ok, Result, err, ok
from easyid_domain.kernel.specification import Specification
from easyid_domain.kernel.value_object import ValueObject

__all__ = [
    "AggregateRoot",
    "Clock",
    "ConflictError",
    "DomainError",
    "DomainEvent",
    "Entity",
    "Err",
    "FixedClock",
    "Identifier",
    "InvariantViolationError",
    "Ok",
    "Result",
    "Specification",
    "SystemClock",
    "ValidationError",
    "ValueObject",
    "err",
    "new_id",
    "ok",
    "parse_id",
]
