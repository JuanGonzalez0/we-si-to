import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import ejs from 'ejs';
import multer from 'multer';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configuración del archivo y directorio
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Inicialización de Express y Socket.io
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Configuración de vistas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Servir archivos estáticos
app.use(express.static('public'));

// Rutas generales
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/salas", (req, res) => {
    res.render("salas");
});

// Manejo de usuarios conectados y salas
const usuariosConectados = {};
const salas = {};
const jugadores = {};


// Manejo de conexiones
io.on('connection', (socket) => {
    console.log('usuario conectado', socket.id);
    usuariosConectados[socket.id] = { id: socket.id, username: `User${socket.id.slice(0, 4)}` };
    io.emit('updateUserCount', Object.keys(usuariosConectados).length);

    //Juego

    // Añadir nuevo jugador a la lista
    jugadores[socket.id] = { id: socket.id, username: `User${socket.id.slice(0, 4)}`, x: 0, y: 5, z: 0 };

    // Enviar la lista completa de jugadores a todos los jugadores
    io.emit('updatePlayersList', jugadores);

    // Notificar a los demás jugadores sobre el nuevo jugador
    socket.broadcast.emit('playerConnected', jugadores[socket.id]);

    // Actualizar el nombre del jugador
    socket.on('playerName', (name) => {
        jugadores[socket.id].username = name;
        io.emit('updatePlayersList', jugadores); // Emitir lista actualizada a todos
    });

    // Actualizar la posición del jugador
    socket.on('playerMovement', (movementData) => {
        jugadores[socket.id].x = movementData.x;
        jugadores[socket.id].y = movementData.y;
        jugadores[socket.id].z = movementData.z;
        io.emit('updatePlayersList', jugadores); // Emitir lista actualizada a todos
    });

    // Chat general
    socket.on('chat message general', (msg) => {
        io.emit('chat message general', msg);
    });

    socket.on('name', (nombre) => {
        io.emit('name', nombre);
    });

    // Chat en salas
    socket.on('createRoom', (roomName, callback) => {
        const roomId = uuidv4();
        salas[roomId] = { name: roomName, users: [] };
        callback(roomId);
        io.emit('updateRoomList', Object.entries(salas).map(([id, { name }]) => ({ id, name })));
    });

    socket.on('joinRoom', (roomId) => {
        if (salas[roomId]) {
            const previousRooms = Array.from(socket.rooms).filter(room => room !== socket.id);
            previousRooms.forEach(previousRoom => {
                socket.leave(previousRoom);
                console.log(`Usuario salió de la sala: ${previousRoom}`);
            });

            socket.join(roomId);
            salas[roomId].users.push(socket.id);
            socket.emit('roomName', salas[roomId].name);
            socket.to(roomId).emit('chat message room', `Un nuevo usuario se ha unido a la sala ${salas[roomId].name}`);
        }
    });

    socket.on('chat message room', (data) => {
        const { roomId, msg, nombre } = data;
        if (salas[roomId]) {
            io.to(roomId).emit('chat message room', `${nombre}: ${msg}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('usuario desconectado', socket.id);
        delete usuariosConectados[socket.id];
        io.emit('updateUserCount', Object.keys(usuariosConectados).length);
        delete jugadores[socket.id];
        io.emit('updatePlayersList', jugadores);

        Object.keys(salas).forEach(roomId => {
            salas[roomId].users = salas[roomId].users.filter(userId => userId !== socket.id);
            if (salas[roomId].users.length === 0) {
                delete salas[roomId];
            }
        });
        io.emit('updateRoomList', Object.entries(salas).map(([id, { name }]) => ({ id, name })));
    });
});


app.get("/subirArchivos", (req, res) => {
  res.render("subirArchivos");
});
// Configuración de multer para subir archivos
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

app.post('/upload', upload.single('file'), (req, res) => {
    const volver = '<h2><a href="/">volver a la pagina principal</a></h2>';
    res.send('Archivo subido exitosamente' + volver);
});

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
        const volver = '<h2><a href="/">volver a la pagina principal</a></h2>';
        res.send(fileListHtml + volver);
    });
});

// Ruta para juegos
app.get("/juegos", (req, res) => {
    res.render("juegos");
});

// Iniciar servidor
server.listen(3000, () => {
    console.log('listening on *:3000');
});
