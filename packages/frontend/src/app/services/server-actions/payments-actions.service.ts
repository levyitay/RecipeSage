import { Injectable } from "@angular/core";

import { ErrorHandlers } from "../http-error-handler.service";
import { ActionsBase, RouterInputs, RouterOutputs } from "./actions-base";

@Injectable({
  providedIn: "root",
})
export class PaymentsActionsService extends ActionsBase {
  createStripeCheckoutSession(
    input: RouterInputs["payments"]["createStripeCheckoutSession"],
    errorHandlers?: ErrorHandlers,
  ): Promise<
    RouterOutputs["payments"]["createStripeCheckoutSession"] | undefined
  > {
    return this.passThrough(
      () => this.trpc.payments.createStripeCheckoutSession.mutate(input),
      errorHandlers,
    );
  }
}
