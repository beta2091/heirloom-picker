/**
 * Guardrails for the WebMCP spike: summaries must stay counts-only,
 * logged-out lists stay empty, and invite copy must not claim to send mail.
 */
import { getModelContext, registerWebMcpTools } from "../client/src/lib/webmcp";
import {
  estatesVisibleToSession,
  estateViewTools,
  summarizeEstate,
  INVITE_FLOW,
  landingTools,
} from "../client/src/lib/webmcp-tools";
import { requestPrepareInvite } from "../client/src/lib/webmcp-prepare-invite";

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

assert(getModelContext() === null, "feature-detect is null without document.modelContext");
await registerWebMcpTools(landingTools());

const landingNames = landingTools().map((tool) => tool.name).sort();
assert(
  landingNames.join(",") === "describe_invite_flow,list_estates",
  "landing tools are list + describe only",
);
const estateNames = estateViewTools().map((tool) => tool.name).sort();
assert(
  estateNames.join(",") === "describe_invite_flow,get_estate_summary,list_estates,prepare_invite",
  "estate views add summary + prepare_invite",
);

const fetchCalls: string[] = [];
let signedIn = false;
(globalThis as any).fetch = async (url: string) => {
  fetchCalls.push(String(url));
  if (String(url).includes("/api/siblings/") && String(url).includes("/invite")) {
    throw new Error("invite endpoint must not be called");
  }
  if (String(url).includes("/api/billing")) {
    throw new Error("billing endpoint must not be called");
  }
  if (String(url) === "/api/auth/me") {
    if (!signedIn) return { ok: false, status: 401, json: async () => ({ error: "Not signed in" }) };
    return {
      ok: true,
      json: async () => ({
        organizer: { id: "org-1", email: "hidden@example.com", name: "Pat" },
        estate: { id: "est-1", name: "The Family", status: "trial" },
      }),
    };
  }
  if (String(url) === "/api/items") {
    return {
      ok: true,
      json: async () => [
        { id: "i1", name: "Recipe box", description: "Grandma's notes", pickedBySiblingId: "s1" },
        { id: "i2", name: "Watch", description: null, pickedBySiblingId: null },
      ],
    };
  }
  if (String(url) === "/api/siblings") {
    return {
      ok: true,
      json: async () => [{ id: "s1", name: "Alex" }, { id: "s2", name: "Sam" }],
    };
  }
  if (String(url) === "/api/draft") {
    return {
      ok: true,
      json: async () => ({
        isActive: true,
        isComplete: false,
        currentRound: 2,
        currentPickerName: "Alex",
      }),
    };
  }
  return { ok: false, status: 404, json: async () => ({}) };
};

const tools = estateViewTools();
const byName = (name: string) => {
  const tool = tools.find((row) => row.name === name);
  assert(tool, `missing tool ${name}`);
  return tool;
};

const loggedOutList = JSON.parse(String(await byName("list_estates").execute({}, {})));
assert(loggedOutList.estates.length === 0, "signed-out list_estates is empty");
assert(!fetchCalls.some((url) => url === "/api/items"), "signed-out list does not fetch items");

const loggedOutSummary = JSON.parse(String(await byName("get_estate_summary").execute({ estateId: "est-1" }, {})));
assert(loggedOutSummary.visible === false, "signed-out summary is hidden");
assert(!JSON.stringify(loggedOutSummary).includes("Recipe box"), "hidden summary has no item names");

signedIn = true;
fetchCalls.length = 0;
const signedInList = JSON.parse(String(await byName("list_estates").execute({}, {})));
assert(signedInList.estates.length === 1 && signedInList.estates[0].id === "est-1", "signed-in list");
assert(!JSON.stringify(signedInList).includes("hidden@example.com"), "list_estates strips organizer email");

const signedInSummary = JSON.parse(String(await byName("get_estate_summary").execute({ estateId: "est-1" }, {})));
assert(signedInSummary.visible === true, "signed-in summary visible");
assert(signedInSummary.itemCount === 2 && signedInSummary.memberCount === 2, "signed-in counts");
const summaryText = JSON.stringify(signedInSummary);
assert(!summaryText.includes("Recipe box"), "summary omits item names");
assert(!summaryText.includes("Grandma"), "summary omits private notes");
assert(!summaryText.includes("Alex"), "summary omits member / picker names");
assert(!summaryText.includes("hidden@"), "summary omits emails");

const otherEstate = JSON.parse(String(await byName("get_estate_summary").execute({ estateId: "not-yours" }, {})));
assert(otherEstate.visible === false, "other estate ids are not visible");

const invite = JSON.parse(String(await byName("describe_invite_flow").execute({}, {})));
assert(invite.sendsEmail === false, "describe_invite_flow does not send");

const prepared = requestPrepareInvite({ name: "Riley" });
assert(prepared.opened === false && prepared.sent === false && prepared.created === false, "prepare_invite is a no-op without admin UI");
assert(!fetchCalls.some((url) => url.includes("invite")), "no invite HTTP calls");

console.log("webmcp safety ok");
