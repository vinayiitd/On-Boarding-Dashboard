"""Organisation domain events."""

from __future__ import annotations

from dataclasses import dataclass

from easyid_domain.kernel.domain_event import DomainEvent
from easyid_domain.organisation.identifiers import OrganisationId
from easyid_domain.organisation.name import OrganisationName


@dataclass(frozen=True, slots=True, kw_only=True)
class OrganisationRegistered(DomainEvent):
    organisation_id: OrganisationId
    name: OrganisationName


@dataclass(frozen=True, slots=True, kw_only=True)
class OrganisationRenamed(DomainEvent):
    organisation_id: OrganisationId
    old_name: OrganisationName
    new_name: OrganisationName


@dataclass(frozen=True, slots=True, kw_only=True)
class OrganisationSuspended(DomainEvent):
    organisation_id: OrganisationId


@dataclass(frozen=True, slots=True, kw_only=True)
class OrganisationReactivated(DomainEvent):
    organisation_id: OrganisationId
