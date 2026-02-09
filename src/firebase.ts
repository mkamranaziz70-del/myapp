import admin from "firebase-admin";
import path from "path";
import fs from "fs";

const serviceAccountPath = path.resolve(
  process.cwd(),
  "boxxpilot-c7bac-firebase-adminsdk-fbsvc-f35268285c.json"
);

if (!fs.existsSync(serviceAccountPath)) {
  throw new Error("❌ Firebase service account file not found");
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"))
    ),
  });
}

export default admin;
