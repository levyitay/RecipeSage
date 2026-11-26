import { readFile, writeFile } from "fs/promises";

import { decryptWithRSAKey } from "@recipesage/util/server/general";

export const decryptDebugStore = async (args: {
  input: string;
  output: string;
}) => {
  if (!process.env.DEBUG_DUMP_PRIVATE_KEY) {
    throw new Error(
      "It looks like env.DEBUG_DUMP_PRIVATE_KEY isn't present. You'll need that to decrypt the dump",
    );
  }

  const encryptedJsonString = await readFile(args.input, "utf8");
  if (!encryptedJsonString) {
    throw new Error("It looks like the input json file does not exist");
  }

  const decryptedBlob = decryptWithRSAKey(
    encryptedJsonString,
    process.env.DEBUG_DUMP_PRIVATE_KEY,
  );

  const text = decryptedBlob.toString();

  const prettyJson = JSON.stringify(JSON.parse(text), undefined, 2);

  await writeFile(args.output, prettyJson);

  console.log("Done!");
};
