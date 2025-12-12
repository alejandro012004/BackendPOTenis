const DB = require("../bd.json");
const fs = require("fs");
const { v4: uuid } = require("uuid"); 

const DB_FILE_PATH = "./src/bd.json";

const guardarEnPersistencia = (data) => {
    try {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), {
            encoding: "utf8"
        });
    } catch (error) {
        throw { status: 500, message: "Error interno al guardar los datos del partido." };
    }
};

const obtenerConfiguracionPartidoActual = () => {
    const config = DB.partidoActual;
    
    if (!config || Object.keys(config).length === 0) {
         return { message: "No hay partido configurado actualmente." };
    }
    
    const jugador1Data = DB.jugadores.find(j => j.id === config.jugador1);
    const jugador2Data = DB.jugadores.find(j => j.id === config.jugador2);

    if (!jugador1Data || !jugador2Data) {
        throw { status: 404, message: "Los jugadores configurados no se encuentran en la lista de jugadores." };
    }

    return {
        ...config,
        jugador1: jugador1Data,
        jugador2: jugador2Data,
    };
};

const obtenerPartidosFuturos = () => {
    try {
        const partidosFuturos = DB.partidosFuturos || [];
        return partidosFuturos;
    } catch (error) {
        throw { 
            status: 500, 
            message: "Error al leer los partidos futuros de la base de datos."
        };
    }
};

const guardarResultadoFinal = (datosPartidoFinal) => {
    if (!datosPartidoFinal || !datosPartidoFinal.torneo || !datosPartidoFinal.jugador1 || !datosPartidoFinal.jugador2) {
        throw { status: 400, message: "Datos de partido incompletos. Se requiere el objeto Partido completo." };
    }
    
    const partidoGuardado = { 
        ...datosPartidoFinal, 
        fechaGuardado: new Date().toISOString(),
        id: uuid(),
    };
    DB.partidosJugados.push(partidoGuardado);

    DB.partidoActual = {
        id: uuid(),
        saque: true,
        torneo: "Torneo Por Asignar",
        ronda: "Ronda Por Asignar",
        jugador1: DB.partidoActual.jugador1 || "j1",
        jugador2: DB.partidoActual.jugador2 || "j2",
        tieBreak: false,
    }; 
    
    guardarEnPersistencia(DB);
    
    return { 
        message: "Partido guardado exitosamente en el historial.", 
        idPartidoGuardado: partidoGuardado.id
    };
};

const actualizarConfiguracionPartido = (cambios) => {
    const partidoActual = DB.partidoActual;
    
    const configuracionActualizada = {
        ...partidoActual,
        torneo: cambios.torneo || partidoActual.torneo,
        ronda: cambios.ronda || partidoActual.ronda,
        jugador1: cambios.jugador1 || partidoActual.jugador1,
        jugador2: cambios.jugador2 || partidoActual.jugador2,
    };
    
    DB.partidoActual = configuracionActualizada;
    guardarEnPersistencia(DB);
    
    return obtenerConfiguracionPartidoActual();
};

const obtenerTodosLosJugadores = () => DB.jugadores;

const actualizarJugador = (idJugador, cambios) => {
    const index = DB.jugadores.findIndex(j => j.id === idJugador);
    if (index === -1) {
        throw { status: 404, message: `Jugador con ID '${idJugador}' no encontrado.` };
    }
    
    DB.jugadores[index] = { 
        ...DB.jugadores[index], 
        nombre: cambios.nombre || DB.jugadores[index].nombre,
        urlImagen: cambios.urlImagen || DB.jugadores[index].urlImagen
    };
    guardarEnPersistencia(DB);
    return DB.jugadores[index];
}


module.exports = {
    obtenerConfiguracionPartidoActual,
    guardarResultadoFinal,
    actualizarConfiguracionPartido,
    obtenerTodosLosJugadores,
    actualizarJugador,
    obtenerPartidosFuturos,
};