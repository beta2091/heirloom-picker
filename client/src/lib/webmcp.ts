/**
 * Thin WebMCP (Chrome origin trial) helpers.
 *
 * Progressive enhancement: if `document.modelContext` is missing, every
 * function here is a no-op. Safe to import from any client module — never
 * throws on SSR or unsupported browsers.
 *
 * Prefer `document.modelContext`. `navigator.modelContext` is a fallback
 * only (deprecated in Chrome 150).
 */

export type JsonSchema = Record<string, unknown>;

export type WebMcpAnnotations = {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
  consequentialHint?: boolean;
};

export type WebMcpToolDefinition = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
  annotations?: WebMcpAnnotations;
  execute: (
    args: Record<string, unknown>,
    extras?: { signal?: AbortSignal },
  ) => unknown | Promise<unknown>;
};

export type ModelContext = {
  registerTool: (
    tool: WebMcpToolDefinition,
    options?: { signal?: AbortSignal; exposedTo?: string[] },
  ) => void | Promise<void>;
};

function isModelContext(value: unknown): value is ModelContext {
  return (
    !!value &&
    typeof value === "object" &&
    "registerTool" in value &&
    typeof (value as ModelContext).registerTool === "function"
  );
}

/** Feature-detect WebMCP. Returns null when the API is absent. */
export function getModelContext(): ModelContext | null {
  if (typeof document === "undefined") return null;
  const fromDocument = (document as Document & { modelContext?: unknown }).modelContext;
  if (isModelContext(fromDocument)) return fromDocument;
  if (typeof navigator === "undefined") return null;
  const fromNavigator = (navigator as Navigator & { modelContext?: unknown }).modelContext;
  if (isModelContext(fromNavigator)) return fromNavigator;
  return null;
}

export function isWebMcpAvailable(): boolean {
  return getModelContext() !== null;
}

/**
 * Register tools for the lifetime of `signal`. Aborting unregisters them.
 * Swallows registration errors so a flaky OT build cannot break the app.
 */
export async function registerWebMcpTools(
  tools: WebMcpToolDefinition[],
  signal?: AbortSignal,
): Promise<void> {
  const ctx = getModelContext();
  if (!ctx || signal?.aborted) return;
  for (const tool of tools) {
    if (signal?.aborted) return;
    try {
      await ctx.registerTool(tool, signal ? { signal } : undefined);
    } catch {
      // Origin-trial implementations can reject; the page must still work.
    }
  }
}
