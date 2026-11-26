import { Injectable } from "@angular/core";

import { ErrorHandlers } from "../http-error-handler.service";
import { ActionsBase, RouterInputs, RouterOutputs } from "./actions-base";
import { getLocalDb, ObjectStoreName } from "../../utils/localDb";

@Injectable({
  providedIn: "root",
})
export class AssistantActionsService extends ActionsBase {
  getAssistantMessages(
    errorHandlers?: ErrorHandlers,
  ): Promise<RouterOutputs["assistant"]["getAssistantMessages"] | undefined> {
    return this.executeQuery(
      () => this.trpc.assistant.getAssistantMessages.query(),
      async () => {
        const localDb = await getLocalDb();
        return localDb.getAll(ObjectStoreName.AssistantMessages);
      },
      errorHandlers,
    );
  }

  sendAssistantMessage(
    input: RouterInputs["assistant"]["sendAssistantMessage"],
    errorHandlers?: ErrorHandlers,
  ): Promise<RouterOutputs["assistant"]["sendAssistantMessage"] | undefined> {
    return this.passThrough(
      () => this.trpc.assistant.sendAssistantMessage.query(input),
      errorHandlers,
    );
  }
}
