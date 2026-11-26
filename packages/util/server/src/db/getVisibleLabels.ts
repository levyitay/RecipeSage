import { LabelSummary, labelSummary, prisma } from "@recipesage/prisma";
import { getFriendshipIds } from "./getFriendshipIds";
import { Prisma } from "@recipesage/prisma";
import { getVisibleProfileItems } from "./getVisibleProfileItems";
import { groupProfileItemsByUserId } from "../general/groupProfileItemsByUserId";

/**
 * Fetches labels for friends, or for a provided list of userIds
 */
export const getVisibleLabels = async (
  contextUserId: string | undefined,
  options: {
    userIds?: string[];
    includeAllFriends?: boolean;
    includeSelf?: boolean;
  },
): Promise<LabelSummary[]> => {
  const includeIds = new Set<string>();
  if (options.userIds) options.userIds.forEach((el) => includeIds.add(el));

  if (contextUserId) {
    const friendships = await getFriendshipIds(contextUserId);
    const friendIds = new Set(friendships.friends);

    if (options.includeAllFriends)
      friendIds.forEach((el) => includeIds.add(el));
    if (options.includeSelf) includeIds.add(contextUserId);
  }

  const visibleProfileItems = await getVisibleProfileItems(contextUserId, [
    ...includeIds,
  ]);
  const profileItemsByUserId = groupProfileItemsByUserId(visibleProfileItems);

  const allRecipesUserIds: string[] = [];
  const queryFilters: Prisma.LabelWhereInput[] = [];
  for (const userId of includeIds) {
    const isContextUser = contextUserId && userId === contextUserId;
    const profileItemsForUser = profileItemsByUserId[userId] || [];

    const isSharingAll = profileItemsForUser.find(
      (profileItem) => profileItem.type === "all-recipes",
    );

    if (isContextUser || isSharingAll) {
      allRecipesUserIds.push(userId);
      continue;
    }

    const sharedLabelIds = profileItemsForUser
      .filter((profileItem) => profileItem.type === "label")
      .map((profileItem) => profileItem.labelId)
      .filter((labelId): labelId is string => !!labelId);

    const sharedRecipeIds = profileItemsForUser
      .filter((profileItem) => profileItem.type === "recipe")
      .map((profileItem) => profileItem.recipeId)
      .filter((recipeId): recipeId is string => !!recipeId);

    const userOrFilters: Prisma.LabelWhereInput[] = [];

    if (sharedLabelIds.length) {
      userOrFilters.push({ id: { in: sharedLabelIds } });
      // Includes labels not just explicitly shared, but labels attached to any shared recipes within an explicitly shared label.
      userOrFilters.push({
        recipeLabels: {
          some: {
            recipe: {
              recipeLabels: {
                some: {
                  labelId: { in: sharedLabelIds },
                },
              },
            },
          },
        },
      });
    }

    if (sharedRecipeIds.length) {
      userOrFilters.push({
        recipeLabels: {
          some: {
            recipeId: { in: sharedRecipeIds },
          },
        },
      });
    }

    if (userOrFilters.length) {
      queryFilters.push({
        userId,
        OR: userOrFilters,
      });
    }
  }

  if (allRecipesUserIds.length) {
    queryFilters.push({ userId: { in: allRecipesUserIds } });
  }

  if (!queryFilters.length) return [];

  const labels = await prisma.label.findMany({
    where: {
      OR: queryFilters,
    },
    ...labelSummary,
    orderBy: {
      title: "asc",
    },
  });

  return labels;
};
