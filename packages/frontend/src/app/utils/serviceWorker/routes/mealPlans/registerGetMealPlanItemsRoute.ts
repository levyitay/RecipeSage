import { registerRoute } from "workbox-routing";
import {
  swAssertStatusCacheDivert,
  swCacheReject,
  SWCacheRejectReason,
} from "../../swErrorHandling";
import { getLocalDb, ObjectStoreName } from "../../../localDb";
import { getTrpcInputForEvent } from "../../getTrpcInputForEvent";
import { trpcClient as trpc } from "../../../trpcClient";
import { encodeCacheResultForTrpc } from "../../encodeCacheResultForTrpc";

export const registerGetMealPlanItemsRoute = () => {
  registerRoute(
    /((https:\/\/api(\.beta)?\.recipesage\.com)|(\/api))\/trpc\/mealPlans\.getMealPlanItems/,
    async (event) => {
      try {
        const response = await fetch(event.request);

        swAssertStatusCacheDivert(response);

        return response;
      } catch (e) {
        const input =
          getTrpcInputForEvent<
            Parameters<typeof trpc.mealPlans.getMealPlanItems.query>[0]
          >(event);
        if (!input) return swCacheReject(SWCacheRejectReason.NoInput, e);

        const { mealPlanId } = input;

        const localDb = await getLocalDb();

        const mealPlan = await localDb.get(
          ObjectStoreName.MealPlans,
          mealPlanId,
        );

        if (!mealPlan) {
          return swCacheReject(SWCacheRejectReason.NoCacheResult, e);
        }

        return encodeCacheResultForTrpc(
          mealPlan.items satisfies Awaited<
            ReturnType<typeof trpc.mealPlans.getMealPlanItems.query>
          >,
        );
      }
    },
    "GET",
  );
};
