const http = require('http');
const socketio = require('socket.io');
const CryptoJS = require('crypto-js');

let ioInstance;

function setupSocket(server) {
  const io = socketio(server, {
    cors: { origin: '*' }
  });
  ioInstance = io;

  io.on('connection', (socket) => {
    // Join private group/room
    socket.on('join', ({ groupId }) => {
      socket.join(groupId);
    });

    // Handle encrypted chat message
    socket.on('chat', ({ groupId, message, sender, aesKey }) => {
      // Encrypt message with AES
      const encrypted = CryptoJS.AES.encrypt(message, aesKey).toString();
      // Broadcast to group
      io.to(groupId).emit('chat', { groupId, message: encrypted, sender });
      // Optionally: Save encrypted message to DB here
    });
  });
}

module.exports = { setupSocket, ioInstance }; 