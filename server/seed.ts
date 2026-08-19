/**
 * Do not seed sample people or items into the live default estate.
 *
 * The old Sarah / Michael / Emily catalog was a single-family prototype aid.
 * A public walkthrough now lives at /demo as isolated, read-only page data
 * and must never be written into production storage.
 */
export async function seedDatabase() {
  return;
}
