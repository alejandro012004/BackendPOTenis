const admin = require("firebase-admin");

// CRÍTICO: Añadimos el project_id explícitamente
admin.initializeApp({
  projectId: "proyectoprueba-f9549" 
});

const db = admin.firestore();

module.exports = db;