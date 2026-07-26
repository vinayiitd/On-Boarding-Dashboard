"""
Persistence mappings (ORM table classes).

Do **not** name this package `models`. Mappings are infrastructure
persistence concerns — not domain models. Import every concrete mapping
module here so Alembic's `env.py` and metadata discovery see all tables.
"""

from easyid_api.infrastructure.persistence.mappings.organisation import OrganisationModel
from easyid_api.infrastructure.persistence.mappings.organisation import (
    from_domain as organisation_from_domain,
)
from easyid_api.infrastructure.persistence.mappings.organisation import (
    to_domain as organisation_to_domain,
)

__all__ = [
    "OrganisationModel",
    "organisation_from_domain",
    "organisation_to_domain",
]
