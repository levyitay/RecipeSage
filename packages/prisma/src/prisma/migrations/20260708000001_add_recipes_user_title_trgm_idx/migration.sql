CREATE INDEX CONCURRENTLY IF NOT EXISTS "recipes_user_title_trgm_idx"
  ON "Recipes" USING gist ("userId", immutable_unaccent(lower(title)) gist_trgm_ops);
