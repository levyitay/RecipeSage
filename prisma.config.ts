import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "packages/prisma/src/prisma",
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
