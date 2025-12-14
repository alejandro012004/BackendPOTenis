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

const obtenerPartidosFuturos = async () => {
    const snapshot = await partidosFuturosCollection.get();
    
    if (snapshot.empty) {
        return [];
    }
    
    const partidos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return partidos;
};

const guardarResultadoFinal = async (datosPartidoFinal) => {
    if (!datosPartidoFinal || !datosPartidoFinal.torneo || !datosPartidoFinal.jugador1 || !datosPartidoFinal.jugador2) {
        throw { status: 400, message: "Datos de partido incompletos. Se requiere el objeto Partido completo." };
    }
    
    const resultado = await guardarYLimpiar(datosPartidoFinal, true);
    
    return { 
        message: "Partido guardado exitosamente en el historial y eliminado de partidos futuros.", 
        idPartidoGuardado: resultado.idPartidoGuardado
    };
};

const actualizarConfiguracionPartido = async (cambios) => {
    await estadoGlobalDoc.set(cambios, { merge: true });
    return obtenerConfiguracionPartidoActual();
};

const obtenerTodosLosJugadores = async () => {
    const snapshot = await jugadoresCollection.get();
    if (snapshot.empty) {
        return [];
    }
    const jugadores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return jugadores;
};

const actualizarJugador = async (idJugador, cambios) => {
    const jugadorRef = jugadoresCollection.doc(idJugador);
    const jugadorSnapshot = await jugadorRef.get();
    
    if (!jugadorSnapshot.exists) {
        throw { status: 404, message: `Jugador con ID '${idJugador}' no encontrado.` };
    }

    await jugadorRef.update(cambios);
    const jugadorActualizadoSnapshot = await jugadorRef.get();
    return { id: jugadorActualizadoSnapshot.id, ...jugadorActualizadoSnapshot.data() };
};

// REVERTIDO A LA ESTRUCTURA QUE NO CAUSA ERROR EN FLUTTER
const obtenerEstadoGlobal = async () => {
    const [jugadores, partidoActualResponse, partidosFuturos] = await Promise.all([
        obtenerTodosLosJugadores(),
        obtenerConfiguracionPartidoActual(),
        obtenerPartidosFuturos()
    ]);

    const partidoActual = partidoActualResponse.message ? null : partidoActualResponse;

    // ELIMINAMOS EL WRAPPER 'status: "OK", data: {...}'
    return {
        jugadores,
        partidoActual, 
        partidosFuturos,
    };
};

const eliminarPartidoFuturo = async (idPartidoFuturo) => {
    const snapshot = await partidosFuturosCollection.where('id', '==', idPartidoFuturo).limit(1).get();

    if (snapshot.empty) {
        return { message: `Partido con ID '${idPartidoFuturo}' no encontrado en partidos futuros para eliminar.` };
    }

    const docId = snapshot.docs[0].id; 
    await partidosFuturosCollection.doc(docId).delete();
    
    return { message: `Partido futuro con ID '${idPartidoFuturo}' eliminado correctamente.` };
};


const guardarYLimpiar = async (partidoFinalizado, guardar) => {
    const { id: idPartidoFuturo } = partidoFinalizado;
    
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
        await eliminarPartidoFuturo(idPartidoFuturo);
        mensajeGuardar += " Partido futuro eliminado.";
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
    actualizarConfiguracionPartido,
    obtenerTodosLosJugadores,
    actualizarJugador,
    obtenerPartidosFuturos,
    obtenerEstadoGlobal,
    eliminarPartidoFuturo,
    guardarYLimpiar, 
};