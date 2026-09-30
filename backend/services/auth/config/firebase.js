import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { cert, initializeApp } from "firebase-admin";

// serviceAccountKey.json is gitignored, so it cannot ship in the deploy.
// Production supplies the JSON via env var; local dev falls back to the file.
// (This also drops the `with { type: "json" }` import assertion, which broke
// on some Node versions.)
const loadServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    return JSON.parse(
      Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString("utf8")
    );
  }

  const localPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../serviceAccountKey.json"
  );

  if (!fs.existsSync(localPath)) {
    throw new Error(
      "Firebase credentials missing: set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_BASE64, or add services/auth/serviceAccountKey.json"
    );
  }

  return JSON.parse(fs.readFileSync(localPath, "utf8"));
};

export const app = initializeApp({
  credential: cert(loadServiceAccount())
});