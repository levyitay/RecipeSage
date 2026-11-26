-- CreateTable
CREATE TABLE "ClipCache" (
    "id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "urlHash" BYTEA NOT NULL,
    "recipe" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ClipCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClipCache_urlHash_key" ON "ClipCache"("urlHash");
