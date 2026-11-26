import type { Prisma } from "@recipesage/prisma";
import {
  recipeSummary,
  type RecipeSummary,
  recipeSummaryLite,
  type RecipeSummaryLite,
} from "@recipesage/prisma";
import { convertPrismaDateToDatestampNullable } from "./convertPrismaDateToDatestamp";
import { sanitizeRemoveHtmlFromString } from "../general/sanitizeRemoveHtmlFromString";

type PrismaRecipeSummary = Prisma.RecipeGetPayload<typeof recipeSummary>;
type PrismaRecipeSummaryLite = Prisma.RecipeGetPayload<
  typeof recipeSummaryLite
>;

export const convertPrismaRecipeSummaryToRecipeSummary = (
  recipe: PrismaRecipeSummary,
): RecipeSummary => {
  const converted = convertPrismaDateToDatestampNullable(recipe, "lastMadeAt");
  return {
    ...converted,
    notes: sanitizeRemoveHtmlFromString(converted.notes),
    ingredients: sanitizeRemoveHtmlFromString(converted.ingredients),
    instructions: sanitizeRemoveHtmlFromString(converted.instructions),
  };
};

export const convertPrismaRecipeSummariesToRecipeSummaries = (
  recipes: PrismaRecipeSummary[],
): RecipeSummary[] => {
  return recipes.map(convertPrismaRecipeSummaryToRecipeSummary);
};

export const convertPrismaRecipeSummaryLiteToRecipeSummaryLite = (
  recipe: PrismaRecipeSummaryLite,
): RecipeSummaryLite => {
  return convertPrismaDateToDatestampNullable(recipe, "lastMadeAt");
};

export const convertPrismaRecipeSummaryLitesToRecipeSummaryLites = (
  recipes: PrismaRecipeSummaryLite[],
): RecipeSummaryLite[] => {
  return recipes.map(convertPrismaRecipeSummaryLiteToRecipeSummaryLite);
};
