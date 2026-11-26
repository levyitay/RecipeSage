import { describe, it, expect } from "vitest";
import {
  resolveDecimalNotation,
  inferDecimalNotation,
  localeToPlainMeasurement,
  applyDecimalNotation,
  formatQuantity,
  localeToPlainNumber,
  classifyNumericToken,
  type DecimalNotation,
} from "./decimalNotation";

const BOTH: DecimalNotation[] = [".", ","];

describe("decimalNotation", () => {
  describe("resolveDecimalNotation", () => {
    it("reads a comma locale", () => {
      expect(resolveDecimalNotation("de-de")).toBe(",");
      expect(resolveDecimalNotation("sv-se")).toBe(",");
      expect(resolveDecimalNotation("fr-fr")).toBe(",");
      expect(resolveDecimalNotation("es-es")).toBe(",");
    });

    it("reads a dot locale", () => {
      expect(resolveDecimalNotation("en-us")).toBe(".");
      expect(resolveDecimalNotation("ja")).toBe(".");
      expect(resolveDecimalNotation("es-mx")).toBe(".");
    });

    it("defaults to a dot when no locale is given", () => {
      expect(resolveDecimalNotation(undefined)).toBe(".");
      expect(resolveDecimalNotation("")).toBe(".");
    });

    it("falls back for anything that is not a BCP-47 tag", () => {
      expect(resolveDecimalNotation("de-DE,de;q=0.9,en;q=0.8")).toBe(".");
      expect(resolveDecimalNotation("de_DE")).toBe(".");
      expect(resolveDecimalNotation("de_DE.UTF-8")).toBe(".");
    });

    it("accepts a script or region subtag", () => {
      expect(resolveDecimalNotation("zh-Hant")).toBe(".");
      expect(resolveDecimalNotation("sr-Latn-RS")).toBe(",");
    });

    it("falls back to a dot for a malformed tag", () => {
      expect(resolveDecimalNotation("!!")).toBe(".");
      expect(resolveDecimalNotation("--")).toBe(".");
      expect(resolveDecimalNotation(";q=0.9")).toBe(".");
    });

    it("clamps a locale we could not read back to a dot", () => {
      expect(resolveDecimalNotation("ar-eg")).toBe(".");
      expect(resolveDecimalNotation("fa-ir")).toBe(".");
    });
  });

  describe("classifyNumericToken", () => {
    it("classifies a plain integer", () => {
      expect(classifyNumericToken("25")).toEqual({ kind: "plain" });
    });

    it("classifies an unambiguous decimal", () => {
      expect(classifyNumericToken("1,5")).toEqual({
        kind: "decimal",
        separator: ",",
        ambiguous: false,
      });
      expect(classifyNumericToken("1.5")).toEqual({
        kind: "decimal",
        separator: ".",
        ambiguous: false,
      });
    });

    it("classifies a four-digit fraction as unambiguous", () => {
      expect(classifyNumericToken("1,0000")).toEqual({
        kind: "decimal",
        separator: ",",
        ambiguous: false,
      });
    });

    it("classifies a three-digit group as ambiguous", () => {
      expect(classifyNumericToken("1,125")).toEqual({
        kind: "decimal",
        separator: ",",
        ambiguous: true,
      });
    });

    it("classifies a leading-zero three-digit group as unambiguous", () => {
      expect(classifyNumericToken("0,125")).toEqual({
        kind: "decimal",
        separator: ",",
        ambiguous: false,
      });
    });

    it("classifies a long integer part as unambiguous", () => {
      expect(classifyNumericToken("12345,678")).toEqual({
        kind: "decimal",
        separator: ",",
        ambiguous: false,
      });
    });

    it("classifies repeated grouping", () => {
      expect(classifyNumericToken("1,000,000")).toEqual({ kind: "grouped" });
      expect(classifyNumericToken("1.000.000")).toEqual({ kind: "grouped" });
    });

    it("classifies mixed separators by rightmost", () => {
      expect(classifyNumericToken("1.000,5")).toEqual({
        kind: "decimal",
        separator: ",",
        ambiguous: false,
      });
      expect(classifyNumericToken("1,000.5")).toEqual({
        kind: "decimal",
        separator: ".",
        ambiguous: false,
      });
    });

    it("classifies dates and versions as opaque", () => {
      expect(classifyNumericToken("12.05.2026")).toEqual({ kind: "opaque" });
      expect(classifyNumericToken("1.2.3")).toEqual({ kind: "opaque" });
      expect(classifyNumericToken("1.2,3.4")).toEqual({ kind: "opaque" });
      expect(classifyNumericToken("10,20,30")).toEqual({ kind: "opaque" });
    });
  });

  describe("localeToPlainMeasurement", () => {
    it("leaves plain integers and fractions alone", () => {
      expect(localeToPlainMeasurement("2 cups", ".")).toBe("2 cups");
      expect(localeToPlainMeasurement("1 1/2 cups", ".")).toBe("1 1/2 cups");
      expect(localeToPlainMeasurement("1/2 tsp", ",")).toBe("1/2 tsp");
    });

    it("converts a comma decimal to plain form", () => {
      expect(localeToPlainMeasurement("1,5 kg", ",")).toBe("1.5 kg");
      expect(localeToPlainMeasurement("1,5 kg", ".")).toBe("1.5 kg");
    });

    it("leaves a dot decimal in plain form", () => {
      expect(localeToPlainMeasurement("1.5 cups", ".")).toBe("1.5 cups");
      expect(localeToPlainMeasurement("1.5 cups", ",")).toBe("1.5 cups");
    });

    it("keeps a leading-zero decimal a decimal in either notation", () => {
      for (const decimalNotationMode of BOTH) {
        expect(localeToPlainMeasurement("0,125 l", decimalNotationMode)).toBe(
          "0.125 l",
        );
        expect(localeToPlainMeasurement("0.125 l", decimalNotationMode)).toBe(
          "0.125 l",
        );
      }
    });

    it("resolves an ambiguous group by the given notation", () => {
      expect(localeToPlainMeasurement("1,125 kg", ",")).toBe("1.125 kg");
      expect(localeToPlainMeasurement("1,125 kg", ".")).toBe("1125 kg");
      expect(localeToPlainMeasurement("1.125 kg", ".")).toBe("1.125 kg");
      expect(localeToPlainMeasurement("1.125 kg", ",")).toBe("1125 kg");
    });

    it("strips repeated grouping", () => {
      expect(localeToPlainMeasurement("1,000,000 g", ".")).toBe("1000000 g");
      expect(localeToPlainMeasurement("1,000,000 g", ",")).toBe("1000000 g");
      expect(localeToPlainMeasurement("1.000.000 g", ",")).toBe("1000000 g");
    });

    it("resolves mixed separators without needing a notation", () => {
      for (const decimalNotationMode of BOTH) {
        expect(localeToPlainMeasurement("1.000,5 g", decimalNotationMode)).toBe(
          "1000.5 g",
        );
        expect(localeToPlainMeasurement("1,000.5 g", decimalNotationMode)).toBe(
          "1000.5 g",
        );
      }
    });

    it("leaves dates and versions untouched", () => {
      for (const decimalNotationMode of BOTH) {
        expect(
          localeToPlainMeasurement("MHD 12.05.2026", decimalNotationMode),
        ).toBe("MHD 12.05.2026");
        expect(
          localeToPlainMeasurement("Seite 1.2.3", decimalNotationMode),
        ).toBe("Seite 1.2.3");
      }
    });

    it("does not touch a comma used as punctuation", () => {
      expect(localeToPlainMeasurement("2 apples, diced", ",")).toBe(
        "2 apples, diced",
      );
      expect(localeToPlainMeasurement("Salt, to taste", ",")).toBe(
        "Salt, to taste",
      );
    });

    it("converts both endpoints of a range", () => {
      expect(localeToPlainMeasurement("1,5-2,5 kg", ",")).toBe("1.5-2.5 kg");
    });
  });

  describe("idempotence", () => {
    const CORPUS = [
      "2 cups",
      "1,5 kg",
      "1.5 cups",
      "0,125 l",
      "1,125 kg",
      "1.125 kg",
      "1,000 g",
      "1.000 g",
      "1,000,000 g",
      "1.000,5 g",
      "1,000.5 g",
      "1 1/2 cups",
      "1,5-2,5 kg",
      "MHD 12.05.2026",
      "12345,678 g",
    ];

    it("is stable when plain output is re-read as plain", () => {
      for (const decimalNotationMode of BOTH) {
        for (const input of CORPUS) {
          const once = localeToPlainMeasurement(input, decimalNotationMode);
          expect(
            localeToPlainMeasurement(once, "."),
            `${input} written in "${decimalNotationMode}"`,
          ).toBe(once);
        }
      }
    });

    it("is stable under repeated application in dot notation", () => {
      for (const input of CORPUS) {
        const once = localeToPlainMeasurement(input, ".");
        expect(localeToPlainMeasurement(once, "."), input).toBe(once);
      }
    });

    it("is unsafe to re-apply to plain output in comma notation", () => {
      expect(localeToPlainMeasurement("1,125 kg", ",")).toBe("1.125 kg");
      expect(localeToPlainMeasurement("1.125 kg", ",")).toBe("1125 kg");
    });
  });

  describe("inferDecimalNotation", () => {
    it("takes an unambiguous comma decimal as evidence", () => {
      expect(inferDecimalNotation(["1,5 kg"], ".")).toBe(",");
    });

    it("takes an unambiguous dot decimal as evidence", () => {
      expect(inferDecimalNotation(["1.5 cups"], ",")).toBe(".");
    });

    it("ignores ambiguous measurements", () => {
      expect(inferDecimalNotation(["1,125 kg"], ".")).toBe(".");
      expect(inferDecimalNotation(["1,125 kg"], ",")).toBe(",");
    });

    it("lets an unambiguous sibling settle an ambiguous measurement", () => {
      expect(inferDecimalNotation(["1,125 kg", "0,5 l"], ".")).toBe(",");
    });

    it("ignores grouped and opaque tokens", () => {
      expect(inferDecimalNotation(["1,000,000 g"], ".")).toBe(".");
      expect(inferDecimalNotation(["MHD 12.05.2026"], ",")).toBe(",");
    });

    it("takes a leading-zero decimal as evidence", () => {
      expect(inferDecimalNotation(["0,125 l"], ".")).toBe(",");
    });

    it("falls back to the reader when there is no evidence", () => {
      expect(inferDecimalNotation(["3 kg", "2 cups"], ",")).toBe(",");
      expect(inferDecimalNotation([], ",")).toBe(",");
    });
  });

  describe("applyDecimalNotation", () => {
    it("passes plain text through for a dot reader", () => {
      expect(applyDecimalNotation("1.5", ".")).toBe("1.5");
    });

    it("swaps in a comma for a comma reader", () => {
      expect(applyDecimalNotation("1.5", ",")).toBe("1,5");
      expect(applyDecimalNotation("0.75", ",")).toBe("0,75");
    });

    it("rewrites every number in the string", () => {
      expect(applyDecimalNotation("0.237 l-0.473 l", ",")).toBe(
        "0,237 l-0,473 l",
      );
      expect(applyDecimalNotation("1.5 - 2.5 cups", ",")).toBe(
        "1,5 - 2,5 cups",
      );
    });

    it("leaves a dot that is not a decimal point alone", () => {
      expect(applyDecimalNotation("3 fl. oz", ",")).toBe("3 fl. oz");
      expect(applyDecimalNotation("1 tbsp.", ",")).toBe("1 tbsp.");
    });

    it("preserves an approximation prefix", () => {
      expect(applyDecimalNotation("~0.214", ",")).toBe("~0,214");
    });

    it("leaves integers alone", () => {
      expect(applyDecimalNotation("3", ",")).toBe("3");
    });
  });

  describe("formatQuantity", () => {
    it("renders without digit grouping so it can be read back", () => {
      expect(formatQuantity(1000, ".", 2)).toBe("1000");
      expect(formatQuantity(2500, ",", 2)).toBe("2500");
    });

    it("renders in the given notation", () => {
      expect(formatQuantity(1.5, ",", 2)).toBe("1,5");
      expect(formatQuantity(1.5, ".", 2)).toBe("1.5");
    });

    it("rounds to two fraction digits by default", () => {
      expect(formatQuantity(1.129, ".", 2)).toBe("1.13");
      expect(formatQuantity(4, ".", 2)).toBe("4");
    });

    it("returns an empty string for a non-finite value", () => {
      expect(formatQuantity(NaN, ".", 2)).toBe("");
      expect(formatQuantity(Infinity, ",", 2)).toBe("");
    });

    it("round trips through localeToPlainNumber", () => {
      for (const decimalNotationMode of BOTH) {
        for (const value of [0.5, 1.5, 1000, 2500, 1.13, 12]) {
          const rendered = formatQuantity(value, decimalNotationMode, 2);
          expect(
            Number(localeToPlainNumber(rendered, decimalNotationMode)),
            `${value} in "${decimalNotationMode}"`,
          ).toBe(value);
        }
      }
    });
  });

  describe("localeToPlainNumber", () => {
    it("accepts either notation regardless of the display notation", () => {
      expect(localeToPlainNumber("1,5", ".")).toBe("1.5");
      expect(localeToPlainNumber("1.5", ",")).toBe("1.5");
    });

    it("trims surrounding whitespace", () => {
      expect(localeToPlainNumber("  1,5  ", ".")).toBe("1.5");
    });

    it("passes fractions through", () => {
      expect(localeToPlainNumber("1/2", ",")).toBe("1/2");
      expect(localeToPlainNumber("1 1/2", ",")).toBe("1 1/2");
    });

    it("accepts a bare decimal typed without a leading zero", () => {
      expect(localeToPlainNumber(",5", ",")).toBe("0.5");
      expect(localeToPlainNumber(".5", ".")).toBe("0.5");
      expect(localeToPlainNumber(",25", ",")).toBe("0.25");
    });
  });
});
