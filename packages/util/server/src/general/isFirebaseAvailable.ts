import { existsSync } from "node:fs";
import { join } from "path";

const credentialsPath =
  process.env.FIREBASE_CREDENTIALS_PATH ||
  join(process.cwd(), ".credentials/firebase.json");
export const IS_FIREBASE_AVAILABLE = existsSync(credentialsPath);

if (!IS_FIREBASE_AVAILABLE && process.env.NODE_ENV === "production") {
  throw new Error("Firebase credentials not found");
}
