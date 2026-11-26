import { prisma, Prisma, recipeSummaryLite } from "@recipesage/prisma";
import { stripNumberedRecipeTitle } from "@recipesage/util/shared";
import { convertPrismaRecipeSummaryLitesToRecipeSummaryLites } from "./convertPrismaRecipeSummaries";

export const getSimilarRecipes = async (
  userId: string,
  recipeIds: string[],
  tx: Prisma.TransactionClient = prisma,
) => {
  const recipes = await tx.recipe.findMany({
    where: {
      id: {
        in: recipeIds,
      },
    },
  });

  if (recipes.length === 0) {
    return [];
  }

  const relatedRecipes = await tx.recipe.findMany({
    where: {
      id: {
        notIn: recipeIds,
      },
      userId,
      OR: [
        ...recipes.map((recipe) => ({
          title: {
            startsWith: stripNumberedRecipeTitle(recipe.title as string),
          },
        })),
        ...recipes
          .filter((recipe) => recipe.ingredients)
          .map((recipe) => ({
            ingredients: recipe.ingredients,
          })),
        ...recipes
          .filter((recipe) => recipe.instructions)
          .map((recipe) => ({
            instructions: recipe.instructions,
          })),
      ],
    },
    ...recipeSummaryLite,
    take: 100,
    orderBy: {
      title: "asc",
    },
  });

  return convertPrismaRecipeSummaryLitesToRecipeSummaryLites(relatedRecipes);
};
