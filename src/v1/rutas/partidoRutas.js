const express = require("express");
const router = express.Router();
const partidoControlador = require("../../controlador/partidoControlador");

router.get("/actual", partidoControlador.obtenerPartidoActual);
router.post("/guardar", partidoControlador.guardarPartido);

router.get("/admin/jugadores", partidoControlador.obtenerJugadores);
router.patch("/admin/jugadores/:id", partidoControlador.actualizarDatosJugador);
router.patch("/admin/configuracion", partidoControlador.actualizarConfiguracion);

module.exports = router;