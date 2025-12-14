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

const obtenerTodosLosJugadores = async () => {
    const jugadoresSnapshot = await jugadoresCollection.orderBy("ranking").get();
    const jugadores = [];

    jugadoresSnapshot.forEach((doc) => {
        jugadores.push({ id: doc.id, ...doc.data() });
    });

    return jugadores;
};

const obtenerEstadoGlobal = async () => {
    const [jugadores, partidoActualResponse, partidosFuturos] = await Promise.all([
        obtenerTodosLosJugadores(),
        obtenerConfiguracionPartidoActual(),
        obtenerPartidosFuturos()
    ]);

    const partidoActual = partidoActualResponse.message ? null : partidoActualResponse;

    return {
        jugadores,
        partidoActual, 
        partidosFuturos,
    };
};

const eliminarPartidoFuturo = async (idPartidoFuturo) => {
    const partidosFuturosCollection = db.collection('partidosFuturos');
    
    // CORRECCIÓN CRÍTICA: Buscar el documento por el campo 'id' interno (el ID del modelo)
    const snapshot = await partidosFuturosCollection
        .where('id', '==', idPartidoFuturo)
        .limit(1)
        .get();

    if (snapshot.empty) {
        // Esto no es un error fatal si se quiere asegurar la limpieza, pero lo reportamos
        throw { 
            status: 404, 
            message: `Advertencia: No se encontró el partido futuro con ID '${idPartidoFuturo}' para eliminar.` 
        };
    }
    
    // Obtener el ID del DOCUMENTO de Firestore y eliminar
    const docAEliminar = snapshot.docs[0];
    const docId = docAEliminar.id;
    
    await partidosFuturosCollection.doc(docId).delete();
    
    return { message: `Partido futuro con ID de modelo '${idPartidoFuturo}' eliminado.` };
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
             // Llama a la función corregida de eliminación
             await eliminarPartidoFuturo(idPartidoFuturo);
             mensajeGuardar += " Partido futuro eliminado.";
        } catch (error) {
             throw { status: error.status || 500, message: error.message };
        }
    }

    // Limpiamos la configuración del partido activo
    await estadoGlobalDoc.set({}); 

    return { 
        message: "Proceso de finalización completado. " + mensajeGuardar, 
        guardado: guardar,
        idPartidoGuardado: idPartidoGuardado
    };
};

const guardarResultadoFinal = async (datosPartidoFinal) => {
     // Esta función se utiliza en la ruta /guardar (que deberías evitar si usas /finalizar)
    if (!datosPartidoFinal || !datosPartidoFinal.torneo) {
        throw { status: 400, message: "Datos de partido incompletos. Se requiere el objeto Partido completo." };
    }
    
    // Lógica para guardar sin la limpieza si solo se usa /guardar.
    const partidoConFecha = {
        ...datosPartidoFinal,
        fechaFin: new Date().toISOString(),
        id: uuid(), 
    };
    const docRef = await partidosJugadosCollection.add(partidoConFecha);
    
    return { 
        message: "Partido guardado exitosamente en el historial.", 
        idPartidoGuardado: docRef.id
    };
};

const actualizarConfiguracionPartido = async (cambios) => {
    await estadoGlobalDoc.set(cambios, { merge: true });
    return obtenerConfiguracionPartidoActual();
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