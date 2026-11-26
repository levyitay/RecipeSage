import { Injectable } from "@angular/core";

import { ErrorHandlers } from "../http-error-handler.service";
import { ActionsBase, RouterInputs, RouterOutputs } from "./actions-base";

@Injectable({
  providedIn: "root",
})
export class ImagesActionsService extends ActionsBase {
  createRecipeImageFromUrl(
    input: RouterInputs["images"]["createRecipeImageFromUrl"],
    errorHandlers?: ErrorHandlers,
  ): Promise<RouterOutputs["images"]["createRecipeImageFromUrl"] | undefined> {
    return this.passThrough(
      () => this.trpc.images.createRecipeImageFromUrl.mutate(input),
      errorHandlers,
    );
  }
}
