import express from "express";
import { shareRecipeHandler } from "./recipe";

const router = express.Router();

router.get("/recipe/:recipeId", ...shareRecipeHandler);

export { router as shareRouter };
