import { registerRoute } from "workbox-routing";
import {
  swAssertStatusCacheDivert,
  swCacheReject,
  SWCacheRejectReason,
} from "../../swErrorHandling";
import { appIdbStorageManager } from "../../../appIdbStorageManager";
import { getLocalDb, ObjectStoreName } from "../../../localDb";
import { trpcClient as trpc } from "../../../trpcClient";
import { encodeCacheResultForTrpc } from "../../encodeCacheResultForTrpc";

export const registerGetLabelsRoute = () => {
  registerRoute(
    /((https:\/\/api(\.beta)?\.recipesage\.com)|(\/api))\/trpc\/labels\.getLabels/,
    async (event) => {
      try {
        const response = await fetch(event.request);

        swAssertStatusCacheDivert(response);

        return response;
      } catch (e) {
        const localDb = await getLocalDb();

        const session = await appIdbStorageManager.getSession();
        if (!session) {
          return swCacheReject(SWCacheRejectReason.NoSession, e);
        }

        let labels = await localDb.getAll(ObjectStoreName.Labels);

        labels = labels.filter((label) => label.userId === session.userId);

        return encodeCacheResultForTrpc(
          labels satisfies Awaited<
            ReturnType<typeof trpc.labels.getLabels.query>
          >,
        );
      }
    },
    "GET",
  );
};
