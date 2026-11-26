-- CreateTable
CREATE TABLE "RecipeLinks" (
    "id" UUID NOT NULL,
    "recipeId" UUID NOT NULL,
    "linkedRecipeId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RecipeLinks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecipeLinks_recipeId_idx" ON "RecipeLinks"("recipeId");

-- CreateIndex
CREATE INDEX "RecipeLinks_linkedRecipeId_idx" ON "RecipeLinks"("linkedRecipeId");

-- CreateIndex
CREATE UNIQUE INDEX "RecipeLinks_recipeId_linkedRecipeId_key" ON "RecipeLinks"("recipeId", "linkedRecipeId");

-- AddForeignKey
ALTER TABLE "RecipeLinks" ADD CONSTRAINT "RecipeLinks_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeLinks" ADD CONSTRAINT "RecipeLinks_linkedRecipeId_fkey" FOREIGN KEY ("linkedRecipeId") REFERENCES "Recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
