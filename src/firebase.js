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
    // Si falla el parseo, el JSON estaba mal pegado.
    console.error("ERROR: No se pudo parsear el JSON de la clave de Firebase:", error);
    
    // Si no se puede inicializar, el error UNAUTHENTICATED aparecerá igual,
    // pero al menos tienes el mensaje de error de parseo.
    // Mantenemos el código limpio, solo con la inicialización por credenciales.
    throw new Error("No se pudo inicializar Firebase. Verifique el formato de la variable FIREBASE_SERVICE_ACCOUNT_JSON.");
  }
} else {
  // En producción, si esta variable no existe, algo está mal.
  throw new Error("La variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON no está definida.");
}

const db = admin.firestore();

module.exports = db;