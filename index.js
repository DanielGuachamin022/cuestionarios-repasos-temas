const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");

const app = express();
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// Función para mezclar preguntas
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Temáticas disponibles
const TEMAS = {};
const basePath = path.join(__dirname, "preguntas_tematica/PreguntasCuartoSemestre");

// Leer todas las carpetas dentro de preguntas_tematica
fs.readdirSync(basePath).forEach(nombreCarpeta => {
  const carpetaPath = path.join(basePath, nombreCarpeta);

  if (fs.statSync(carpetaPath).isDirectory()) {
    
    const archivoPreguntas = path.join(carpetaPath, "preguntas.json");

    if (fs.existsSync(archivoPreguntas)) {

      // Convertir nombre de carpeta en clave segura (sin espacios)
      const clave = nombreCarpeta
                      .toLowerCase()
                      .replace(/\s+/g, "_")
                      .replace(/[^a-z0-9_]/g, "");

      TEMAS[clave] = `${nombreCarpeta}/preguntas.json`;
    }
  }
});

console.log("TEMAS generados:", TEMAS);


// Página principal con el menú de temas
app.get("/", (req, res) => {
  res.render("index", { temas: TEMAS });
});

// Página del quiz según el tema seleccionado
app.get("/quiz/:tema", (req, res) => {
  const tema = req.params.tema;
  const archivo = TEMAS[tema];

  if (!archivo) {
    return res.status(404).send("Tema no encontrado");
  }

  const ruta = path.join(__dirname, "preguntas_tematica/PreguntasCuartoSemestre", archivo);
  let preguntas = JSON.parse(fs.readFileSync(ruta, "utf8"));
  preguntas = shuffle(preguntas);

  res.render("quiz", { preguntas, tema });
});

// Procesar resultados
app.post("/resultado/:tema", (req, res) => {
  const tema = req.params.tema;
  const archivo = TEMAS[tema];

  if (!archivo) {
    return res.status(404).send("Tema no encontrado");
  }

  const ruta = path.join(__dirname, "preguntas_tematica/PreguntasCuartoSemestre", archivo);
  let preguntas = JSON.parse(fs.readFileSync(ruta, "utf8"));

  const respuestasUsuario = req.body;
  let puntaje = 0;
  let errores = [];

  preguntas.forEach((pregunta, index) => {
    const respuestaCorrecta = pregunta.respuesta;
    const respuestaUsuario = respuestasUsuario[`pregunta_${index}`];

    if (respuestaUsuario === respuestaCorrecta) {
      puntaje++;
    } else {
      errores.push({
        pregunta: pregunta.pregunta,
        respuestaCorrecta,
        respuestaUsuario
      });
    }
  });

  res.render("quiz", {
    preguntas,
    tema,
    resultado: {
      puntaje,
      total: preguntas.length,
      errores
    }
  });
});

app.listen(3000, () => {
  console.log("Servidor en http://localhost:3000");
});
