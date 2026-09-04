import { getEstateId } from "./tenant";
import { requestPrepareInvite } from "./webmcp-prepare-invite";
import type { WebMcpToolDefinition } from "./webmcp";

type SessionMe = {
  organizer?: { id: string };
  estate?: { id: string; name: string; status: string } | null;
};

function tenantHeaders(): Record<string, string> {
  const estateId = getEstateId();
  return estateId ? { "x-estate-id": estateId } : {};
}

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T | null> {
  try {
    const res = await fetch(url, {
      credentials: "include",
      headers: tenantHeaders(),
      signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Session-visible organizer + estate. 401 / network → null. Never invent estates. */
export async function fetchSessionMe(signal?: AbortSignal): Promise<SessionMe | null> {
  return fetchJson<SessionMe>("/api/auth/me", signal);
}

export function estatesVisibleToSession(me: SessionMe | null): Array<{
  id: string;
  name: string;
  status: string;
}> {
  if (!me?.estate?.id) return [];
  return [{ id: me.estate.id, name: me.estate.name, status: me.estate.status }];
}

type ItemRow = { pickedBySiblingId?: string | null };
type DraftRow = { isActive?: boolean; isComplete?: boolean; currentRound?: number };

export function summarizeEstate(input: {
  estate: { id: string; name: string; status: string };
  items: ItemRow[] | null;
  members: unknown[] | null;
  draft: DraftRow | null;
}) {
  const items = input.items ?? [];
  return {
    id: input.estate.id,
    name: input.estate.name,
    status: input.estate.status,
    itemCount: input.items ? items.length : null,
    pickedItemCount: input.items ? items.filter((item) => !!item.pickedBySiblingId).length : null,
    memberCount: input.members ? input.members.length : null,
    draft: input.draft
      ? {
          isActive: !!input.draft.isActive,
          isComplete: !!input.draft.isComplete,
          currentRound: input.draft.currentRound ?? 1,
        }
      : null,
  };
}

/**
 * In-product invite steps already shown in the UI. Does not send email,
 * create members, or claim capabilities that depend on Resend being configured.
 */
export const INVITE_FLOW = {
  sendsEmail: false,
  createsInvite: false,
  title: "How inviting works in Evenkeep",
  steps: [
    "Sign in as the family organizer and open Admin → Family Members.",
    "Add each person who will take a turn (name required; email optional).",
    "Copy their private /join link from the Family Members list and share it yourself.",
    "If email sending is turned on for this deployment and the person has an email saved, you can tap Send on their row. That tap is what emails the private link — nothing is sent automatically.",
    "They open the link on a phone or laptop, optionally set a PIN, and rank items in private. Relatives do not need their own account.",
  ],
  notes: [
    "Setup and invites are free. The live draft and export are $99 once per estate.",
    "Email sending is optional and only appears when this deployment has email configured. Copying the private link always works.",
    "This tool only describes the existing UI. It does not send mail, create a family member, or generate a new link.",
  ],
};

function asRecord(args: unknown): Record<string, unknown> {
  return args && typeof args === "object" ? (args as Record<string, unknown>) : {};
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function landingTools(): WebMcpToolDefinition[] {
  return [
    {
      name: "list_estates",
      description:
        "List estates (id, name, billing status) the current signed-in organizer session can already see. Returns an empty list when nobody is signed in. Does not create estates or reveal other families.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: true,
        consequentialHint: false,
      },
      execute: async (_args, extras) => {
        const me = await fetchSessionMe(extras?.signal);
        return JSON.stringify({
          signedIn: !!me?.organizer,
          estates: estatesVisibleToSession(me),
        });
      },
    },
    {
      name: "describe_invite_flow",
      description:
        "Explain how inviting family members works in Evenkeep: add a person, copy their private link, optionally tap Send if email is configured. Does not send email, create members, or charge a card.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: false,
        consequentialHint: false,
      },
      execute: async () => JSON.stringify(INVITE_FLOW),
    },
  ];
}

export function estateViewTools(): WebMcpToolDefinition[] {
  return [
    ...landingTools(),
    {
      name: "get_estate_summary",
      description:
        "High-level summary of an estate this signed-in session can already see: name, status, item count, picked-item count, member count, and draft progress. Omits private notes, item descriptions, emails, PINs, and share links. Returns not-visible if signed out or the id is not this session's estate.",
      inputSchema: {
        type: "object",
        properties: {
          estateId: {
            type: "string",
            description:
              "Estate id from list_estates. If omitted, uses the signed-in session estate.",
          },
        },
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: true,
        untrustedContentHint: true,
        consequentialHint: false,
      },
      execute: async (args, extras) => {
        const estateId = asOptionalString(asRecord(args).estateId);
        const me = await fetchSessionMe(extras?.signal);
        const visible = estatesVisibleToSession(me);
        if (visible.length === 0) {
          return JSON.stringify({
            visible: false,
            reason: "No estate is visible in this session. Sign in as the organizer to see a summary.",
          });
        }
        const estate = estateId ? visible.find((row) => row.id === estateId) : visible[0];
        if (!estate) {
          return JSON.stringify({
            visible: false,
            reason: "That estate is not visible to this session.",
          });
        }
        const [items, members, draft] = await Promise.all([
          fetchJson<ItemRow[]>("/api/items", extras?.signal),
          fetchJson<unknown[]>("/api/siblings", extras?.signal),
          fetchJson<DraftRow>("/api/draft", extras?.signal),
        ]);
        return JSON.stringify({
          visible: true,
          ...summarizeEstate({ estate, items, members, draft }),
        });
      },
    },
    {
      name: "prepare_invite",
      description:
        "Open the existing Add Family Member dialog on the organizer Admin page and optionally prefill name or email. Does not add a member, send email, copy a private link, or charge a card. The organizer must confirm in the UI.",
      inputSchema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Optional name to prefill. Not saved until the organizer confirms in the dialog.",
          },
          email: {
            type: "string",
            description: "Optional email to prefill. Never used to send a message from this tool.",
          },
        },
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: false,
        untrustedContentHint: false,
        consequentialHint: false,
      },
      execute: async (args) => {
        const record = asRecord(args);
        return JSON.stringify(
          requestPrepareInvite({
            name: asOptionalString(record.name),
            email: asOptionalString(record.email),
          }),
        );
      },
    },
  ];
}
