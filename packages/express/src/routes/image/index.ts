import express from "express";
import { createRecipeImageHandler } from "./createRecipeImage";

const router = express.Router();

router.use("/createRecipeImage", createRecipeImageHandler);

export { router as imageRouter };
