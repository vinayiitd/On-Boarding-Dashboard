import type { HealthStatus } from "@easyid/types";
import { request, type HttpContext } from "../http";

/**
 * `GET /api/v1/health` — liveness + version.
 * Should never throw in normal operation; treat any thrown `ApiClientError`
 * as a hard failure worth surfacing to the user.
 */
export async function getHealth(
  ctx: HttpContext,
  init: { signal?: AbortSignal } = {},
): Promise<HealthStatus> {
  const options: { signal?: AbortSignal } = {};
  if (init.signal !== undefined) options.signal = init.signal;
  return request<HealthStatus>(ctx, "api/v1/health", options);
}
