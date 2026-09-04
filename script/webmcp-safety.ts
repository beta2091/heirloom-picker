/**
 * Guardrails for the WebMCP spike: summaries must stay counts-only,
 * logged-out lists stay empty, and invite copy must not claim to send mail.
 */
import {
  estatesVisibleToSession,
  summarizeEstate,
  INVITE_FLOW,
} from "../client/src/lib/webmcp-tools";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

assert(estatesVisibleToSession(null).length === 0, "logged out → empty list");
assert(estatesVisibleToSession({}).length === 0, "no estate → empty list");

const listed = estatesVisibleToSession({
  organizer: { id: "org-1" },
  estate: { id: "est-1", name: "The Family", status: "trial" },
});
assert(listed.length === 1 && listed[0].id === "est-1", "session estate listed");
assert(!JSON.stringify(listed).includes("@"), "list_estates has no emails");

const summary = summarizeEstate({
  estate: { id: "est-1", name: "The Family", status: "trial" },
  items: [
    { pickedBySiblingId: "sib-1" },
    { pickedBySiblingId: null },
  ],
  members: [{}, {}],
  draft: { isActive: true, isComplete: false, currentRound: 2 },
});
const text = JSON.stringify(summary);
assert(summary.itemCount === 2 && summary.pickedItemCount === 1, "item counts");
assert(summary.memberCount === 2, "member count");
assert(summary.draft?.currentRound === 2, "draft round");
assert(!text.includes("description"), "summary omits item notes");
assert(!text.includes("shareToken"), "summary omits share tokens");
assert(!text.includes("email"), "summary omits emails");

assert(INVITE_FLOW.sendsEmail === false && INVITE_FLOW.createsInvite === false, "invite copy is descriptive only");
assert(
  INVITE_FLOW.notes.some((note) => note.includes("does not send mail")),
  "invite copy states it does not send",
);

console.log("webmcp safety ok");
