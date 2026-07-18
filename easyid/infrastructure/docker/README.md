# infrastructure/docker

Supporting Docker configuration referenced by the root `docker-compose.yml`.

## Contents

- `postgres/init/` — SQL files that `postgres:17-alpine` runs the first time the
  volume is initialised. Keep them small — schema lives in Alembic migrations,
  not here.

Dockerfiles themselves are co-located with each app (`apps/api/Dockerfile`,
`apps/web/Dockerfile`) so a change to app code and its container are always
reviewed together.

## Local overrides

To override an image temporarily (e.g. pin an older Postgres), create
`docker-compose.override.yml` at the repo root. Docker Compose picks it up
automatically and it is git-ignored.
