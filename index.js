// index.js

const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");
const v1PartidoRouter = require("./src/v1/rutas/partidoRutas");
// IMPORTANTE: Inicializar Firebase al inicio
require("./src/db/firestore"); 

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

app.use("/api/v1/tenis", v1PartidoRouter);


app.listen(PORT, () => {
    console.log(`API de Tenis escuchando en el puerto ${PORT}`);
});