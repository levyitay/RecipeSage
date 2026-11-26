import type { IncomingHttpHeaders } from "http";
import acceptLanguage from "accept-language";
import { SupportedLanguages } from "@recipesage/util/shared";

acceptLanguage.languages(Object.values(SupportedLanguages));

const DEFAULT_LANGUAGE = "en-us";

const firstString = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : undefined;
  }
  return typeof value === "string" ? value : undefined;
};

export const getRequestLanguage = (req: {
  headers: IncomingHttpHeaders;
  query: Record<string, unknown>;
}): string => {
  const raw =
    firstString(req.query.preferredLanguage) ||
    firstString(req.headers["x-recipesage-language"]) ||
    firstString(req.headers["accept-language"]);
  return acceptLanguage.get(raw || DEFAULT_LANGUAGE) || DEFAULT_LANGUAGE;
};
