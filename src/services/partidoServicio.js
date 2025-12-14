const db = require("../firebase"); // Importamos la conexión
const { v4: uuid } = require("uuid");

// Referencia al documento único en Firebase
const docRef = db.collection("datos").doc("tenis");

// --- HELPER: LEER LA BASE DE DATOS ---
const leerBD = async () => {
    try {
        const doc = await docRef.get();
        if (!doc.exists) {
            // Si por alguna razón se borra la BD, devolvemos estructura vacía para evitar crashes
            return { jugadores: [], partidoActual: {}, partidosFuturos: [] };
        }
        return doc.data();
    } catch (error) {
        console.error("Error leyendo Firebase:", error);
        throw { status: 500, message: "Error de conexión con la base de datos" };
    }
};

// --- HELPER: GUARDAR EN LA BASE DE DATOS ---
const guardarEnPersistencia = async (data) => {
    try {
        await docRef.set(data); // Sobrescribe el documento con los datos actualizados
    } catch (error) {
        console.error("Error guardando en Firebase:", error);
        throw { status: 500, message: "Error al guardar en Firebase" };
    }
};

// --- SERVICIOS ---

const obtenerConfiguracionPartidoActual = async () => {
    const DB = await leerBD();
    const config = DB.partidoActual;
    
    if (!config || Object.keys(config).length === 0) {
         return { message: "No hay partido configurado actualmente." };
    }
    
    const jugador1Data = DB.jugadores.find(j => j.id === config.jugador1);
    const jugador2Data = DB.jugadores.find(j => j.id === config.jugador2);

    if (!jugador1Data || !jugador2Data) {
        throw { status: 404, message: "Los jugadores configurados no se encuentran en la lista." };
    }

    return {
        ...config,
        jugador1: jugador1Data,
        jugador2: jugador2Data,
    };
};

const obtenerPartidosFuturos = async () => {
    const DB = await leerBD();
    return DB.partidosFuturos || [];
};

const guardarResultadoFinal = async (nuevoPartido) => {
    // 1. Leemos los datos actuales de la nube
    const DB = await leerBD();

    // 2. Lógica de validación (igual que antes)
    if (!nuevoPartido.jugador1 || !nuevoPartido.jugador2 || !nuevoPartido.ganador) {
        throw { 
            status: 400, 
            message: "Faltan datos obligatorios (jugador1, jugador2, ganador)." 
        };
    }

    const partidoGuardado = {
        id: uuid(),
        ...nuevoPartido,
        fecha: new Date().toISOString()
    };

    // 3. Actualizar historial de jugadores
    const j1Index = DB.jugadores.findIndex(j => j.id === nuevoPartido.jugador1.id);
    const j2Index = DB.jugadores.findIndex(j => j.id === nuevoPartido.jugador2.id);

    if (j1Index !== -1) {
        // Lógica simplificada: aquí podrías añadir lógica para actualizar stats si quisieras
        // Por ahora mantenemos los datos que llegan
    }
    
    // 4. Resetear partido actual
    DB.partidoActual = {};

    // 5. Guardamos todo en Firebase
    await guardarEnPersistencia(DB);

    return { 
        message: "Partido guardado y configuración reseteada.", 
        idPartidoGuardado: partidoGuardado.id 
    };
};

const actualizarConfiguracionPartido = async (cambios) => {
    const DB = await leerBD();
    const partidoActual = DB.partidoActual || {};
    
    const configuracionActualizada = {
        ...partidoActual,
        torneo: cambios.torneo || partidoActual.torneo,
        ronda: cambios.ronda || partidoActual.ronda,
        jugador1: cambios.jugador1 || partidoActual.jugador1,
        jugador2: cambios.jugador2 || partidoActual.jugador2,
    };
    
    DB.partidoActual = configuracionActualizada;
    
    await guardarEnPersistencia(DB);
    
    // Devolvemos la config ya procesada con los nombres de jugadores
    return await obtenerConfiguracionPartidoActual();
};

const obtenerTodosLosJugadores = async () => {
    const DB = await leerBD();
    return DB.jugadores;
};

const actualizarJugador = async (idJugador, cambios) => {
    const DB = await leerBD();
    const index = DB.jugadores.findIndex(j => j.id === idJugador);
    
    if (index === -1) {
        throw { status: 404, message: `Jugador con ID '${idJugador}' no encontrado.` };
    }
    
    DB.jugadores[index] = { 
        ...DB.jugadores[index], 
        nombre: cambios.nombre || DB.jugadores[index].nombre,
        urlImagen: cambios.urlImagen || DB.jugadores[index].urlImagen
    };
    
    await guardarEnPersistencia(DB);
    return DB.jugadores[index];
};

const obtenerEstadoGlobal = async () => {
    const DB = await leerBD();
    return DB;
};

module.exports = {
    obtenerConfiguracionPartidoActual,
    guardarResultadoFinal,
    actualizarConfiguracionPartido,
    obtenerTodosLosJugadores,
    actualizarJugador,
    obtenerPartidosFuturos,
    obtenerEstadoGlobal,
};