const partidoServicio = require("../services/partidoServicio");

const obtenerPartidoActual = async (req, res) => {
    try {
        const config = await partidoServicio.obtenerConfiguracionPartidoActual();
        res.send({ status: "OK", data: config });
    } catch (error) {
        res.status(error?.status || 500).send({ status: "FALLO", data: { error: error?.message || error } });
    }
};

const guardarPartido = async (req, res) => {
    const { body } = req;
    try {
        const resultado = await partidoServicio.guardarResultadoFinal(body);
        res.status(201).send({ status: "OK", data: resultado });
    } catch (error) {
        res.status(error?.status || 500).send({ status: "FALLO", data: { error: error?.message || error } });
    }
};

const obtenerPartidosFuturos = async (req, res) => {
    try {
        const partidos = await partidoServicio.obtenerPartidosFuturos(); 
        res.status(200).send({ status: "OK", data: partidos });
    } catch (error) {
        res.status(error?.status || 500).send({ status: "FALLO", data: { error: error?.message || error } });
    }
};

const actualizarConfiguracion = async (req, res) => {
    const { body } = req;
    try {
        const configActualizada = await partidoServicio.actualizarConfiguracionPartido(body);
        res.send({ status: "OK", data: configActualizada });
    } catch (error) {
        res.status(error?.status || 500).send({ status: "FALLO", data: { error: error?.message || error } });
    }
};

const obtenerJugadores = async (req, res) => {
    try {
        const jugadores = await partidoServicio.obtenerTodosLosJugadores();
        res.send({ status: "OK", data: jugadores });
    } catch (error) {
        res.status(error?.status || 500).send({ status: "FALLO", data: { error: error?.message || error } });
    }
}

const actualizarDatosJugador = async (req, res) => {
    const { id } = req.params;
    const { body } = req;
    try {
        const jugadorActualizado = await partidoServicio.actualizarJugador(id, body);
        res.send({ status: "OK", data: jugadorActualizado });
    } catch (error) {
        res.status(error?.status || 500).send({ status: "FALLO", data: { error: error?.message || error } });
    }
}

const obtenerEstadoGlobal = async (req, res) => {
    try {
        const estado = await partidoServicio.obtenerEstadoGlobal();
        res.send({ status: "OK", data: estado });
    } catch (error) {
        res.status(error?.status || 500).send({ status: "FALLO", data: { error: error?.message || error } });
    }
};

module.exports = {
    obtenerPartidoActual,
    guardarPartido,
    obtenerPartidosFuturos,
    actualizarConfiguracion,
    obtenerJugadores,
    actualizarDatosJugador,
    obtenerEstadoGlobal
};