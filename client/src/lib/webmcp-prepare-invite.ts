/**
 * Opens the existing Add Family Member dialog. Never POSTs invite or sibling
 * APIs — the organizer still has to confirm in the UI (and Send is a
 * separate, explicit tap after a member exists).
 */

export type PrepareInviteDetail = {
  name?: string;
  email?: string;
};

export type PrepareInviteResult = {
  opened: boolean;
  sent: false;
  created: false;
  message: string;
};

type Handler = (detail: PrepareInviteDetail) => boolean;

const handlers = new Set<Handler>();

export function registerPrepareInviteHandler(handler: Handler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

export function requestPrepareInvite(detail: PrepareInviteDetail = {}): PrepareInviteResult {
  let opened = false;
  handlers.forEach((handler) => {
    if (!opened && handler(detail)) opened = true;
  });
  if (opened) {
    return {
      opened: true,
      sent: false,
      created: false,
      message:
        "Opened the Add Family Member dialog. Nothing was saved or emailed. The organizer must confirm in the UI. Sending a private-link email is a separate Send tap after the person exists.",
    };
  }
  return {
    opened: false,
    sent: false,
    created: false,
    message:
      "The Add Family Member dialog is on Admin → Family Members while signed in as the organizer. Open that page, then try again. Nothing was sent.",
  };
}
