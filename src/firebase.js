const admin = require("firebase-admin");

// IMPORTANTE: Asegúrate de que este archivo existe en la raíz de tu proyecto
// Descárgalo desde: Configuración del proyecto -> Cuentas de servicio -> Generar nueva clave privada
const serviceAccount = require("../firebase-key.json"); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

module.exports = db;