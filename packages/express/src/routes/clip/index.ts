import express from "express";
import { clipGetHandler } from "./clipGet";
import { clipPostHandler } from "./clipPost";

const router = express.Router();

router.get("/", ...clipGetHandler);
router.post("/", ...clipPostHandler);

export { router as clipRouter };
