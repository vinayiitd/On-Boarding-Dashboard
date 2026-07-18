"""Unit tests for the domain kernel primitives."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest

from easyid_domain import (
    AggregateRoot,
    ConflictError,
    DomainError,
    DomainEvent,
    Entity,
    Err,
    FixedClock,
    Identifier,
    InvariantViolationError,
    NotFoundError,
    Ok,
    Specification,
    SystemClock,
    ValidationError,
    ValueObject,
    err,
    new_id,
    ok,
    parse_id,
)
from easyid_domain.kernel.identity import ID_STRATEGY


@dataclass(eq=False)
class _SampleEntity(Entity[UUID]):
    name: str


@dataclass(eq=False)
class _OtherEntity(Entity[UUID]):
    name: str


@dataclass(eq=False)
class _SampleAggregate(AggregateRoot[Identifier]):
    label: str


@dataclass(frozen=True, slots=True, kw_only=True)
class _SampleEvent(DomainEvent):
    payload: str


@dataclass(frozen=True, slots=True)
class _Money(ValueObject):
    amount: int
    currency: str

    def _validate(self) -> None:
        if self.amount < 0:
            raise ValidationError("amount must be non-negative")
        if len(self.currency) != 3:
            raise ValidationError("currency must be a 3-letter code")


class _PositiveAmount(Specification[_Money]):
    def is_satisfied_by(self, candidate: _Money) -> bool:
        return candidate.amount > 0


class _AudCurrency(Specification[_Money]):
    def is_satisfied_by(self, candidate: _Money) -> bool:
        return candidate.currency == "AUD"


# --- Identity -----------------------------------------------------------------


def test_new_id_returns_uuid() -> None:
    value = new_id()
    assert isinstance(value, UUID)
    assert ID_STRATEGY == "uuid4"


def test_parse_id_roundtrip() -> None:
    value = new_id()
    assert parse_id(str(value)) == value


def test_parse_id_rejects_invalid() -> None:
    with pytest.raises(ValueError):
        parse_id("not-a-uuid")


def test_identifier_generate_and_str() -> None:
    ident = Identifier.generate()
    assert isinstance(ident.value, UUID)
    assert str(ident) == str(ident.value)
    assert Identifier.from_str(str(ident)) == ident


# --- Entity -------------------------------------------------------------------


def test_entity_equality_is_identity_based() -> None:
    shared = uuid4()
    left = _SampleEntity(id=shared, name="a")
    right = _SampleEntity(id=shared, name="b")
    assert left == right
    assert hash(left) == hash(right)


def test_entity_inequality_different_ids() -> None:
    left = _SampleEntity(id=uuid4(), name="a")
    right = _SampleEntity(id=uuid4(), name="a")
    assert left != right


def test_entity_inequality_different_types() -> None:
    shared = uuid4()
    left = _SampleEntity(id=shared, name="a")
    right = _OtherEntity(id=shared, name="a")
    assert left != right


# --- ValueObject --------------------------------------------------------------


def test_value_object_equality_is_value_based() -> None:
    left = _Money(amount=100, currency="AUD")
    right = _Money(amount=100, currency="AUD")
    assert left == right
    assert hash(left) == hash(right)


def test_value_object_inequality() -> None:
    assert _Money(amount=100, currency="AUD") != _Money(amount=200, currency="AUD")


def test_value_object_validation() -> None:
    with pytest.raises(ValidationError, match="non-negative"):
        _Money(amount=-1, currency="AUD")


def test_value_object_is_frozen() -> None:
    money = _Money(amount=10, currency="AUD")
    with pytest.raises(AttributeError):
        money.amount = 20  # type: ignore[misc]


# --- AggregateRoot / DomainEvent ----------------------------------------------


def test_aggregate_collects_and_clears_events() -> None:
    aggregate = _SampleAggregate(id=Identifier.generate(), label="x")
    event = _SampleEvent(payload="hello")
    aggregate.raise_event(event)

    assert len(aggregate.pending_events) == 1
    collected = aggregate.collect_events()
    assert collected == (event,)
    # Second collect must be empty (events were drained).
    assert aggregate.collect_events() == collected[0:0]


def test_aggregate_clear_events() -> None:
    aggregate = _SampleAggregate(id=Identifier.generate(), label="x")
    aggregate.raise_event(_SampleEvent(payload="bye"))
    aggregate.clear_events()
    assert len(aggregate.pending_events) == 0


def test_domain_event_has_metadata() -> None:
    event = _SampleEvent(payload="p")
    assert isinstance(event.event_id, UUID)
    assert event.occurred_at.tzinfo is not None
    assert event.event_type == "_SampleEvent"


# --- Result -------------------------------------------------------------------


def test_result_ok_unwrap() -> None:
    result: Ok[int] | Err[str] = ok(42)
    assert result.is_ok()
    assert result.unwrap() == 42


def test_result_err_unwrap_err() -> None:
    result = err(ValidationError("bad"))
    assert result.is_err()
    assert isinstance(result.unwrap_err(), ValidationError)


def test_result_map_and_and_then() -> None:
    assert ok(2).map(lambda n: n * 3).unwrap() == 6
    chained: Ok[int] | Err[str] = ok(2).and_then(lambda n: ok(n + 1))
    assert chained.unwrap() == 3
    failed: Ok[int] | Err[str] = err("no").and_then(lambda _: ok(1))
    assert failed.is_err()


def test_result_unwrap_mismatches_raise() -> None:
    with pytest.raises(ValueError):
        ok(1).unwrap_err()
    with pytest.raises(ValueError):
        err("x").unwrap()


# --- DomainError --------------------------------------------------------------


def test_domain_error_hierarchy() -> None:
    assert isinstance(ValidationError("v"), ValidationError)
    assert isinstance(NotFoundError("n"), DomainError)
    assert ConflictError("c").code == "conflict"
    assert InvariantViolationError("i").code == "invariant_violation"


def test_domain_error_details_immutable() -> None:
    error = ValidationError("bad", details={"field": "x"})
    with pytest.raises(TypeError):
        error.details["field"] = "y"  # type: ignore[index]


def test_domain_error_can_be_raised() -> None:
    with pytest.raises(NotFoundError, match="missing"):
        raise NotFoundError("missing")


# --- Specification ------------------------------------------------------------


def test_specification_composition() -> None:
    money = _Money(amount=50, currency="AUD")
    spec = _PositiveAmount() & _AudCurrency()
    assert spec.is_satisfied_by(money)
    assert not (~_PositiveAmount()).is_satisfied_by(money)
    assert (_PositiveAmount() | _AudCurrency()).is_satisfied_by(_Money(amount=0, currency="AUD"))


# --- Clock --------------------------------------------------------------------


def test_system_clock_returns_aware_utc() -> None:
    now = SystemClock().now()
    assert now.tzinfo is not None
    assert now.utcoffset() is not None


def test_fixed_clock_is_deterministic() -> None:
    instant = datetime(2026, 7, 18, 12, 0, tzinfo=UTC)
    clock = FixedClock(instant)
    assert clock.now() == instant
    clock.advance(hours=1)
    assert clock.now() == datetime(2026, 7, 18, 13, 0, tzinfo=UTC)


def test_fixed_clock_rejects_naive_datetime() -> None:
    with pytest.raises(ValueError, match="timezone-aware"):
        FixedClock(datetime(2026, 1, 1))
