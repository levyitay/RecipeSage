export const DEFAULT_MEALS = [
  "breakfast",
  "lunch",
  "dinner",
  "snacks",
  "other",
];

export const DEFAULT_MEAL_I18N: Record<string, string> = {
  breakfast: "components.mealCalendar.breakfast",
  lunch: "components.mealCalendar.lunch",
  dinner: "components.mealCalendar.dinner",
  snacks: "components.mealCalendar.snack",
  other: "components.mealCalendar.other",
};

export const DEFAULT_MEAL_COLORS: Record<string, string> = {
  breakfast: "#eb445a",
  lunch: "#ffc409",
  dinner: "#2dd36f",
  snacks: "#6a64ff",
  other: "#92949c",
};

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function parseColorPrefix(line: string): ParsedMealEntry {
  if (line.length > 8 && line[0] === "#" && line[7] === " ") {
    const colorPart = line.substring(0, 7);
    if (HEX_COLOR_RE.test(colorPart)) {
      return { name: line.substring(8), color: colorPart };
    }
  }
  return { name: line, color: null };
}

export interface ParsedMealEntry {
  name: string;
  color: string | null;
}

export function parseCustomMealOptions(
  customMealOptions: string | null | undefined,
): ParsedMealEntry[] {
  if (!customMealOptions?.trim()) return [];

  return customMealOptions
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parseColorPrefix);
}

export function getMealSortOrder(
  customMealOptions: string | null | undefined,
): Map<string, number> {
  const entries = parseCustomMealOptions(customMealOptions);

  if (entries.length === 0) {
    const map = new Map<string, number>();
    DEFAULT_MEALS.forEach((meal, idx) => map.set(meal, idx + 1));
    return map;
  }

  const map = new Map<string, number>();
  let index = 1;

  for (const entry of entries) {
    const key = entry.name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, index++);
    }
  }

  for (const meal of DEFAULT_MEALS) {
    if (!map.has(meal)) {
      map.set(meal, index++);
    }
  }

  return map;
}

export function getOrderedMeals(
  customMealOptions: string | null | undefined,
): string[] {
  const entries = parseCustomMealOptions(customMealOptions);

  if (entries.length === 0) {
    return [...DEFAULT_MEALS];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const entry of entries) {
    const key = entry.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(DEFAULT_MEALS.includes(key) ? key : entry.name);
    }
  }

  for (const meal of DEFAULT_MEALS) {
    if (!seen.has(meal)) {
      result.push(meal);
    }
  }

  return result;
}

export function getMealDisplayNames(
  customMealOptions: string | null | undefined,
): Record<string, string> {
  const entries = parseCustomMealOptions(customMealOptions);
  const names: Record<string, string> = {};

  for (const entry of entries) {
    const key = entry.name.toLowerCase();
    if (!names[key]) {
      names[key] = entry.name;
    }
  }

  return names;
}

export function getMealColors(
  customMealOptions: string | null | undefined,
): Record<string, string> {
  const entries = parseCustomMealOptions(customMealOptions);
  const colors: Record<string, string> = { ...DEFAULT_MEAL_COLORS };

  for (const entry of entries) {
    const key = entry.name.toLowerCase();
    if (entry.color) {
      colors[key] = entry.color;
    } else if (!colors[key]) {
      colors[key] = DEFAULT_MEAL_COLORS.other;
    }
  }

  return colors;
}
