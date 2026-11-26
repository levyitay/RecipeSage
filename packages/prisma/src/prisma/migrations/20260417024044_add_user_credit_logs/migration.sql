-- CreateTable
CREATE TABLE "UserCreditLogs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "operation" VARCHAR(64) NOT NULL,
    "credits" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCreditLogs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_credit_logs_user_id_created_at" ON "UserCreditLogs"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "UserCreditLogs" ADD CONSTRAINT "UserCreditLogs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
