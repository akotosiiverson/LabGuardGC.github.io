const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// List all UIDs you want to make admins
const adminUIDs = [
  "jrnPPTpwfhYBGWiY4ajgkfXVzjC2",
  "gnbkWWkOiuSMs4Bi0wKBOdBjjCW2",
  "RwqBnjs6fsflxNaOyCUsgo7wMan2",
  "1VHZ1dZwGfhlg1cfcgt52Saw5e52"
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
