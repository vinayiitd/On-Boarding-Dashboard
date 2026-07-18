"""Organisation-specific domain errors."""

from __future__ import annotations

from easyid_domain.kernel.errors import BusinessRuleViolation

_MAX_NAME_LENGTH = 200


class OrganisationNameEmpty(BusinessRuleViolation):
    """Raised when an organisation name is missing or blank."""

    def __init__(self) -> None:
        super().__init__(
            "Organisation name is required.",
            code="organisation_name_empty",
        )


class OrganisationNameTooLong(BusinessRuleViolation):
    """Raised when an organisation name exceeds the allowed length."""

    def __init__(self, *, length: int) -> None:
        super().__init__(
            f"Organisation name must be at most {_MAX_NAME_LENGTH} characters.",
            code="organisation_name_too_long",
            details={"length": length, "max_length": _MAX_NAME_LENGTH},
        )
