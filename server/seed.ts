import { storage } from "./storage";

const SAMPLE_SIBLINGS = [
  { name: "Sarah", color: "#6366f1" },
  { name: "Michael", color: "#22c55e" },
  { name: "Emily", color: "#f59e0b" },
];

const SAMPLE_ITEMS = [
  {
    name: "Grandmother's China Set",
    description: "Complete 12-piece china set with blue floral pattern, handed down from great-grandmother",
    imageUrl: null,
  },
  {
    name: "Antique Rocking Chair",
    description: "Oak rocking chair from the 1920s, still in excellent condition",
    imageUrl: null,
  },
  {
    name: "Family Photo Albums",
    description: "Collection of 5 photo albums spanning 1950-1990, includes wedding photos",
    imageUrl: null,
  },
  {
    name: "Vintage Jewelry Box",
    description: "Mahogany jewelry box with mother-of-pearl inlay, contains some costume jewelry",
    imageUrl: null,
  },
  {
    name: "Grandfather Clock",
    description: "Tall case grandfather clock, needs some repair but keeps time",
    imageUrl: null,
  },
  {
    name: "Handmade Quilt",
    description: "Queen-size quilt made by grandmother, patchwork design in blue and white",
    imageUrl: null,
  },
  {
    name: "Silver Tea Service",
    description: "4-piece sterling silver tea service, includes teapot, sugar bowl, creamer, and tray",
    imageUrl: null,
  },
  {
    name: "Vintage Record Player",
    description: "1960s console record player with built-in speakers, includes collection of vinyl records",
    imageUrl: null,
  },
  {
    name: "Kitchen Aid Mixer",
    description: "Red KitchenAid stand mixer, well-used but still works perfectly",
    imageUrl: null,
  },
];

export async function seedDatabase() {
  try {
    // Check if we already have data
    const existingSiblings = await storage.getAllSiblings();
    if (existingSiblings.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }

    console.log("Seeding database...");

    // Create siblings
    for (const sibling of SAMPLE_SIBLINGS) {
      await storage.createSibling(sibling);
    }
    console.log(`Created ${SAMPLE_SIBLINGS.length} sample siblings`);

    // Create items
    for (const item of SAMPLE_ITEMS) {
      await storage.createItem(item);
    }
    console.log(`Created ${SAMPLE_ITEMS.length} sample items`);

    // Initialize draft state
    await storage.createOrUpdateDraftState({
      currentRound: 1,
      currentPickIndex: 0,
      isActive: false,
      isComplete: false,
    });
    console.log("Initialized draft state");

    console.log("Database seeding complete!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
