import { prisma, PrismaTransactionClient } from "@recipesage/prisma";
import { deleteObjects } from ".";

export const deleteHangingImagesForUser = async (
  userId: string,
  tx: PrismaTransactionClient = prisma,
) => {
  const hangingImages = await tx.image.findMany({
    where: {
      userId,
      recipeImages: {
        none: {},
      },
      profileImages: {
        none: {},
      },
    },
    select: {
      id: true,
      key: true,
    },
  });

  await deleteObjects(hangingImages.map((image) => image.key));

  await tx.image.deleteMany({
    where: {
      id: {
        in: hangingImages.map((image) => image.id),
      },
    },
  });
};
