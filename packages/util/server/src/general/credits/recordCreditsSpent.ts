import * as Sentry from "@sentry/node";
import { prisma } from "@recipesage/prisma";
import { CREDIT_COSTS, CreditOperation } from "./creditCosts";

export const recordCreditsSpent = async (
  userId: string,
  operation: CreditOperation,
): Promise<void> => {
  try {
    await prisma.userCreditLog.create({
      data: {
        userId,
        operation,
        credits: CREDIT_COSTS[operation],
      },
    });
  } catch (e) {
    Sentry.captureException(e);
  }
};
