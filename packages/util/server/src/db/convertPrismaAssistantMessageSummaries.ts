import type { Prisma } from "@recipesage/prisma";
import {
  assistantMessageSummary,
  type AssistantMessageSummary,
} from "@recipesage/prisma";
import { convertPrismaRecipeSummaryLiteToRecipeSummaryLite } from "./convertPrismaRecipeSummaries";

type PrismaAssistantMessageSummary = Prisma.AssistantMessageGetPayload<
  typeof assistantMessageSummary
>;

export const convertPrismaAssistantMessageSummaryToAssistantMessageSummary = (
  message: PrismaAssistantMessageSummary,
): AssistantMessageSummary => {
  return {
    ...message,
    recipe: message.recipe
      ? convertPrismaRecipeSummaryLiteToRecipeSummaryLite(message.recipe)
      : null,
  };
};

export const convertPrismaAssistantMessageSummariesToAssistantMessageSummaries =
  (messages: PrismaAssistantMessageSummary[]): AssistantMessageSummary[] => {
    return messages.map(
      convertPrismaAssistantMessageSummaryToAssistantMessageSummary,
    );
  };
