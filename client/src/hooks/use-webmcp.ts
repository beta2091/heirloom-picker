import { useEffect } from "react";
import { registerWebMcpTools } from "@/lib/webmcp";
import { estateViewTools, landingTools } from "@/lib/webmcp-tools";

export type WebMcpScope = "landing" | "estate";

/**
 * Register WebMCP tools for this component's lifetime.
 * No-op when the origin trial API is absent. Unregisters on unmount.
 */
export function useWebMcp(scope: WebMcpScope) {
  useEffect(() => {
    const controller = new AbortController();
    const tools = scope === "estate" ? estateViewTools() : landingTools();
    void registerWebMcpTools(tools, controller.signal);
    return () => controller.abort();
  }, [scope]);
}
