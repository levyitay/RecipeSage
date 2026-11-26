import {
  assertCreditsAvailable,
  CreditLimitExceededError,
  CreditOperation,
} from "@recipesage/util/server/general";
import { CreditLimitExceededHttpError } from "../errors";

export const assertCreditsAvailableExpress = async (
  userId: string,
  operation: CreditOperation,
): Promise<void> => {
  try {
    await assertCreditsAvailable(userId, operation);
  } catch (e) {
    if (e instanceof CreditLimitExceededError) {
      throw new CreditLimitExceededHttpError(e.message);
    }
    throw e;
  }
};
