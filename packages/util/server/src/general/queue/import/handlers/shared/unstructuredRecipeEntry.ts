import { cleanLabelTitle } from "@recipesage/util/shared";
import type { StandardizedRecipeImportEntry } from "../../../../../db/index";
import { translate } from "../../../../index";

export const getUnformattedImportLabel = async (
  language: string | undefined,
): Promise<string> =>
  cleanLabelTitle(
    await translate(language || "en-us", "pages.import.jobs.label.unformatted"),
  );

export const buildUnstructuredRecipeEntry = (args: {
  title: string;
  notes: string;
  labels: string[];
  images: (string | Buffer)[];
}): StandardizedRecipeImportEntry => ({
  recipe: {
    title: args.title,
    description: "",
    folder: "main",
    source: "",
    url: "",
    rating: undefined,
    yield: "",
    activeTime: "",
    totalTime: "",
    ingredients: "",
    instructions: "",
    notes: args.notes,
    nutritionInfo: undefined,
  },
  labels: args.labels,
  images: args.images,
});
