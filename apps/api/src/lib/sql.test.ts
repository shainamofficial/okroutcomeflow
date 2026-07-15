import { describe, expect, it } from "vitest";
import { escapeLike } from "./sql";

describe("escapeLike", () => {
  it("escapes percent wildcards", () => {
    expect(escapeLike("100%")).toBe("100\\%");
  });

  it("escapes underscore wildcards", () => {
    expect(escapeLike("my_metric")).toBe("my\\_metric");
  });

  it("escapes backslashes before they can un-escape anything", () => {
    expect(escapeLike("a\\b")).toBe("a\\\\b");
  });

  it("a bare wildcard becomes a literal", () => {
    expect(escapeLike("%")).toBe("\\%");
  });

  it("leaves normal text untouched", () => {
    expect(escapeLike("increase revenue")).toBe("increase revenue");
  });
});
