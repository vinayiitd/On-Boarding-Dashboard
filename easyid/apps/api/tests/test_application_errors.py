"""Application-layer error types."""

from __future__ import annotations

from uuid import uuid4

from easyid_api.application.errors import EntityNotFound
from easyid_domain import err, ok


def test_entity_not_found_is_result_err_payload() -> None:
    entity_id = uuid4()
    failure = EntityNotFound(entity_type="Sample", entity_id=entity_id)
    result = err(failure)

    assert result.is_err()
    assert result.unwrap_err() is failure
    assert failure.code == "entity_not_found"
    assert "Sample" in str(failure)


def test_entity_not_found_does_not_belong_on_ok_path() -> None:
    result = ok(1)
    assert result.is_ok()
