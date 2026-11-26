-- Preserve title overflow in the notes column before bounding title length.
UPDATE "Recipes"
SET "notes" = CASE
                WHEN "notes" = '' THEN substring("title" from 255)
                ELSE substring("title" from 255) || E'\n\n' || "notes"
              END,
    "title" = left("title", 254)
WHERE length("title") > 254;

-- AlterTable
ALTER TABLE "Recipes" ALTER COLUMN "title" SET DATA TYPE VARCHAR(255);

-- CreateIndex
CREATE INDEX "recipes_user_folder_created_at" ON "Recipes" ("userId", "folder", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "recipes_user_folder_title" ON "Recipes" ("userId", "folder", "title");

-- CreateIndex
CREATE INDEX "friendships_friend_id" ON "Friendships" ("friendId");
