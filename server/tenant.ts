import { AsyncLocalStorage } from "async_hooks";

// The estate all pre-multi-tenant data is backfilled into. The existing
// single-family deployment continues to operate entirely inside this estate,
// so behavior is unchanged until new estates are created via signup.
export const DEFAULT_ESTATE_ID = "00000000-0000-0000-0000-000000000001";

// Request-scoped estate context. Middleware resolves the current estate once
// per request and runs the handler inside `runWithEstate`, so every storage
// call automatically scopes to the right tenant without threading an estateId
// argument through 120 call sites.
const estateContext = new AsyncLocalStorage<string>();

export function runWithEstate<T>(estateId: string, fn: () => T): T {
  return estateContext.run(estateId, fn);
}

// The estate for the current request, or the default estate when no context is
// set (e.g. startup seeding, or the legacy single-tenant deployment). Keeping a
// safe fallback is what makes the multi-tenant rollout non-breaking.
export function currentEstateId(): string {
  return estateContext.getStore() ?? DEFAULT_ESTATE_ID;
}
