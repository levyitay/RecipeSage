export interface RecipeLike {
  title?: string;
  ingredients?: string;
  instructions?: string;
}

export const isRecipeRecognitionSuccess = (
  recipe: RecipeLike | null | undefined,
): boolean => {
  if (!recipe) return false;
  return (
    !!recipe.title?.trim() &&
    !!recipe.ingredients?.trim() &&
    !!recipe.instructions?.trim()
  );
};
