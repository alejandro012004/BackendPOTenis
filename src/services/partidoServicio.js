const { db, partidosJugadosCollection } = require("../db/firestore"); 
const { v4: uuid } = require("uuid"); 

const jugadoresCollection = db.collection('jugadores');
const partidosFuturosCollection = db.collection('partidosFuturos'); 
const estadoGlobalDoc = db.collection('estado_global').doc('config'); 

const obtenerConfiguracionPartidoActual = async () => {
    const configSnapshot = await estadoGlobalDoc.get();
    const config = configSnapshot.data();

    if (!config || Object.keys(config).length === 0) {
        return { message: "No hay partido configurado actualmente." };
    }
    
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

const guardarResultadoFinal = async (partido) => {
    const partidoConFecha = {
        ...partido,
        fechaFin: new Date().toISOString(),
        id: uuid(), 
    };
    const docRef = await partidosJugadosCollection.add(partidoConFecha);
    return { message: `Partido guardado con ID: ${docRef.id}.` };
};

const obtenerPartidosFuturos = async () => {
    const partidosFuturosSnapshot = await partidosFuturosCollection.orderBy("fecha").get();
    const partidos = [];

    partidosFuturosSnapshot.forEach((doc) => {
        partidos.push({ id: doc.id, ...doc.data() });
    });

    return partidos;
};

const obtenerJugadores = async () => {
    const jugadoresSnapshot = await jugadoresCollection.orderBy("ranking").get();
    const jugadores = [];

    jugadoresSnapshot.forEach((doc) => {
        jugadores.push({ id: doc.id, ...doc.data() });
    });

    return jugadores;
};

const obtenerEstadoGlobal = async () => {
    const [jugadores, partidosFuturos] = await Promise.all([
        obtenerJugadores(),
        obtenerPartidosFuturos()
    ]);
    
    return {
        jugadores: jugadores,
        partidosFuturos: partidosFuturos,
    };
};

const actualizarDatosJugador = async (id, datos) => {
    const jugadorRef = jugadoresCollection.doc(id);
    await jugadorRef.update(datos);
    return { message: `Datos del jugador con ID '${id}' actualizados correctamente.` };
};

const actualizarConfiguracion = async (config) => {
    await estadoGlobalDoc.set(config);
    return { message: "Configuración del partido actual actualizada correctamente." };
};

const eliminarPartidoFuturo = async (idPartidoFuturo) => {
    const partidosFuturosCollection = db.collection('partidosFuturos');
    
    const snapshot = await partidosFuturosCollection
        .where('id', '==', idPartidoFuturo)
        .limit(1)
        .get();

    if (snapshot.empty) {
        throw { 
            status: 404, 
            message: `No se encontró ningún partido futuro con el ID de modelo '${idPartidoFuturo}' para eliminar.`
        };
    }
    
    const docAEliminar = snapshot.docs[0];
    const docId = docAEliminar.id;
    
    await partidosFuturosCollection.doc(docId).delete();
    
    return { message: `Partido futuro con ID de modelo '${idPartidoFuturo}' eliminado (Doc ID: ${docId}).` };
};


const guardarYLimpiar = async (partidoFinalizado, guardar) => {
    const idPartidoFuturo = partidoFinalizado?.id;

    let mensajeGuardar = "";
    let idPartidoGuardado = null;

    if (guardar) {
        const partidoConFecha = {
            ...partidoFinalizado,
            fechaFin: new Date().toISOString(),
            id: uuid(), 
        };
        const docRef = await partidosJugadosCollection.add(partidoConFecha);
        idPartidoGuardado = docRef.id;

        mensajeGuardar = `Partido guardado en el historial con ID: ${idPartidoGuardado}.`;
    } else {
        mensajeGuardar = "Partido descartado. No se guardó en el historial.";
    }

    if (idPartidoFuturo) {
        try {
             await eliminarPartidoFuturo(idPartidoFuturo);
             mensajeGuardar += " Partido futuro eliminado.";
        } catch (error) {
             throw { status: error.status || 500, message: error.message };
        }
    }

    await estadoGlobalDoc.set({}); 

    return { 
        message: "Proceso de finalización completado. " + mensajeGuardar, 
        guardado: guardar,
        idPartidoGuardado: idPartidoGuardado
    };
};

module.exports = {
    obtenerConfiguracionPartidoActual,
    guardarResultadoFinal,
    obtenerPartidosFuturos,
    obtenerJugadores,
    obtenerEstadoGlobal,
    actualizarDatosJugador,
    actualizarConfiguracion,
    guardarYLimpiar,
};