require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

connectDB();

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

app.set('io', io);

io.on('connection', (socket) => {
    // Tham gia phòng dự án chung
    socket.on('join-project', (projectId) => {
        if (projectId) socket.join(String(projectId).trim());
    });

    // Tham gia phòng cá nhân để nhận thông báo
    socket.on('join-personal-room', (userId) => {
        if (userId) socket.join(String(userId).trim());
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});