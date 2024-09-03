
        document.addEventListener('DOMContentLoaded', () => {
          const socket = io();
          const messages = document.getElementById('messages');
          const form = document.getElementById('form');
          const input = document.getElementById('input');
          const nombre = document.getElementById('nombre');
          
          form.addEventListener('submit', function(e) {
              e.preventDefault();
              if (input.value) {
                  socket.emit('name', nombre.value + " dice:");
                  socket.emit('chat message general', input.value);
                  input.value = '';
              }
          });
          
          socket.on('name', function(nombre) {
              const caja = document.createElement('li');
              caja.textContent = nombre;
              messages.appendChild(caja);
              window.scrollTo(0, document.body.scrollHeight);
          });
          
          socket.on('chat message general', function(msg) {
              const item = document.createElement('li');
              item.textContent = msg;
              messages.appendChild(item);
              window.scrollTo(0, document.body.scrollHeight);
          });
          
          socket.on('updateUserCount', (count) => {
              if (typeof count === 'number') {
                  const userCountElement = document.getElementById('userCount');
                  userCountElement.textContent = `■${count}`;
              } else {
                  console.error('El valor recibido no es un número:', count);
              }
          });
      });