CREATE INDEX CONCURRENTLY IF NOT EXISTS "recipes_user_tsv_idx"
  ON "Recipes" USING gin ("userId", tsv);
