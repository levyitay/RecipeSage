export type DecimalNotation = "." | ",";

const GROUPED_DIGITS = 3;

const numericTokenRegexp = /\d+(?:[.,]\d+)*/g;

export const resolveDecimalNotation = (
  localeHint: string | undefined,
): DecimalNotation => {
  if (!localeHint) return ".";
  try {
    const parts = new Intl.NumberFormat(localeHint).formatToParts(1.5);
    return parts.find((part) => part.type === "decimal")?.value === ","
      ? ","
      : ".";
  } catch {
    return ".";
  }
};

type TokenKind =
  | { kind: "plain" }
  | { kind: "decimal"; separator: DecimalNotation; ambiguous: boolean }
  | { kind: "grouped" }
  | { kind: "opaque" };

const isGroupedShape = (token: string, separator: DecimalNotation): boolean =>
  new RegExp(
    `^[1-9]\\d{0,${GROUPED_DIGITS - 1}}(?:\\${separator}\\d{${GROUPED_DIGITS}})+$`,
  ).test(token);

export const classifyNumericToken = (token: string): TokenKind => {
  const dots = token.split(".").length - 1;
  const commas = token.split(",").length - 1;
  if (dots === 0 && commas === 0) return { kind: "plain" };

  if (dots > 0 && commas > 0) {
    const separator: DecimalNotation =
      token.lastIndexOf(".") > token.lastIndexOf(",") ? "." : ",";
    const occurrences = separator === "." ? dots : commas;
    if (occurrences > 1) return { kind: "opaque" };
    const grouping: DecimalNotation = separator === "." ? "," : ".";
    const whole = token.slice(0, token.lastIndexOf(separator));
    if (!isGroupedShape(whole, grouping)) return { kind: "opaque" };
    return { kind: "decimal", separator, ambiguous: false };
  }

  const separator: DecimalNotation = dots > 0 ? "." : ",";
  if ((separator === "." ? dots : commas) > 1) {
    return isGroupedShape(token, separator)
      ? { kind: "grouped" }
      : { kind: "opaque" };
  }

  return {
    kind: "decimal",
    separator,
    ambiguous: isGroupedShape(token, separator),
  };
};

export const inferDecimalNotation = (
  measurementTexts: readonly string[],
  readerDecimalNotationMode: DecimalNotation,
): DecimalNotation => {
  for (const text of measurementTexts) {
    for (const token of text.match(numericTokenRegexp) ?? []) {
      const classified = classifyNumericToken(token);
      if (classified.kind === "decimal" && !classified.ambiguous) {
        return classified.separator;
      }
    }
  }
  return readerDecimalNotationMode;
};

const localeToPlainToken = (
  token: string,
  decimalNotationMode: DecimalNotation,
): string => {
  const classified = classifyNumericToken(token);

  switch (classified.kind) {
    case "plain":
    case "opaque":
      return token;
    case "grouped":
      return token.replace(/[.,]/g, "");
    case "decimal": {
      const readsAsDecimal =
        !classified.ambiguous || classified.separator === decimalNotationMode;
      if (!readsAsDecimal) return token.replace(/[.,]/g, "");
      const splitAt = token.lastIndexOf(classified.separator);
      const whole = token.slice(0, splitAt).replace(/[.,]/g, "");
      return `${whole}.${token.slice(splitAt + 1)}`;
    }
  }
};

export const localeToPlainMeasurement = (
  measurement: string,
  decimalNotationMode: DecimalNotation,
): string =>
  measurement.replace(numericTokenRegexp, (token) =>
    localeToPlainToken(token, decimalNotationMode),
  );

export const applyDecimalNotation = (
  text: string,
  decimalNotationMode: DecimalNotation,
): string =>
  decimalNotationMode === "."
    ? text
    : text.replace(/(\d)\.(\d)/g, `$1${decimalNotationMode}$2`);

export const formatQuantity = (
  value: number,
  decimalNotationMode: DecimalNotation,
  maximumFractionDigits: number,
): string => {
  if (!Number.isFinite(value)) return "";
  const rounded = parseFloat(value.toFixed(maximumFractionDigits)).toString();
  return applyDecimalNotation(rounded, decimalNotationMode);
};

export const localeToPlainNumber = (
  text: string,
  decimalNotationMode: DecimalNotation,
): string => {
  const trimmed = text.trim();
  const withLeadingZero = /^[.,]/.test(trimmed) ? `0${trimmed}` : trimmed;
  return localeToPlainMeasurement(withLeadingZero, decimalNotationMode);
};
