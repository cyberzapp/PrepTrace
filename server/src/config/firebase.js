const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

let db;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (e) {
      const path = require('path');
      const resolvedPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      serviceAccount = require(resolvedPath);
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin SDK initialized with Service Account Key');
  } else {
    admin.initializeApp();
    console.log('Firebase Admin SDK initialized with default Application Credentials');
  }

  db = admin.firestore();
  db.settings({ ignoreUndefinedProperties: true });
} catch (error) {
  console.warn('Firebase Admin SDK Initialization Warning:', error.message);
  console.warn('Backend will attempt to initialize default Firestore DB on request');
}

const getDb = () => {
  if (!db) {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    db = admin.firestore();
    db.settings({ ignoreUndefinedProperties: true });
  }
  return db;
};

module.exports = {
  admin,
  getDb
};
