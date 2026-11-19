import { randomBytes } from "crypto";

/**
 * Fisher–Yates shuffle backed by crypto.randomBytes.
 * Rejection sampling avoids modulo bias. Returns a new array.
 */
export function shuffleSecure<T>(items: readonly T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const range = i + 1;
    const limit = 0x100000000 - (0x100000000 % range);
    let rnd = randomBytes(4).readUInt32BE(0);
    while (rnd >= limit) {
      rnd = randomBytes(4).readUInt32BE(0);
    }
    const j = rnd % range;
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}
