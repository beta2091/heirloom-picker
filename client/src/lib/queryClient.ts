import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getEstateId, setEstateId } from "./tenant";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Attach the current estate (tenant) to every request so the server scopes
// the response to the right family.
function tenantHeaders(base: Record<string, string> = {}): Record<string, string> {
  const estateId = getEstateId();
  return estateId ? { ...base, "x-estate-id": estateId } : base;
}

// Opportunistically learn our estate from a participant's first loaded entity
// (sibling / share link), so later un-scoped calls (/api/items, /api/draft)
// carry the header too. Never overrides an estate we already know.
function captureEstate(result: unknown) {
  if (getEstateId()) return;
  if (result && typeof result === "object" && typeof (result as any).estateId === "string") {
    setEstateId((result as any).estateId);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: tenantHeaders(data ? { "Content-Type": "application/json" } : {}),
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: tenantHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const result = await res.json();
    captureEstate(result);
    return result;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
