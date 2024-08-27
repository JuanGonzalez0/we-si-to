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
const { v4: uuidv4 } = require('uuid');

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.use(express.static('public'));

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


const salas = {};

io.on('connection', (socket) => {
  console.log('usuario conectado', socket.id);

  socket.on('createRoom', (roomName, callback) => {
      const roomId = uuidv4();
      salas[roomId] = { name: roomName, users: [] };
      callback(roomId);
      io.emit('updateRoomList', Object.entries(salas).map(([id, { name }]) => ({ id, name })));
  });

  socket.on('joinRoom', (roomId) => {
      if (salas[roomId]) {
          // Salir de cualquier sala anterior para evitar estar en múltiples salas
          const previousRooms = Array.from(socket.rooms).filter(room => room !== socket.id);
          previousRooms.forEach(previousRoom => {
              socket.leave(previousRoom);
              console.log(`Usuario salió de la sala: ${previousRoom}`);
          });

          // Unirse a la nueva sala
          socket.join(roomId);
          salas[roomId].users.push(socket.id);
          socket.emit('roomName', salas[roomId].name);
          socket.to(roomId).emit('chat message', `Un nuevo usuario se ha unido a la sala ${salas[roomId].name}`);
      }
  });

  socket.on('chat message', (data) => {
      const { roomId, msg, nombre } = data;
      console.log('Recibido en el servidor:', { roomId, msg });
      if (salas[roomId]) {
          io.to(roomId).emit('chat message', nombre+": " + msg); // emite el nombre junto al mensaje
      }
  });
  socket.on('disconnect', () => {
      console.log('usuario desconectado', socket.id);
      Object.keys(salas).forEach(roomId => {
          salas[roomId].users = salas[roomId].users.filter(userId => userId !== socket.id);
          if (salas[roomId].users.length === 0) {
              delete salas[roomId];
          }
      });
      io.emit('updateRoomList', Object.entries(salas).map(([id, { name }]) => ({ id, name })));
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