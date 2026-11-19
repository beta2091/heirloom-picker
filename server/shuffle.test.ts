import assert from "node:assert/strict";
import test from "node:test";
import { shuffleSecure } from "./shuffle.ts";

test("shuffleSecure returns a permutation of the input", () => {
  const input = ["a", "b", "c", "d", "e", "f", "g", "h"];
  const shuffled = shuffleSecure(input);
  assert.deepEqual([...input], ["a", "b", "c", "d", "e", "f", "g", "h"]);
  assert.deepEqual([...shuffled].sort(), [...input].sort());
  assert.equal(shuffled.length, input.length);
});

test("shuffleSecure leaves empty and single-item lists unchanged", () => {
  assert.deepEqual(shuffleSecure([]), []);
  assert.deepEqual(shuffleSecure(["only"]), ["only"]);
});

test("shuffleSecure is not a fixed order", () => {
  const input = [1, 2, 3, 4, 5, 6, 7, 8];
  const seen = new Set<string>();
  for (let i = 0; i < 20; i++) {
    seen.add(shuffleSecure(input).join(","));
  }
  assert.ok(seen.size > 1);
});
