import * as Sentry from "@sentry/node";

import { prisma } from "@recipesage/prisma";
import { getShoppingListItemCategories } from "@recipesage/util/server/general";

const waitFor = async (timeout: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
};

export const categorizeShoppingListItems = async () => {
  try {
    while (true) {
      const items = await prisma.shoppingListItem.findMany({
        where: {
          categoryTitle: null,
        },
        select: {
          id: true,
          title: true,
        },
        take: 40,
      });

      if (!items.length) {
        console.log("Categorization complete!");
        return;
      }

      const categoryTitles = await getShoppingListItemCategories(
        items.map((el) => el.title),
      );

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const categoryTitle = `::${categoryTitles[i]}`;

        await prisma.shoppingListItem.update({
          where: {
            id: item.id,
          },
          data: {
            categoryTitle,
          },
        });
        await waitFor(100);
      }
    }
  } catch (e) {
    Sentry.captureException(e);
    console.log("Error while processing", e);
    throw e;
  }
};
