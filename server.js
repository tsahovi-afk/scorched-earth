const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

let players = {};
let turn = null;

io.on('connection', (socket) => {
    console.log('שחקן התחבר:', socket.id);

    // הגדרת שחקן (מקסימום 2 שחקנים בחדר)
    if (Object.keys(players).length === 0) {
        players[socket.id] = { id: socket.id, x: 150, color: '#ffcc00', name: 'צהובי' }; // שחקן 1 צהוב
        socket.emit('init', { id: socket.id, side: 'left', players });
    } else if (Object.keys(players).length === 1) {
        players[socket.id] = { id: socket.id, x: 650, color: '#ff3333', name: 'עופרי' }; // שחקן 2 אדום
        socket.emit('init', { id: socket.id, side: 'right', players });
        // יש שני שחקנים - אפשר להתחיל!
        turn = Object.keys(players)[0]; 
        io.emit('startGame', { players, turn });
    } else {
        socket.emit('full'); // החדר מלא
        return;
    }

    // כששחקן מזיז את הקנה או משנה עוצמה
    socket.on('updateAim', (data) => {
        if (players[socket.id]) {
            io.emit('playerAimed', { id: socket.id, angle: data.angle, power: data.power });
        }
    });

    // כששחקן יורה
    socket.on('fire', (data) => {
        if (socket.id === turn) {
            io.emit('playerFired', { id: socket.id, vx: data.vx, vy: data.vy });
            // העברת התור לשחקן השני אחרי הירי
            const playerIds = Object.keys(players);
            turn = playerIds.find(id => id !== socket.id);
            io.emit('nextTurn', { turn });
        }
    });

    socket.on('disconnect', () => {
        console.log('שחקן התנתק:', socket.id);
        delete players[socket.id];
        turn = null;
        io.emit('playerLeft');
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`השרת רץ על פורט ${PORT}`);
});
