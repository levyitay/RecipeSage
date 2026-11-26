import express from "express";
import { printShoppingListHandler } from "./printShoppingList";
import { printMealPlanHandler } from "./printMealPlan";
import { printRecipeHandler } from "./printRecipe";

const router = express.Router();

router.get("/shoppingList/:shoppingListId", ...printShoppingListHandler);
router.get("/mealPlan/:mealPlanId", ...printMealPlanHandler);
router.get("/recipe/:recipeId", ...printRecipeHandler);

export { router as printRouter };
