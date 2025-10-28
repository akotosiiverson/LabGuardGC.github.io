const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// List all UIDs you want to make admins
const adminUIDs = [
 "gBvz8921CxdqeBVX8MF53ycwoe82",
 "MMKVVTxi22hIn8uKiSnGkHhOr7h1"
];

async function setAdmins() {
  try {
    for (const uid of adminUIDs) {
      await admin.auth().setCustomUserClaims(uid, { admin: true });
      console.log(`Admin claim set for user ${uid}`);
    }
    process.exit(0);
  } catch (error) {
    console.error("Error setting custom claim:", error);
    process.exit(1);
  }
}

setAdmins();
