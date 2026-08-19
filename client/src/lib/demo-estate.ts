/**
 * Isolated, fictional sample estate for the public /demo walkthrough.
 *
 * This module is client-only static data. It is never written to storage,
 * never attached to the default tenant, and must not reuse the old
 * Sarah / Michael / Emily seed names.
 */

export const DEMO_FLAG =
  "This is a sample estate. The names and belongings are fictional. Nothing here is saved, and it cannot change a real family's catalog.";

export type DemoPerson = {
  id: string;
  name: string;
  color: string;
};

export type DemoItem = {
  id: string;
  name: string;
  note: string;
  photo: string;
  alt: string;
  width: number;
  height: number;
  keptBy: string;
  pickRound: number;
};

export const DEMO_PEOPLE: DemoPerson[] = [
  { id: "riley", name: "Riley", color: "#9a4a24" },
  { id: "jordan", name: "Jordan", color: "#2f6b4f" },
  { id: "sam", name: "Sam", color: "#6b5344" },
];

export const DEMO_ITEMS: DemoItem[] = [
  {
    id: "letters",
    name: "Ribbon-tied letters",
    note: "A small stack of letters and a jewelry box that sat on the dresser.",
    photo: "/marketing/hero-keepsakes",
    alt: "Letters tied with a ribbon, a pocket watch, a gold ring, and an open jewelry box.",
    width: 933,
    height: 1400,
    keptBy: "riley",
    pickRound: 1,
  },
  {
    id: "table",
    name: "Everyday teapot and quilt",
    note: "The teapot from the weekday table, folded with the quilt that lived on the sofa.",
    photo: "/marketing/table-catalog",
    alt: "A teapot, folded quilt, eyeglasses, and a handwritten card on a wooden table.",
    width: 1536,
    height: 1024,
    keptBy: "sam",
    pickRound: 1,
  },
  {
    id: "locket",
    name: "Gold floral locket",
    note: "Worn thin at the hinge. Still closes.",
    photo: "/marketing/locket",
    alt: "A gold floral locket and a dried flower beside a cup of tea.",
    width: 1400,
    height: 933,
    keptBy: "jordan",
    pickRound: 1,
  },
  {
    id: "chair",
    name: "Oak side chair",
    note: "The chair by the window. Someone will need to come with a van.",
    photo: "/marketing/photographing",
    alt: "A wooden chair photographed with a phone for a family catalog.",
    width: 1400,
    height: 933,
    keptBy: "riley",
    pickRound: 2,
  },
];

/** Riley's private ranking — other sample people would have their own, unseen lists. */
export const DEMO_PRIVATE_RANK = ["letters", "chair", "locket", "table"] as const;

export const DEMO_DRAFT_ORDER = ["riley", "jordan", "sam"] as const;

export function demoPerson(id: string): DemoPerson {
  const found = DEMO_PEOPLE.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown demo person: ${id}`);
  return found;
}

export function demoItem(id: string): DemoItem {
  const found = DEMO_ITEMS.find((p) => p.id === id);
  if (!found) throw new Error(`Unknown demo item: ${id}`);
  return found;
}
