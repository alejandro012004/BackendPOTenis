const admin = require("firebase-admin");

// 1. Intentar leer la variable de entorno que contiene el JSON completo
const FIREBASE_CONFIG_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (FIREBASE_CONFIG_JSON) {
  try {
    // 2. Parsear el JSON de la variable
    const serviceAccount = JSON.parse(FIREBASE_CONFIG_JSON);
    
    // 3. Inicializar Firebase con el objeto serviceAccount parseado
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase inicializado correctamente con credenciales de variable de entorno.");

  } catch (error) {
    // Es CRÍTICO que veamos este error en los logs si algo falla.
    console.error("ERROR: Fallo al intentar inicializar Firebase:", error);
    throw new Error("No se pudo inicializar Firebase. Verifique el formato de la variable FIREBASE_SERVICE_ACCOUNT_JSON.");
  }
} else {
  throw new Error("La variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON no está definida.");
}

const db = admin.firestore();

module.exports = db;