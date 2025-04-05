import { Capabilities } from "@recipesage/util/shared";

export const CAPABILITY_GRACE_PERIOD = 7;
export const MULTIPLE_IMAGES_UNLOCKED_LIMIT = 10;

export enum SubscriptionModels {
  PyoMonthly = "pyo-monthly",
  PyoSingle = "pyo-single",
  Forever = "forever",
}

export const SUBSCRIPTION_MODELS = {
  [SubscriptionModels.PyoMonthly]: {
    title: "Choose your own price",
    expiresIn: 31,
    capabilities: [
      Capabilities.HighResImages,
      Capabilities.MultipleImages,
      Capabilities.ExpandablePreviews,
      Capabilities.AssistantMoreMessages,
    ],
  },
  [SubscriptionModels.PyoSingle]: {
    title: "Choose your own price - One time",
    expiresIn: 365,
    capabilities: [
      Capabilities.HighResImages,
      Capabilities.MultipleImages,
      Capabilities.ExpandablePreviews,
      Capabilities.AssistantMoreMessages,
    ],
  },
  [SubscriptionModels.Forever]: {
    title: "The Forever Subscription...",
    expiresIn: 3650, // 10 years - okay, not quite forever
    capabilities: [
      Capabilities.HighResImages,
      Capabilities.MultipleImages,
      Capabilities.ExpandablePreviews,
      Capabilities.AssistantMoreMessages,
    ],
  },
};
