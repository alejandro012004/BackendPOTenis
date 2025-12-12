const partidoServicio = require("../services/partidoServicio");

const obtenerPartidoActual = (req, res) => {
    try {
        const config = partidoServicio.obtenerConfiguracionPartidoActual();
        res.send({ status: "OK", data: config });
    } catch (error) {
        res.status(error?.status || 500).send({ status: "FALLO", data: { error: error?.message || error } });
    }
};

const guardarPartido = (req, res) => {
    const { body } = req;
    try {
        const resultado = partidoServicio.guardarResultadoFinal(body);
        res.status(201).send({ status: "OK", data: resultado });
    } catch (error) {
        res.status(error?.status || 500).send({ status: "FALLO", data: { error: error?.message || error } });
    }
};

const actualizarConfiguracion = (req, res) => {
    const { body } = req;
    try {
        const configActualizada = partidoServicio.actualizarConfiguracionPartido(body);
        res.send({ status: "OK", data: configActualizada });
    } catch (error) {
        res.status(error?.status || 500).send({ status: "FALLO", data: { error: error?.message || error } });
    }
};

const obtenerJugadores = (req, res) => {
    try {
        const jugadores = partidoServicio.obtenerTodosLosJugadores();
        res.send({ status: "OK", data: jugadores });
    } catch (error) {
        res.status(error?.status || 500).send({ status: "FALLO", data: { error: error?.message || error } });
    }
}

const actualizarDatosJugador = (req, res) => {
    const { id } = req.params;
    const { body } = req;
    try {
        const jugadorActualizado = partidoServicio.actualizarJugador(id, body);
        res.send({ status: "OK", data: jugadorActualizado });
    } catch (error) {
        res.status(error?.status || 500).send({ status: "FALLO", data: { error: error?.message || error } });
    }
}

module.exports = {
    obtenerPartidoActual,
    guardarPartido,
    actualizarConfiguracion,
    obtenerJugadores,
    actualizarDatosJugador,
};