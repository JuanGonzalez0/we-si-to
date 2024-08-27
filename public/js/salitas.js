document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // Manejo de eventos
    document.getElementById('createRoom').addEventListener('click', () => {
        const roomName = document.getElementById('roomName').value;
        socket.emit('createRoom', roomName, (roomId) => {
            alert(`Sala creada con ID: ${roomId}`);
        });
    });

    document.getElementById('joinRoom').addEventListener('click', () => {
        const roomId = document.getElementById('roomId').value;
        socket.emit('joinRoom', roomId);
    });

    document.getElementById('sendMessage').addEventListener('click', () => {
        const roomId = document.getElementById('roomId').value;
        const message = document.getElementById('message').value;
        let nombre = document.getElementById('nombre').value;
        console.log('Enviando mensaje:', { roomId, msg: message });
        socket.emit('chat message', { roomId, msg: message, nombre });
    });

    // Recepción de mensajes
    socket.on('chat message', (msg) => {
        console.log('Mensaje recibido en el cliente:', msg);
        const messages = document.getElementById('messages');
        // Asegúrate de que no se añadan mensajes repetidos
        if (typeof msg === 'string') {
            messages.innerHTML += `<p>${msg}</p>`;
        }
    });

    // Actualización de la lista de salas
    socket.on('updateRoomList', (rooms) => {
        const roomList = document.getElementById('roomList');
        roomList.innerHTML = rooms.map(room => `<li>${room.name} (${room.id})</li>`).join('');
    });

    // Mostrar el nombre de la sala actual
    socket.on('roomName', (roomName) => {
        document.getElementById('currentRoom').innerText = `Nombre de la sala: ${roomName}`;
    });
});
