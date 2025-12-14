// src/db/firestore.js

const admin = require('firebase-admin');

// Nombre de la variable de entorno que contendrá tu JSON de credenciales
const FIREBASE_CREDENTIALS_VAR = process.env.FIREBASE_CREDENTIALS;

// 1. Validar y parsear las credenciales
if (!FIREBASE_CREDENTIALS_VAR) {
  console.error("FATAL ERROR: La variable de entorno 'FIREBASE_CREDENTIALS' no está definida. Necesaria para la conexión a Firestore.");
  // En producción, es buena práctica forzar la salida si no hay credenciales críticas.
  // En desarrollo local, puedes considerar un fallback o manejar el error.
  // process.exit(1); 
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(FIREBASE_CREDENTIALS_VAR);
} catch (error) {
  console.error("FATAL ERROR: El contenido de FIREBASE_CREDENTIALS no es un JSON válido.", error);
  // process.exit(1);
}

// 2. Inicializar Firebase Admin SDK
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

// 3. Exportar la instancia de Firestore
module.exports = { db };