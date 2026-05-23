<!DOCTYPE html>
<html lang="he">
<head>
    <meta charset="UTF-8">
    <title>אדמה חרוכה - רשת ומחשב</title>
    <style>
        body { margin: 0; background-color: #111; color: #fff; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
        canvas { border: 2px solid #ffcc00; background-color: #050510; display: none; }
        #status { margin-top: 10px; font-size: 18px; font-weight: bold; color: #ffcc00; display: none; }
        #controls-info { margin-top: 5px; font-size: 14px; color:#aaa; display: none; }
        #menu { background-color: #222; padding: 30px; border: 2px solid #ffcc00; border-radius: 10px; text-align: center; }
        button { background-color: #ffcc00; color: #000; border: none; padding: 12px 25px; font-size: 16px; font-weight: bold; margin: 10px; cursor: pointer; border-radius: 5px; transition: 0.2s; }
        button:hover { background-color: #ffee55; transform: scale(1.05); }
    </style>
    <script src="/socket.io/socket.io.js"></script>
</head>
<body>

    <div id="menu">
        <h2>אדמה חרוכה - בחר מצב משחק</h2>
        <button onclick="startAiGame()">🤖 משחק נגד המחשב</button>
        <button onclick="startOnlineGame()">🌐 משחק אונליין נגד חבר</button>
    </div>

    <h2 id="gameTitle" style="display:none;">אדמה חרוכה</h2>
    <canvas id="gameCanvas" width="800" height="500"></canvas>
    <div id="status">טוען...</div>
    <div id="controls-info">חצים: כיוון ועוצמה | רווח: אש (רק בתור שלך!)</div>

<script>
let socket;
let isAiMode = false;

// פונקציה להפעלת שרת משולב ב-Render
if (typeof io === 'undefined') {
    const express = require('express');
    const app = express();
    const http = require('http').createServer(app);
    const serverIo = require('socket.io')(http);
    app.get('/', (req, res) => { res.sendFile(__filename); });
    let players = {};
    let turn = null;

    serverIo.on('connection', (socket) => {
        if (Object.keys(players).length === 0) {
            players[socket.id] = { id: socket.id, x: 150, color: '#ffcc00', name: 'צהובי' };
            socket.emit('init', { id: socket.id, side: 'left', players });
        } else if (Object.keys(players).length === 1) {
            players[socket.id] = { id: socket.id, x: 650, color: '#ff3333', name: 'שחקן 2' };
            socket.emit('init', { id: socket.id, side: 'right', players });
            turn = Object.keys(players)[0]; 
            serverIo.emit('startGame', { players, turn });
        } else {
            socket.emit('full');
            return;
        }
        socket.on('updateAim', (data) => { if (players[socket.id]) serverIo.emit('playerAimed', { id: socket.id, angle: data.angle, power: data.power }); });
        socket.on('fire', (data) => {
            if (socket.id === turn) {
                serverIo.emit('playerFired', { id: socket.id, vx: data.vx, vy: data.vy });
                const playerIds = Object.keys(players);
                turn = playerIds.find(id => id !== socket.id);
                serverIo.emit('nextTurn', { turn });
            }
        });
        socket.on('disconnect', () => { delete players[socket.id]; turn = null; serverIo.emit('playerLeft'); });
    });
    const PORT = process.env.PORT || 10000;
    http.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
} else {
    // קוד הדפדפן (קליינט)
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const statusDiv = document.getElementById('status');

    let myId = 'local_player';
    let gameActive = false;
    let currentTurnId = null;
    let gamePlayers = {};
    let projectile = null;
    const gravity = 0.15;
    let aiErrorRange = 30; // טווח הפספוס ההתחלתי של המחשב

    const terrain = [];
    for (let x = 0; x < canvas.width; x++) {
        terrain[x] = 400 + Math.sin(x * 0.01) * 60 + Math.cos(x * 0.03) * 20;
    }

    let myAngle = 45;
    let myPower = 50;

    function showGameLayout() {
        document.getElementById('menu').style.display = 'none';
        document.getElementById('gameTitle').style.display = 'block';
        canvas.style.display = 'block';
        statusDiv.style.display = 'block';
        document.getElementById('controls-info').style.display = 'block';
    }

    // מצב משחק 1: נגד המחשב
    window.startAiGame = function() {
        isAiMode = true;
        showGameLayout();
        
        gamePlayers = {
            'local_player': { id: 'local_player', x: 150, color: '#ffcc00', name: 'צהובי', angle: 45, power: 50 },
            'ai_player': { id: 'ai_player', x: 650, color: '#ff3333', name: 'המחשב', angle: 135, power: 50 }
        };
        
        currentTurnId = 'local_player';
        gameActive = true;
        updateStatusText();
        draw();
    }

    // מצב משחק 2: אונליין ברשת
    window.startOnlineGame = function() {
        isAiMode = false;
        showGameLayout();
        statusDiv.innerText = "מתחבר לשרת... שלח את הלינק לחבר!";
        
        socket = io();

        socket.on('init', (data) => {
            myId = data.id;
            if (data.side === 'right') myAngle = 135; 
        });

        socket.on('startGame', (data) => {
            gamePlayers = data.players;
            currentTurnId = data.turn;
            gameActive = true;
            updateStatusText();
        });

        socket.on('playerAimed', (data) => {
            if (gamePlayers[data.id]) {
                gamePlayers[data.id].angle = data.angle;
                gamePlayers[data.id].power = data.power;
            }
        });

        socket.on('playerFired', (data) => {
            const shootingTank = gamePlayers[data.id];
            projectile = {
                x: shootingTank.x,
                y: terrain[shootingTank.x] - 10,
                vx: data.vx,
                vy: data.vy
            };
        });

        socket.on('nextTurn', (data) => {
            currentTurnId = data.turn;
            setTimeout(() => { updateStatusText(); }, 1500);
        });

        socket.on('playerLeft', () => {
            gameActive = false;
            statusDiv.innerText = "השחקן השני התנתק. מחכה לשחקן חדש...";
        });

        draw();
    }

    function runAiTurn() {
        statusDiv.innerText = "המחשב מבוסס על נתונים... חושב...";
        statusDiv.style.color = "#ff3333";

        setTimeout(() => {
            const me = gamePlayers['local_player'];
            const ai = gamePlayers['ai_player'];
            
            // חישוב המרחק וההבדל בגובה
            const dx = me.x - ai.x; 
            const dy = (terrain[me.x] - 10) - (terrain[ai.x] - 10);
            
            // המחשב בוחר זווית הגיונית לירי שמאלה (בין 100 ל-170 מעלות)
            ai.angle = 120 + Math.random() * 25; 
            const rad = (ai.angle * Math.PI) / 180;
            
            // נוסחה בסיסית מבוססת מרחק + אלמנט פספוס אקראי שהולך וקטן
            const distance = Math.abs(dx);
            let idealPower = (distance * gravity) / Math.sin(2 * (rad - Math.PI));
            idealPower = Math.sqrt(Math.abs(idealPower)) * 3.5; 
            
            // הוספת טעות אקראית
            const error = (Math.random() - 0.5) * aiErrorRange;
            ai.power = Math.max(10, Math.min(100, idealPower + error));
            
            // ככל שהמחשב יורה יותר, הוא לומד ומצמצם את הטעות לסיבוב הבא
            if (aiErrorRange > 5) aiErrorRange -= 5;

            // ביצוע הירי של המחשב
            const fireRad = (ai.angle * Math.PI) / 180;
            const speed = ai.power * 0.12;
            
            projectile = {
                x: ai.x,
                y: terrain[ai.x] - 10,
                vx: Math.cos(fireRad) * speed,
                vy: -Math.sin(fireRad) * speed
            };

            // העברת התור חזרה אליך
            currentTurnId = 'local_player';
            setTimeout(() => { updateStatusText(); }, 1500);

        }, 1800); // השהייה של שנייה וחצי כדי לתת תחושה שהמחשב "חושב"
    }

    function updateStatusText() {
        if (currentTurnId === myId) {
            statusDiv.innerText = "התור שלך! (עוצמה: " + myPower + " | זווית: " + myAngle + "°)";
            statusDiv.style.color = "#ffcc00";
        } else {
            const opposingName = gamePlayers[currentTurnId] ? gamePlayers[currentTurnId].name : "היריב";
            statusDiv.innerText = "תור של " + opposingName + "...";
            statusDiv.style.color = "#ff3333";
            
            // אם זה מצב מחשב וזה התור שלו - נפעיל אותו
            if (isAiMode && currentTurnId === 'ai_player') {
                runAiTurn();
            }
        }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // ציור שטח
        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        for (let x = 0; x < canvas.width; x++) ctx.lineTo(x, terrain[x]);
        ctx.lineTo(canvas.width, canvas.height);
        ctx.fillStyle = '#3a2512';
        ctx.fill();

        // ציור טנקים
        for (let id in gamePlayers) {
            const p = gamePlayers[id];
            const tankY = terrain[p.x] - 10;
            
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - 10, tankY, 20, 10);

            const angleToUse = id === myId ? myAngle : (p.angle || (p.x > 400 ? 135 : 45));
            const rad = (angleToUse * Math.PI) / 180;
            ctx.beginPath();
            ctx.moveTo(p.x, tankY);
            ctx.lineTo(p.x + Math.cos(rad) * 15, tankY - Math.sin(rad) * 15);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();
        }

        // עדכון וציור פגז באוויר
        if (projectile) {
            projectile.vy += gravity;
            projectile.x += projectile.vx;
            projectile.y += projectile.vy;

            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ff3333';
            ctx.fill();

            if (projectile.x >= 0 && projectile.x < canvas.width) {
                if (projectile.y >= terrain[Math.floor(projectile.x)]) {
                    const craterX = Math.floor(projectile.x);
                    for (let x = craterX - 25; x <= craterX + 25; x++) {
                        if (x >= 0 && x < canvas.width) {
                            const dist = Math.abs(x - craterX);
                            const depth = Math.sqrt(Math.max(0, 25*25 - dist*dist));
                            terrain[x] += depth;
                        }
                    }
                    projectile = null;
                }
            } else {
                projectile = null;
            }
        }

        requestAnimationFrame(draw);
    }

    window.addEventListener('keydown', (e) => {
        if (!gameActive || currentTurnId !== myId || projectile) return;

        let changed = false;
        if (e.key === 'ArrowUp') { myAngle = Math.min(180, myAngle + 2); changed = true; }
        if (e.key === 'ArrowDown') { myAngle = Math.max(0, myAngle - 2); changed = true; }
        if (e.key === 'ArrowRight') { myPower = Math.min(100, myPower + 1); changed = true; }
        if (e.key === 'ArrowLeft') { myPower = Math.max(1, myPower - 1); changed = true; }

        if (changed) {
            updateStatusText();
            if (!isAiMode) socket.emit('updateAim', { angle: myAngle, power: myPower });
        }

        if (e.key === ' ') {
            const rad = (myAngle * Math.PI) / 180;
            const speed = myPower * 0.12;
            
            if (isAiMode) {
                projectile = {
                    x: gamePlayers['local_player'].x,
                    y: terrain[gamePlayers['local_player'].x] - 10,
                    vx: Math.cos(rad) * speed,
                    vy: -Math.sin(rad) * speed
                };
                currentTurnId = 'ai_player';
                setTimeout(() => { updateStatusText(); }, 1500);
            } else {
                socket.emit('fire', { vx: Math.cos(rad) * speed, vy: -Math.sin(rad) * speed });
            }
        }
    });
}
</script>
</body>
</html>
