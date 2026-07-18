# Architecture Decision Records (ADRs)

An **ADR** captures a single architectural decision — why it was made, what
was considered, and what changes as a result. It is a lightweight paper
trail so future contributors do not have to reverse-engineer intent from git
history.

We follow a MADR-inspired format (see [`template.md`](./template.md)). Keep
records short: an ADR that reads longer than five minutes has usually
outgrown its scope and should be split.

## Conventions

- **File name.** `NNNN-kebab-case-title.md` where `NNNN` is a zero-padded
  four-digit sequence starting at `0001`. Never reuse a number, even for a
  superseded ADR.
- **Status.** `Proposed`, `Accepted`, `Deprecated`, or
  `Superseded by ADR-XXXX`.
- **One decision per ADR.** If your PR requires two decisions, write two
  ADRs.
- **Immutable once accepted.** Do not silently rewrite history. If reality
  changes, add a new ADR that supersedes the old one and update the old
  one's status line to point at it.

## When to write an ADR

Write one when the change:

- Alters a layer boundary, a package boundary, or a public contract.
- Introduces or removes a runtime dependency, a framework, or a language.
- Changes a security, privacy, or compliance posture.
- Locks in a trade-off that a future contributor might reasonably want to
  revisit.

Small refactors, bug fixes, and dependency bumps do not need an ADR.

## Workflow

1. Copy [`template.md`](./template.md) to `NNNN-<slug>.md`.
2. Fill it in. Keep prose tight, keep options honest.
3. Open the PR with status `Proposed`.
4. If merged, the reviewer flips the status to `Accepted` in the same PR
   (or a follow-up if the discussion warrants).

## Index

| ID   | Title                                                                                   | Status   |
| ---- | --------------------------------------------------------------------------------------- | -------- |
| 0001 | [Consolidate the domain layer into `packages/domain`](./0001-consolidate-domain-into-packages-domain.md) | Accepted |
| 0002 | [Introduce `packages/common` for cross-cutting utilities](./0002-introduce-packages-common.md)           | Accepted |
