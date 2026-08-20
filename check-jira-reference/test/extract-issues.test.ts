import { describe, expect, test } from "vitest";

import {
  extractIssuesFromText,
  extractIssuesFromTexts,
} from "../src/parsers/extract-issues.js";

describe("extract-issues", () => {
  // eslint-disable-next-line sonarjs/super-linear-regex -- Matches the action's default Jira pattern; no untrusted input in tests
  const defaultPattern = /[A-Z][A-Z0-9]+-\d+/gi;

  describe("extractIssuesFromText", () => {
    test("extracts single Jira issue key from text", () => {
      const text = "This implements DEVOPS-123";
      const result = extractIssuesFromText(text, defaultPattern);
      expect(result).toEqual(new Set(["DEVOPS-123"]));
    });

    test("extracts multiple Jira issue keys from text", () => {
      const text = "This implements DEVOPS-123 and PROJECT-456";
      const result = extractIssuesFromText(text, defaultPattern);
      expect(result).toEqual(new Set(["DEVOPS-123", "PROJECT-456"]));
    });

    test("returns empty set when no Jira keys found", () => {
      const text = "This is just a regular message without Jira references";
      const result = extractIssuesFromText(text, defaultPattern);
      expect(result).toEqual(new Set([]));
    });

    test("deduplicates repeated Jira issue keys", () => {
      const text = "DEVOPS-123 implements DEVOPS-123 again";
      const result = extractIssuesFromText(text, defaultPattern);
      expect(result).toEqual(new Set(["DEVOPS-123"]));
    });

    test("normalizes to uppercase", () => {
      const text = "feat/devops-456 adds feature";
      const result = extractIssuesFromText(text, defaultPattern);
      expect(result).toEqual(new Set(["DEVOPS-456"]));
    });

    test("handles empty string", () => {
      const result = extractIssuesFromText("", defaultPattern);
      expect(result).toEqual(new Set([]));
    });

    test("handles various Jira key formats", () => {
      const text = "ABC-1 DEF-99 GH-007 FIX2-12345";
      const result = extractIssuesFromText(text, defaultPattern);
      expect(result).toEqual(
        new Set(["ABC-1", "DEF-99", "FIX2-12345", "GH-007"]),
      );
    });

    test("ignores text after dash that is not digits", () => {
      const text = "ABC-XYZ is not valid, but ABC-123 is";
      const result = extractIssuesFromText(text, defaultPattern);
      expect(result).toEqual(new Set(["ABC-123"]));
    });

    test("extracts issues from mixed-case text", () => {
      // The regex pattern finds the first capital letter and continues matching
      const text = "project ABC-123";
      const result = extractIssuesFromText(text, defaultPattern);
      // ABC-123 matches from the "ABC" part
      expect(result).toEqual(new Set(["ABC-123"]));
    });
  });

  describe("extractIssuesFromTexts", () => {
    test("extracts from multiple texts", () => {
      const texts = ["Title has DEVOPS-123", "Body has PROJECT-456"];
      const result = extractIssuesFromTexts(texts, defaultPattern);
      expect(result).toEqual(new Set(["DEVOPS-123", "PROJECT-456"]));
    });

    test("deduplicates across multiple texts", () => {
      const texts = ["DEVOPS-123 in title", "DEVOPS-123 in body too"];
      const result = extractIssuesFromTexts(texts, defaultPattern);
      expect(result).toEqual(new Set(["DEVOPS-123"]));
    });

    test("handles empty array", () => {
      const result = extractIssuesFromTexts([], defaultPattern);
      expect(result).toEqual(new Set([]));
    });

    test("handles array with empty strings", () => {
      const result = extractIssuesFromTexts(
        ["", "also empty", "DEVOPS-999"],
        defaultPattern,
      );
      expect(result).toEqual(new Set(["DEVOPS-999"]));
    });
  });
});
