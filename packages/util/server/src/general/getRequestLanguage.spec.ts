import { describe, it, expect } from "vitest";
import { getRequestLanguage } from "./getRequestLanguage";

const req = (
  headers: Record<string, string | string[] | undefined>,
  query: { preferredLanguage?: unknown } = {},
) => ({
  headers,
  query,
});

describe("getRequestLanguage", () => {
  it("returns en-us when both headers are missing", () => {
    expect(getRequestLanguage(req({}))).toBe("en-us");
  });

  it("returns en-us when both headers are empty strings", () => {
    expect(
      getRequestLanguage(
        req({ "x-recipesage-language": "", "accept-language": "" }),
      ),
    ).toBe("en-us");
  });

  it("returns the X-RecipeSage-Language value when set", () => {
    expect(getRequestLanguage(req({ "x-recipesage-language": "de-de" }))).toBe(
      "de-de",
    );
  });

  it("prefers X-RecipeSage-Language over Accept-Language", () => {
    expect(
      getRequestLanguage(
        req({
          "x-recipesage-language": "de-de",
          "accept-language": "fr-fr",
        }),
      ),
    ).toBe("de-de");
  });

  it("falls back to Accept-Language when X-RecipeSage-Language is missing", () => {
    expect(getRequestLanguage(req({ "accept-language": "fr-fr" }))).toBe(
      "fr-fr",
    );
  });

  it("unwraps array X-RecipeSage-Language values to their first entry", () => {
    expect(
      getRequestLanguage(req({ "x-recipesage-language": ["it-it", "de-de"] })),
    ).toBe("it-it");
  });

  it("normalizes unknown locales to a SupportedLanguages value", () => {
    expect(
      getRequestLanguage(
        req({ "x-recipesage-language": "xx-not-a-real-locale" }),
      ),
    ).toBe("en-us");
  });

  it("parses Accept-Language quality lists", () => {
    expect(
      getRequestLanguage(
        req({ "accept-language": "fr-fr;q=0.9, de-de;q=0.8" }),
      ),
    ).toBe("fr-fr");
  });

  it("never returns an unbounded string from a giant header", () => {
    const giant = "x".repeat(10000);
    expect(getRequestLanguage(req({ "x-recipesage-language": giant }))).toBe(
      "en-us",
    );
  });

  it("returns the preferredLanguage query parameter when set", () => {
    expect(getRequestLanguage(req({}, { preferredLanguage: "de-de" }))).toBe(
      "de-de",
    );
  });

  it("prefers the query parameter over both headers", () => {
    expect(
      getRequestLanguage(
        req(
          {
            "x-recipesage-language": "fr-fr",
            "accept-language": "it-it",
          },
          { preferredLanguage: "de-de" },
        ),
      ),
    ).toBe("de-de");
  });

  it("normalizes the query parameter to a SupportedLanguages value", () => {
    expect(getRequestLanguage(req({}, { preferredLanguage: "de-DE" }))).toBe(
      "de-de",
    );
  });

  it("unwraps an array query parameter to its first entry", () => {
    expect(
      getRequestLanguage(req({}, { preferredLanguage: ["it-it", "de-de"] })),
    ).toBe("it-it");
  });

  it("falls back to the headers when the query parameter is not a string", () => {
    expect(
      getRequestLanguage(
        req({ "x-recipesage-language": "de-de" }, { preferredLanguage: {} }),
      ),
    ).toBe("de-de");
  });

  it("falls back to the headers when the query parameter is an empty string", () => {
    expect(
      getRequestLanguage(
        req({ "x-recipesage-language": "de-de" }, { preferredLanguage: "" }),
      ),
    ).toBe("de-de");
  });
});
