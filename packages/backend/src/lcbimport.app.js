import "./services/sentry-init.js";
import * as Sentry from "@sentry/node";

import * as fs from "fs-extra";
import * as extract from "extract-zip";
import { spawn } from "child_process";

import {
  sequelize,
  Recipe,
  Label,
  Recipe_Label,
  Recipe_Image,
  Image,
} from "./models/index.js";

import * as Util from "@recipesage/util/shared";
import * as UtilService from "./services/util.js";
import { writeImageFile, ObjectTypes } from "@recipesage/util/server/storage";

let runConfig = {
  path: process.argv[2],
  userId: process.argv[3],
  labels: process.argv[4],
  includeStockRecipes: process.argv.indexOf("--includeStockRecipes") > -1,
  excludeImages: process.argv.indexOf("--excludeImages") > -1,
  includeTechniques: process.argv.indexOf("--includeTechniques") > -1,
  multipleImages: process.argv.indexOf("--multipleImages") > -1,
};

const logError = (e) => {
  console.error(e);

  Sentry.withScope((scope) => {
    scope.setExtra("runConfig", runConfig);
    scope.setExtra("user", runConfig.userId);
    Sentry.captureException(e);
  });
};

const exit = (status) => {
  Sentry.close(2000);

  cleanup();
  process.exit(status);
};

let tablesNeeded = [
  "t_cookbook",
  // "t_cookbookchapter",
  // "t_cookbookchapterassocation",
  // "t_attachment", //2x unused
  "t_authornote", // seems to be a cross between description (short) and notes (long) - sometimes very long (multiple entries per recipe, divided paragraph)
  // "t_cookbook_x", // unused from this db afaik
  // "t_favorite_x", //2x unused
  // "t_favoritefolder", //2x unused
  // "t_glossaryitem",
  // "t_groceryaisle",
  // "t_grocerylistitemrecipe",
  "t_image", // Holds filenames for all images
  // "t_ingredient",
  // "t_ingredientattachment",
  // "t_ingredientautocomplete",
  // "t_ingredientfolder",
  // "t_ingredientfolder_x",
  // "t_ingredientimage",
  // "t_meal", // Holds meal names with an abbreviation. No reference to any other table
  // "t_measure",
  // "t_measure_x",
  // "t_menu", // Holds menu info - has some "types" info that might be useful for labelling
  // "t_menu_x", // unused
  // "t_menuimage",
  "t_recipe",
  // "t_recipe_x", //2x unused
  // "t_recipeattachment", // 2x unused
  "t_recipeimage", // bidirectional relation table between recipe and image
  "t_recipeingredient",
  // "t_recipemeasure",
  "t_recipeprocedure",
  // "t_recipereview",
  "t_technique",
  "t_recipetechnique",
  "t_recipetip",
  // "t_recipetype", // seems to store category names, but no discernable relationship to recipe table - better to use recipetypes field in recipe itself (comma separated)
  // "t_recipetype_x", //2x unused
  // "t_grocerylistitem",
  // "t_ingredient_x", //2x unused
  // "t_ingredientmeasure", //not entirely clear - looks like a relationship table between ingredients and measurements
  // "t_recipemedia" //2x unused (or barely used)
];

let zipPath = runConfig.path;
let extractPath = zipPath + "-extract";
let tableMap = {};

const cleanup = () => {
  fs.removeSync(zipPath);
  fs.removeSync(extractPath);
};

async function main() {
  try {
    const labels =
      runConfig.labels === "null" ? [] : runConfig.labels.split(",");

    await extract(zipPath, { dir: extractPath });

    fs.unlinkSync(zipPath);

    let potentialDbPaths = await UtilService.findFilesByRegex(
      extractPath,
      /\.mdb/i,
    );
    if (potentialDbPaths.length == 0) throw new Error("No lcb db paths!");

    if (potentialDbPaths.length > 1) {
      console.log("More than one lcbdb path - ", potentialDbPaths);
      Sentry.withScope((scope) => {
        scope.setExtra("paths", potentialDbPaths);
        Sentry.captureMessage("More than one lcbdb path");
      });
    }

    for (const tableName of tablesNeeded) {
      const jsonl = await new Promise((resolve, reject) => {
        const process = spawn("mdb-json", [potentialDbPaths[0], tableName]);

        let stdout = "";
        let stderr = "";
        process.stdout.on("data", (data) => {
          stdout += data;
        });

        process.stderr.on("data", (data) => {
          stderr += data;
        });

        process.on("close", (code) => {
          code > 0 ? reject(stderr) : resolve(stdout);
        });
      });

      const json = jsonl
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));

      tableMap[tableName] = json;
    }

    let labelMap = {};

    let pendingRecipes = [];

    tableMap.t_recipe = (tableMap.t_recipe || []).filter(
      (lcbRecipe) =>
        !!lcbRecipe.recipeid &&
        (runConfig.includeStockRecipes || !!lcbRecipe.modifieddate),
    );

    let lcbImagesById = (tableMap.t_image || []).reduce((acc, image) => {
      acc[image.imageid] = image;
      return acc;
    }, {});

    let lcbImagesByRecipeId = (tableMap.t_recipeimage || []).reduce(
      (acc, recipeImage) => {
        try {
          acc[recipeImage.recipeid] = acc[recipeImage.recipeid] || [];
          acc[recipeImage.recipeid].push({
            filename: lcbImagesById[recipeImage.imageid].filename,
            imageindex: parseInt(recipeImage.imageindex, 10),
          });
        } catch (e) {
          // Do nothing
        }
        return acc;
      },
      {},
    );

    let lcbTechniquesById = (tableMap.t_technique || []).reduce(
      (acc, technique) => {
        acc[technique.techniqueid] = technique;
        return acc;
      },
      {},
    );

    let lcbTechniquesByRecipeId = (tableMap.t_recipetechnique || []).reduce(
      (acc, lcbRecipeTechnique) => {
        try {
          acc[lcbRecipeTechnique.recipeid] =
            acc[lcbRecipeTechnique.recipeid] || [];
          acc[lcbRecipeTechnique.recipeid].push(
            lcbTechniquesById[lcbRecipeTechnique.techniqueid],
          );
        } catch (e) {
          // Do nothing
        }
        return acc;
      },
      {},
    );

    let lcbIngredientsByRecipeId = (tableMap.t_recipeingredient || []).reduce(
      (acc, lcbIngredient) => {
        acc[lcbIngredient.recipeid] = acc[lcbIngredient.recipeid] || [];
        acc[lcbIngredient.recipeid].push(lcbIngredient);
        return acc;
      },
      {},
    );

    let lcbInstructionsByRecipeId = (tableMap.t_recipeprocedure || []).reduce(
      (acc, lcbInstruction) => {
        acc[lcbInstruction.recipeid] = acc[lcbInstruction.recipeid] || [];
        acc[lcbInstruction.recipeid].push(lcbInstruction);
        return acc;
      },
      {},
    );

    let lcbTipsByRecipeId = (tableMap.t_recipetip || []).reduce(
      (acc, lcbTip) => {
        acc[lcbTip.recipeid] = acc[lcbTip.recipeid] || [];
        acc[lcbTip.recipeid].push(lcbTip);
        return acc;
      },
      {},
    );

    let lcbAuthorNotesByRecipeId = (tableMap.t_authornote || []).reduce(
      (acc, lcbAuthorNote) => {
        acc[lcbAuthorNote.recipeid] = acc[lcbAuthorNote.recipeid] || [];
        acc[lcbAuthorNote.recipeid].push(lcbAuthorNote);
        return acc;
      },
      {},
    );

    let lcbCookbooksById = (tableMap.t_cookbook || []).reduce(
      (acc, lcbCookbook) => {
        acc[lcbCookbook.cookbookid] = acc[lcbCookbook.cookbookid] || [];
        acc[lcbCookbook.cookbookid].push(lcbCookbook);
        return acc;
      },
      {},
    );

    await sequelize.transaction(async (t) => {
      let recipesWithImages = runConfig.excludeImages
        ? []
        : tableMap.t_recipe
            .map((lcbRecipe) => {
              lcbRecipe.imageFileNames = (
                lcbImagesByRecipeId[lcbRecipe.recipeid] || []
              )
                .sort((a, b) => (a.imageindex || 0) - (b.imageindex || 0))
                .filter((e) => e.filename)
                .map((e) => e.filename);
              return lcbRecipe;
            })
            .filter((e) => e.imageFileNames.length > 0);

      let i,
        chunkedRecipesWithImages = [],
        chunk = 50;
      for (i = 0; i < recipesWithImages.length; i += chunk) {
        chunkedRecipesWithImages.push(recipesWithImages.slice(i, i + chunk));
      }

      await chunkedRecipesWithImages.reduce((acc, lcbRecipeChunk) => {
        return acc.then(() => {
          return Promise.all(
            lcbRecipeChunk.map(async (lcbRecipe) => {
              await Promise.all(
                lcbRecipe.imageFileNames.map((imageFileName) => {
                  let possibleImageFiles = UtilService.findFilesByRegex(
                    extractPath,
                    new RegExp(`(${imageFileName})$`, "i"),
                  );

                  if (possibleImageFiles.length == 0) return;

                  return writeImageFile(
                    ObjectTypes.RECIPE_IMAGE,
                    possibleImageFiles[0],
                    false,
                  )
                    .then((image) => {
                      lcbRecipe.images = lcbRecipe.images || [];
                      lcbRecipe.images.push(image);
                    })
                    .catch(() => {
                      // Do nothing
                    });
                }),
              );
            }),
          );
        });
      }, Promise.resolve());

      await Promise.all(
        tableMap.t_recipe.map(async (lcbRecipe) => {
          let images = lcbRecipe.images || [];

          let ingredients = (lcbIngredientsByRecipeId[lcbRecipe.recipeid] || [])
            .filter((lcbIngredient) => lcbIngredient)
            .sort((a, b) => a.ingredientindex > b.ingredientindex)
            .map(
              (lcbIngredient) =>
                `${lcbIngredient.quantitytext || ""} ${
                  lcbIngredient.unittext || ""
                } ${lcbIngredient.ingredienttext || ""}`,
            )
            .join("\r\n");

          let instructions = (
            lcbInstructionsByRecipeId[lcbRecipe.recipeid] || []
          )
            .filter(
              (lcbProcedure) => lcbProcedure && lcbProcedure.proceduretext,
            )
            .sort((a, b) => a.procedureindex > b.procedureindex)
            .map((lcbProcedure) => lcbProcedure.proceduretext)
            .join("\r\n");

          let recipeTips = (lcbTipsByRecipeId[lcbRecipe.recipeid] || [])
            .filter((lcbTip) => lcbTip && lcbTip.tiptext)
            .sort((a, b) => a.tipindex > b.tipindex)
            .map((lcbTip) => lcbTip.tiptext);

          let authorNotes = (lcbAuthorNotesByRecipeId[lcbRecipe.recipeid] || [])
            .filter(
              (lcbAuthorNote) => lcbAuthorNote && lcbAuthorNote.authornotetext,
            )
            .sort((a, b) => a.authornoteindex > b.authornoteindex)
            .map((lcbAuthorNote) => lcbAuthorNote.authornotetext);

          let techniqueNotes = (
            lcbTechniquesByRecipeId[lcbRecipe.recipeid] || []
          )
            .filter((lcbTechnique) => lcbTechnique && lcbTechnique.comments)
            .map(
              (lcbTechnique) =>
                `${lcbTechnique.name}:\r\n${lcbTechnique.comments}`,
            );

          if (!runConfig.includeTechniques) techniqueNotes = [];

          let description = "";

          let notes = [];

          // Add comments to notes
          if (lcbRecipe.comments) notes.push(lcbRecipe.comments);

          // Add "author notes" to description or notes depending on length
          if (authorNotes.length == 1 && authorNotes[0].length <= 150)
            description = authorNotes[0];
          else if (authorNotes.length > 0) notes = [...notes, ...authorNotes];

          // Add recipeTips and join with double return
          notes = [...notes, ...recipeTips, ...techniqueNotes].join("\r\n\r\n");

          let totalTime = (lcbRecipe.readyintime || "").toString().trim();
          if (lcbRecipe.cookingtime) {
            totalTime += ` (${lcbRecipe.cookingtime
              .toString()
              .trim()} cooking time)`;
          }
          totalTime = totalTime.trim();

          let lcbRecipeLabels = [
            ...new Set([
              ...(lcbRecipe.recipetypes || "")
                .split(",")
                .map((el) => el.trim().toLowerCase()),
              ...(lcbCookbooksById[lcbRecipe.cookbookid] || []).map((el) =>
                el.name.trim().toLowerCase(),
              ),
            ]),
          ]
            .filter((el) => el && el.length > 0)
            .map((el) => Util.cleanLabelTitle(el));

          return pendingRecipes.push({
            model: {
              userId: runConfig.userId,
              title: lcbRecipe.recipename || "",
              description: description || "",
              yield: (lcbRecipe.yield || "").toString(),
              activeTime: (lcbRecipe.preparationtime || "").toString(),
              totalTime: totalTime || "",
              source: lcbRecipe.source || "",
              url: lcbRecipe.webpage || "",
              notes: notes || "",
              ingredients: ingredients || "",
              instructions: instructions || "",
              folder: "main",
              fromUserId: null,
            },
            lcbRecipeLabels,
            images,
          });
        }),
      );

      let recipes = await Recipe.bulkCreate(
        pendingRecipes.map((el) => el.model),
        {
          returning: true,
          transaction: t,
        },
      );

      const pendingRecipeImages = [];
      recipes.map((recipe, idx) => {
        if (!runConfig.multipleImages) pendingRecipes[idx].images.splice(1);
        pendingRecipeImages.push(
          ...pendingRecipes[idx].images.map((image, idx) => ({
            image: image,
            recipeId: recipe.id,
            order: idx, // This may need to be improved - currently it just depends on which image finishes uploading first
          })),
        );

        pendingRecipes[idx].lcbRecipeLabels.map((lcbLabelName) => {
          labelMap[lcbLabelName] = labelMap[lcbLabelName] || [];
          labelMap[lcbLabelName].push(recipe.id);
        });

        for (const label of labels) {
          labelMap[label] = labelMap[label] || [];
          labelMap[label].push(recipe.id);
        }
      });

      const savedImages = await Image.bulkCreate(
        pendingRecipeImages.map((p) => ({
          userId: runConfig.userId,
          location: p.image.location,
          key: p.image.key,
          json: p.image,
        })),
        {
          returning: true,
          transaction: t,
        },
      );

      await Recipe_Image.bulkCreate(
        pendingRecipeImages.map((p, idx) => ({
          recipeId: p.recipeId,
          imageId: savedImages[idx].id,
          order: p.order,
        })),
        {
          transaction: t,
        },
      );

      await Promise.all(
        Object.keys(labelMap).map((lcbLabelName) => {
          return Label.findOrCreate({
            where: {
              userId: runConfig.userId,
              title: lcbLabelName,
            },
            transaction: t,
          }).then((labels) => {
            return Recipe_Label.bulkCreate(
              labelMap[lcbLabelName].map((recipeId) => {
                return {
                  labelId: labels[0].id,
                  recipeId,
                };
              }),
              {
                ignoreDuplicates: true,
                transaction: t,
              },
            );
          });
        }),
      );
    });

    exit(0);
  } catch (e) {
    if (e.message === "end of central directory record signature not found")
      e.status = 3;
    console.log("Couldn't handle lcb upload 2", e);
    logError(e);

    exit(e?.status || 1);
  }
}

main();
