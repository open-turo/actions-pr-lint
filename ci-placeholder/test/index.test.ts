import { describe, expect, it } from "vitest";

import { noop } from "../src/index.js";

describe("noop", () => {
  it("returns true", () => {
    expect(noop()).toBe(true);
  });
});
