// src/services/partidoServicio.js

// Importar la instancia de Firestore y referencias a las colecciones
const { db } = require("../db/firestore"); 

// Mantenemos uuid si se usa para generar IDs en el body/request
const { v4: uuid } = require("uuid"); 

// Referencias a las colecciones/documentos en Firestore
const jugadoresCollection = db.collection('jugadores');
const partidosFuturosCollection = db.collection('partidosFuturos');
const estadoGlobalDoc = db.collection('estado_global').doc('config'); // Usaremos un solo documento 'config' para el partido actual

// Eliminamos la lógica de persistencia local (DB, fs, guardarEnPersistencia)

// --- Funciones de Lectura (GET) ---

const obtenerConfiguracionPartidoActual = async () => {
    // 1. Obtener la configuración actual del documento 'config'
    const configSnapshot = await estadoGlobalDoc.get();
    const config = configSnapshot.data();

    if (!config || Object.keys(config).length === 0) {
         return { message: "No hay partido configurado actualmente." };
    }
    
    // 2. Obtener datos detallados de los jugadores a partir de sus IDs
    const [jugador1Ref, jugador2Ref] = await Promise.all([
        jugadoresCollection.doc(config.jugador1).get(),
        jugadoresCollection.doc(config.jugador2).get()
    ]);
    
    const jugador1Data = jugador1Ref.exists ? { id: jugador1Ref.id, ...jugador1Ref.data() } : null;
    const jugador2Data = jugador2Ref.exists ? { id: jugador2Ref.id, ...jugador2Ref.data() } : null;
    
    if (!jugador1Data || !jugador2Data) {
        throw { status: 404, message: "Los jugadores configurados no se encuentran en la lista de jugadores." };
    }

    return {
        ...config,
        jugador1: jugador1Data,
        jugador2: jugador2Data,
    };
};

const obtenerPartidosFuturos = async () => {
    const snapshot = await partidosFuturosCollection.get();
    
    if (snapshot.empty) {
        return [];
    }
    
    // Mapear los documentos para incluir el ID de Firestore
    const partidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return partidos;
};

const obtenerTodosLosJugadores = async () => {
    const snapshot = await jugadoresCollection.get();
    
    if (snapshot.empty) {
        return [];
    }
    
    const jugadores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return jugadores;
};

const obtenerEstadoGlobal = async () => {
    // Usar Promise.all para cargar todo a la vez
    const [jugadores, partidoActualResponse, partidosFuturos] = await Promise.all([
        obtenerTodosLosJugadores(),
        obtenerConfiguracionPartidoActual(),
        obtenerPartidosFuturos()
    ]);

    // Verificar si partidoActualResponse tiene el mensaje de no configuración
    const partidoActual = partidoActualResponse.message ? null : partidoActualResponse;

    return {
        jugadores,
        partidoActual, 
        partidosFuturos,
    };
};

// --- Funciones de Escritura/Actualización (POST/PATCH) ---

const guardarResultadoFinal = async (partidoGuardado) => {
    // 1. Crear el objeto para guardar. Si el cliente no envió un ID, usamos uno nuevo.
    const nuevoPartidoFuturo = {
        ...partidoGuardado,
        id: partidoGuardado.id || uuid(), 
    };

    // 2. Guardar en Firestore (Firestore le asignará un ID automáticamente, pero mantenemos el 'id' dentro del documento)
    await partidosFuturosCollection.add(nuevoPartidoFuturo);

    // 3. Limpiar/Restablecer partidoActual (se puede setear a un objeto vacío o null)
    await estadoGlobalDoc.set({}); 

    return { 
        message: "Partido finalizado y guardado en el historial.", 
        idPartidoGuardado: nuevoPartidoFuturo.id 
    };
};

const actualizarConfiguracionPartido = async (cambios) => {
    // 1. Guardar los cambios en el documento 'config'
    // { merge: true } es crucial para actualizar campos sin borrar el resto
    await estadoGlobalDoc.set(cambios, { merge: true });

    // 2. Retornar la configuración recién actualizada
    return obtenerConfiguracionPartidoActual();
};

const actualizarJugador = async (idJugador, cambios) => {
    // 1. Crear una referencia al documento y obtenerlo
    const jugadorRef = jugadoresCollection.doc(idJugador);
    const jugadorSnapshot = await jugadorRef.get();
    
    if (!jugadorSnapshot.exists) {
        throw { status: 404, message: `Jugador con ID '${idJugador}' no encontrado.` };
    }

    // 2. Actualizar solo los campos proporcionados en 'cambios'
    await jugadorRef.update(cambios);
    
    // 3. Retornar el jugador actualizado
    const jugadorActualizadoSnapshot = await jugadorRef.get();
    return { id: jugadorActualizadoSnapshot.id, ...jugadorActualizadoSnapshot.data() };
};


module.exports = {
    obtenerConfiguracionPartidoActual,
    guardarResultadoFinal,
    obtenerPartidosFuturos,
    actualizarConfiguracionPartido,
    obtenerTodosLosJugadores,
    actualizarJugador,
    obtenerEstadoGlobal,
};