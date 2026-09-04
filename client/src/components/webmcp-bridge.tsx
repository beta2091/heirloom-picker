import { useLocation } from "wouter";
import { useWebMcp, type WebMcpScope } from "@/hooks/use-webmcp";

const ESTATE_VIEW = /^\/(admin|draft|draft-master|results|lottery)(\/|$)/;

function scopeForPath(path: string): WebMcpScope {
  return ESTATE_VIEW.test(path) ? "estate" : "landing";
}

/**
 * Progressive-enhancement WebMCP registration.
 * Landing pages get read-only list/describe tools.
 * Signed-in estate views also get a summary tool and a UI-only prepare_invite.
 */
export function WebMcpBridge() {
  const [path] = useLocation();
  useWebMcp(scopeForPath(path));
  return null;
}
