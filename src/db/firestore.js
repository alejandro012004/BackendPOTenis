const admin = require('firebase-admin');

const FIREBASE_CREDENTIALS_VAR = process.env.FIREBASE_CREDENTIALS;

if (!FIREBASE_CREDENTIALS_VAR) {
  console.error("FATAL ERROR: La variable de entorno 'FIREBASE_CREDENTIALS' no está definida. Necesaria para la conexión a Firestore.");

}

let serviceAccount;
try {
  serviceAccount = JSON.parse(FIREBASE_CREDENTIALS_VAR);
} catch (error) {
  console.error("FATAL ERROR: El contenido de FIREBASE_CREDENTIALS no es un JSON válido.", error);

}

if (serviceAccount && !admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin SDK inicializado correctamente.");
    } catch (error) {
        console.error("ERROR: No se pudo inicializar Firebase Admin SDK:", error);
    }
}

const db = admin.firestore();


module.exports = { db };