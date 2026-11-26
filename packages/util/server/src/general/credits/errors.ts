export class CreditLimitExceededError extends Error {
  constructor(message = "Daily credit limit reached") {
    super(message);
    this.name = "CreditLimitExceededError";
  }
}
