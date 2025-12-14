const admin = require("firebase-admin");

// 1. Inicializar sin argumentos.
// Si la variable GOOGLE_APPLICATION_CREDENTIALS está definida,
// Firebase-admin la usará AUTOMÁTICAMENTE para encontrar y leer la clave.
admin.initializeApp();

const db = admin.firestore();

module.exports = db;