const express = require('express');
const socketIO = require('socket.io');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const DEBUG = true;
const SESSIONS = [];
const PORT = process.env.PORT || 8080;

////////////////////////////////////////////////////////////////////
////////////////    START APP CLIENT      //////////////////////////

// ONLY USE THIS WHEN IN PRODUCTION (locally we will use yarn serve directly in the client folder)


    let indexPath = "client/dist/";
    let clientFile = "/index.html";

    const app = express();
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(indexPath));
    app.get('/', function (req, res) {
        res.sendFile(indexPath + clientFile, {root: __dirname});
    });
    app.get('/play', function (req, res) {
        res.sendFile(indexPath + clientFile, {root: __dirname});
    });

}

const server = require('http').createServer(app);
server.listen(PORT, function () {
    console.log('Socket Server started on port '+PORT);
});

////////////////////////////////////////////////////////////////////
////////////////  START SOCKET IO SERVER  //////////////////////////

const io = socketIO(server, {
    path: '/socket.io',
    serveClient: false,
});

// SOCKET EVENTS
io.on('connection', (socket) => {

    debugLog('[IO] Connected: ', socket.id);

    socket.on('create_game', (data) => {
        debugLog('[create_game] Create Game Received', data.hash);
        let game_session = {
            'id': data.hash,
            'players': [],
            'player_turn': [],
            'current_symbol': "O",
            'play_board': ["", "", "", "", "", "", "", "", ""],
            'started': 0
        }
        SESSIONS.push(game_session);
    });

    socket.on('start_game', (data) => {

        var foundIndex = findSession(""+data.hash);
        if (foundIndex) {
            SESSIONS[foundIndex].started = 1;
            SESSIONS[foundIndex].player_turn = SESSIONS[foundIndex].players[0].name;

            // give update to room
            io.to(data.hash).emit('session_update', SESSIONS[foundIndex]);
        }
    });

    socket.on('join_game', (data) => {

        debugLog('[join_game] Join Game Received', data.hash);

        var foundIndex = findSession(""+data.hash);
        if (foundIndex) {

            var foundUserIndex = findUserInSession(data.name, data.hash);

            // check if room is full
            if(SESSIONS[foundIndex].players.length < 2 || foundUserIndex){

                // add player
                if(!foundUserIndex){
                    SESSIONS[foundIndex].players.push({
                        'socket_id': socket.id,
                        'name': data.name,
                    });
                }

                // join the new room
                socket.join(data.hash);
                debugLog('[join_game] Socket Room Joined', data.hash);

                // give update to room
                io.to(data.hash).emit('session_update', SESSIONS[foundIndex]);
                debugLog('[session_update] Session updated', data.hash);

            }else{

                // warn client room is full
                socket.emit('session_cancel');
            }
        }else{

            io.to(data.hash).emit('session_cancel');

        }

    });

    socket.on('click_square', (data) => {
        debugLog('[click_square] Click Square Received', data.hash);
        var foundIndex = findSession(""+data.hash);
        if (foundIndex) {

            SESSIONS[foundIndex].current_symbol = SESSIONS[foundIndex].current_symbol === 'O' ? 'X':'O';

            //
            SESSIONS[foundIndex].play_board[data.index] = SESSIONS[foundIndex].current_symbol;

            // CHECK FOR WIN
            if(checkForWinners(SESSIONS[foundIndex].play_board)){
                console.log(data, "HAS WON");
                io.to(data.hash).emit('player_won', data);

            // ELSE CONTINUE
            }else{

                // switch turn
                for (let s in SESSIONS[foundIndex].players) {
                    if (data.name !== SESSIONS[foundIndex].players[s].name) {
                        SESSIONS[foundIndex].player_turn = SESSIONS[foundIndex].players[s].name;
                    }
                }

            }

            // give update to room
            io.to(data.hash).emit('session_update', SESSIONS[foundIndex]);
        }
    });

    socket.on('restart_game', (data) => {
        var foundIndex = findSession(""+data.hash);
        if (foundIndex) {
            SESSIONS[foundIndex].play_board = ["", "", "", "", "", "", "", "", ""],
            SESSIONS[foundIndex].current_symbol = "",
            SESSIONS[foundIndex].player_turn = "";
            SESSIONS[foundIndex].started = 0

            io.to(data.hash).emit('session_update', SESSIONS[foundIndex]);
        }
    })

    socket.on('leave_game', (data) => {

        debugLog('[leave_game] Leave Game Received', data.hash);

        var foundIndex = findSession(""+data.hash);
        if (foundIndex) {

            removeSocketFromSession(data.name, data.hash)

            io.to(data.hash).emit('session_update', SESSIONS[foundIndex]);

            // check if room is full
            if(SESSIONS[foundIndex].players.length < 2){
                io.to(data.hash).emit('session_cancel');
            }
        }
    });

    socket.on('disconnect', function (reason) {
        debugLog('[disconnect] Socket '+socket.id+' disconnected', reason);

        // remove player from all or any SESSIONS
        for (let i in SESSIONS) {

            // remove player first
            for (let s in SESSIONS[i].players) {
                if (socket.id == SESSIONS[i].players[s]) {
                    SESSIONS[i].players.splice(s, 1);
                    io.to(SESSIONS[i].id).emit('session_update', SESSIONS[i]);
                }
            }

            // IF GAME STARTED AND LESS THAN 2 PLAYERS, SESSION IS REMOVED
            if(SESSIONS[i].started === 1 && SESSIONS[i].players.length < 2) {
                io.to(SESSIONS[i].id).emit('session_cancel');
                SESSIONS.splice(i, 1);
            }
        }
    });

});

//////////////////////////////////////////////////////////
///////////////////// UTILS

function debugLog(msg, data) {
    if(DEBUG){
        console.log(msg, (data ? data : false));
    }
}

const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

function checkForWinners(gameState) {
    let roundWon = false;
    for (let i = 0; i <= 7; i++) {
        const winCondition = winningConditions[i];
        let a = gameState[winCondition[0]];
        let b = gameState[winCondition[1]];
        let c = gameState[winCondition[2]];
        if (a === '' || b === '' || c === '') {
            continue;
        }
        if (a === b && b === c) {
            roundWon = true;
            break
        }
    }
    return roundWon;
}

function removeSocketFromSession(name, hash) {
    for (let i in SESSIONS) {
        console.log();
        if(SESSIONS[i].id === hash) {
            for (let s in SESSIONS[i].players) {
                if (name == SESSIONS[i].players[s].name) {
                    SESSIONS[i].players.splice(s, 1);
                }
            }
        }
    }
}

findSession = (hash) => {
    for (let i in SESSIONS) {
        if (hash == SESSIONS[i].id) {
            return i;
        }
    }
    return false;
}

findUserInSession = (name, hash) => {
    for (let i in SESSIONS) {
        if(SESSIONS[i].id !== hash) continue;
        for (let s in SESSIONS[i].players) {
            if (name == SESSIONS[i].players[s].name) {
                return s;
            }
        }
    }
    return false;
}

findSocket = (user_index, socket_id) => {
    if(!online_users[user_index]) return false;
    for (let s in online_users[user_index].sockets) {
        if (socket_id == online_users[user_index].sockets[s]) {
            return online_users[user_index].sockets[s]
        }
    }
    return false;
}

function debugLog(msg, data) {
    if(DEBUG){
        console.log(msg, (data ? data : false));
    }
}