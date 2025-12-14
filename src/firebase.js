const admin = require("firebase-admin");

// 1. Intentar leer el JSON completo, que es el método preferido
const FIREBASE_CONFIG_JSON = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

// 2. Intentar leer la Clave Privada (Private Key) separadamente, por si el JSON falla
const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY; 

if (FIREBASE_CONFIG_JSON) {
  try {
    const serviceAccount = JSON.parse(FIREBASE_CONFIG_JSON);

    // Si la clave privada se definió por separado, la usamos para sobrescribir el valor
    // Esto resuelve el problema de los saltos de línea de PEM
    if (FIREBASE_PRIVATE_KEY) {
        serviceAccount.private_key = FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    }
    
    // Inicializar Firebase con el objeto serviceAccount
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase inicializado correctamente con credenciales de variable de entorno.");

  } catch (error) {
    console.error("ERROR: Fallo al intentar inicializar Firebase:", error);
    // Cambiamos el mensaje para incluir la nueva variable
    throw new Error("No se pudo inicializar Firebase. Verifique FIREBASE_SERVICE_ACCOUNT_JSON y/o FIREBASE_PRIVATE_KEY.");
  }
} else {
  throw new Error("La variable de entorno FIREBASE_SERVICE_ACCOUNT_JSON no está definida.");
}

const db = admin.firestore();

module.exports = db;