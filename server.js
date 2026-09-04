const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

const clients = {};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (role) => {
    console.log(`${role} joined: ${socket.id}`);
    socket.join(role);
    clients[role] = socket.id;

    if (role === 'viewer' && clients.capture) {
      io.to(clients.capture).emit('viewer-ready');
    }
    if (role === 'capture' && clients.viewer) {
      io.to(clients.viewer).emit('capture-ready');
    }
  });

  socket.on('offer', (data) => {
    if (clients.viewer) {
      io.to(clients.viewer).emit('offer', data);
    }
  });

  socket.on('answer', (data) => {
    if (clients.capture) {
      io.to(clients.capture).emit('answer', data);
    }
  });

  socket.on('candidate', (data) => {
    socket.broadcast.emit('candidate', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    for (const [role, id] of Object.entries(clients)) {
      if (id === socket.id) delete clients[role];
    }
  });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  const interfaces = os.networkInterfaces();
  let localIP = 'localhost';
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        localIP = iface.address;
        break;
      }
    }
  }

  console.log('='.repeat(60));
  console.log('WEBCAM STREAMING SERVER');
  console.log('='.repeat(60));
  console.log('');
  console.log('For SAME machine (both tabs on this laptop):');
  console.log(`  Capture: http://localhost:${PORT}/capture.html`);
  console.log(`  Viewer:  http://localhost:${PORT}/viewer.html`);
  console.log('');
  console.log('For TWO DIFFERENT devices (phone/laptop + this laptop):');
  console.log(`  Capture: http://${localIP}:${PORT}/capture.html`);
  console.log(`  Viewer:  http://${localIP}:${PORT}/viewer.html`);
  console.log('');
  console.log('Both devices must be on the same WiFi network.');
  console.log('='.repeat(60));
});