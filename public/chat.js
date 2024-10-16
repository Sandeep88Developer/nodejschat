const socket = io();

document.getElementById('send').addEventListener('click', () => {
    const message = document.getElementById('message').value;
    socket.emit('chatMessage', message);
});

socket.on('message', message => {
    const messages = document.getElementById('messages');
    const msg = document.createElement('p');
    msg.textContent = message;
    messages.appendChild(msg);
});
