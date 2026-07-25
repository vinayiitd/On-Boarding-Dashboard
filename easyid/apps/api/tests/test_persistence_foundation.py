"""Unit tests for persistence foundation helpers (no database required)."""

from __future__ import annotations

import ast
from pathlib import Path
from typing import get_type_hints
from uuid import UUID, uuid4

from sqlalchemy.ext.asyncio import AsyncSession

from easyid_api.infrastructure.persistence import (
    Base,
    SessionRepository,
    generate_entity_id,
    metadata,
    to_domain_id,
    to_uuid,
)
from easyid_api.infrastructure.persistence.ids import ENTITY_ID_STRATEGY
from easyid_api.infrastructure.persistence.metadata import NAMING_CONVENTION
from easyid_api.infrastructure.persistence.session import create_session
from easyid_domain.organisation import OrganisationId

EASYID_ROOT = Path(__file__).resolve().parents[3]
PERSISTENCE_ROOT = (
    EASYID_ROOT / "apps" / "api" / "src" / "easyid_api" / "infrastructure" / "persistence"
)
FOUNDATION_MODULES = (
    PERSISTENCE_ROOT / "metadata.py",
    PERSISTENCE_ROOT / "base.py",
    PERSISTENCE_ROOT / "engine.py",
    PERSISTENCE_ROOT / "session.py",
    PERSISTENCE_ROOT / "ids.py",
    PERSISTENCE_ROOT / "health.py",
    PERSISTENCE_ROOT / "repository.py",
)


def test_shared_metadata_has_naming_convention() -> None:
    assert metadata.naming_convention == NAMING_CONVENTION
    for key in ("ix", "uq", "ck", "fk", "pk"):
        assert key in NAMING_CONVENTION


def test_declarative_base_uses_shared_metadata() -> None:
    assert Base.metadata is metadata


def test_generate_entity_id_returns_uuid() -> None:
    value = generate_entity_id()
    assert isinstance(value, UUID)
    assert ENTITY_ID_STRATEGY == "uuid4"


def test_to_uuid_and_to_domain_id_round_trip() -> None:
    organisation_id = OrganisationId.generate()
    raw = to_uuid(organisation_id)
    assert isinstance(raw, UUID)
    assert raw == organisation_id.value

    restored = to_domain_id(OrganisationId, raw)
    assert restored == organisation_id
    assert isinstance(restored, OrganisationId)


def test_to_domain_id_wraps_raw_uuid() -> None:
    raw = uuid4()
    organisation_id = to_domain_id(OrganisationId, raw)
    assert organisation_id.value == raw


def test_session_repository_stores_session() -> None:
    session = object()
    repo = SessionRepository(session)  # type: ignore[arg-type]
    assert repo._session is session


def test_session_repository_has_no_crud_surface() -> None:
    for forbidden in ("get_by_id", "add", "remove", "save", "insert", "update", "delete"):
        assert forbidden not in SessionRepository.__dict__


def test_create_session_calls_factory() -> None:
    sentinel = object()

    class Factory:
        def __call__(self) -> object:
            return sentinel

    assert create_session(Factory()) is sentinel  # type: ignore[arg-type]


def test_foundation_modules_exist() -> None:
    for path in FOUNDATION_MODULES:
        assert path.is_file(), f"missing {path.name}"
    assert (PERSISTENCE_ROOT / "mappings" / "__init__.py").is_file()


def test_domain_and_application_do_not_import_sqlalchemy() -> None:
    roots = [
        EASYID_ROOT / "packages" / "domain" / "src" / "easyid_domain",
        EASYID_ROOT / "apps" / "api" / "src" / "easyid_api" / "application",
    ]
    offenders: list[str] = []
    for root in roots:
        for path in root.rglob("*.py"):
            tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        if alias.name == "sqlalchemy" or alias.name.startswith("sqlalchemy."):
                            offenders.append(str(path.relative_to(EASYID_ROOT)))
                elif (
                    isinstance(node, ast.ImportFrom)
                    and node.module is not None
                    and (node.module == "sqlalchemy" or node.module.startswith("sqlalchemy."))
                ):
                    offenders.append(str(path.relative_to(EASYID_ROOT)))

    assert offenders == []


def test_session_repository_session_annotation() -> None:
    hints = get_type_hints(SessionRepository.__init__)
    assert hints["session"] is AsyncSession
