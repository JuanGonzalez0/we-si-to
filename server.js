const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const path = require('path');
const ejs = require('ejs');
const multer = require('multer');
const fs = require('fs');

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");



//GENERAL

app.get("/", (req, res) => {
    res.render("index");
});

let usuariosConectados = {};

io.on('connection', (socket) => {
  
  console.log('usuario conectado', socket.id);
  usuariosConectados[socket.id] = {id: socket.id, username: `User${socket.id.slice(0, 4)}`};
  io.emit('updateUserCount', Object.keys(usuariosConectados).length);
    socket.on('disconnect', () =>{
        console.log('usuario deconectado', socket.id);
        delete usuariosConectados[socket.id];

        // Enviar la lista actualizada de usuarios conectados a todos los clientes
        io.emit('updateUserCount', Object.keys(usuariosConectados).length);
    });
    socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
    });
    socket.on('name', (nombre) =>{
        io.emit('name', nombre);
    })
});

//SALAS
app.get("/salas", (req, res) => {
    res.render("salas");
});
const salasIo = io.of('/salas'); // Espacio de nombres para las salas

salasIo.on('connection', (socket) => {
    console.log('usuario conectado a una sala');

    // Unirse a una sala específica
    socket.on('joinRoom', (room) => {
        // Abandonar cualquier sala anterior
        const previousRooms = Array.from(socket.rooms);
        previousRooms.forEach(previousRoom => {
            if (previousRoom !== socket.id) {
                socket.leave(previousRoom);
                console.log(`Usuario salió de la sala: ${previousRoom}`);
            }
        });

        // Unirse a la nueva sala
        socket.join(room);
        console.log(`Usuario unido a la sala: ${room}`);
    });

    // Enviar mensaje a una sala específica
    socket.on('chat message', (data) => {
        const { room, msg } = data;
        salasIo.to(room).emit('chat message', msg); // Envía el mensaje solo a la sala específica
    });

    socket.on('disconnect', () => {
        console.log('usuario desconectado de una sala');
    });
});


// SUBIR Y DESCARGAR ARCHIVOS

app.get("/subirArchivos", (req, res) => {
    res.render("subirArchivos");
});
  
  const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, 'uploads/');
      },
      filename: (req, file, cb) => {
        cb(null, file.originalname);
      }
    });
  
  const upload = multer({ storage: storage });
  
  
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  
  // Ruta para subir archivos
  app.post('/upload', upload.single('file'), (req, res) => {
    let volver = '<h2><a href="/">volver a la pagina principal</a></>';
    res.send('Archivo subido exitosamente' + volver);
  });
  
  // Ruta para listar y descargar archivos
  app.get('/files', (req, res) => {
    fs.readdir(path.join(__dirname, 'uploads'), (err, files) => {
      if (err) {
        return res.status(500).send('Error al leer la carpeta de archivos');
      }
  
      let fileListHtml = '<h1>Archivos disponibles para descargar</h1><ul>';
      files.forEach(file => {
        fileListHtml += `<li><a href="/uploads/${file}" download>${file}</a></li>`;
      });
      fileListHtml += '</ul>';
      let volver = '<h2><a href="/">volver a la pagina principal</a></>';
      res.send(fileListHtml + volver);
    });
});

//JUEGOS

app.get("/juegos", (req, res) => {
  res.render("juegos");
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});