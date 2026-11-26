import { router } from "../../trpc";
import { createRecipeImageFromUrl } from "./createRecipeImageFromUrl";

export const imagesRouter = router({
  createRecipeImageFromUrl,
});
