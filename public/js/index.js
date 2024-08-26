var socket = io();
  
var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');
let nombre = document.getElementById('nombre');


form.addEventListener('submit', function(e) {
  e.preventDefault();
  if (input.value) {
    socket.emit('name', nombre.value + " dice:");
    socket.emit('chat message', input.value);
    input.value = '';
  }
});

socket.on('name', function(nombre) {
  var caja = document.createElement('li');
  caja.textContent = nombre;
  messages.appendChild(caja);
  window.scrollTo(0, document.body.scrollHeight);
});

socket.on('chat message', function(msg) {
  var item = document.createElement('li');
  item.textContent = msg;
  messages.appendChild(item);
  window.scrollTo(0, document.body.scrollHeight);
});

document.addEventListener('DOMContentLoaded', () => {
  socket.on('updateUserCount', (count) => {
  if (typeof count === 'number') {
    const userCountElement = document.getElementById('userCount');
    userCountElement.textContent = `■${count}`;
    } else {
      console.error('El valor recibido no es un número:', count);
    }
});
});