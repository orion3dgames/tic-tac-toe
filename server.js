const express = require('express');
const socketIO = require('socket.io');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

////////////////////////////////////////////////////////////////////
////////////////    START APP CLIENT      //////////////////////////

const PORT = process.env.PORT || 8080;
let indexPath = "client/dist/";
let clientFile = "/index.html";

const app = express();

// ONLY USE THIS WHEN IN PRODUCTION (locally we will use yarn serve directly in the client folder)
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
////////////////  START GAME SERVER (SOCKET IO) //////////////////////////

const DEBUG = true;
let SESSIONS = [];
let ONLINE_PLAYERS = [];
const MAX_PLAYERS = 2;
const DEFAULT_BOARD = ["", "", "", "", "", "", "", "", ""];
const WINNING_CONDITIONS = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];
const SYMBOL_X = "X";
const SYMBOL_O = "O";

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
            'id': ""+data.hash,
            'players': [],
            'player_turn': [],
            'current_symbol': SYMBOL_O,
            'play_board': [...DEFAULT_BOARD],
            'started': 0,
            'draw': 0,
        }
        SESSIONS.push(game_session);
    });

    socket.on('start_game', (data) => {

        let session = findSession(data.hash);

        if (!session) {
            io.to(data.hash).emit('session_cancel', {'message': 'Start game failed.'});
            return false;
        }

        // UPDATE GAME SESSION
        session.started = 1;
        session.player_turn = session.players[0].name; // FIRST PLAYER IN ARRAY STARTS

        //
        io.to(data.hash).emit('session_update', session);

    });

    socket.on('join_game', (data) => {

        debugLog('[join_game] Join Game Received', data.hash);

        let session = findSession(data.hash);

        // IF GAME SESSION NOT FOUND
        if (!session) {
            io.to(data.hash).emit('session_cancel', {'message': 'Game does not exists.'});
            return false;
        }

        // IF NOT ALREADY THERE, AND PLAYERS LENGTH < MAX_PLAYERS
        if(session.players.length < MAX_PLAYERS){

            // IS THIS USER ALREADY THERE
            let player = findSessionPlayer(data.hash, data.name);
            if(player){
                return false;
            }

            // ADD USER
            session.players.push({
                'socket_id': socket.id,
                'name': data.name,
                'win': 0,
            });

            // JOIN SOCKET ROOM
            socket.join(data.hash);

            // UPDATE GAME SESSION
            io.to(data.hash).emit('session_update', session);

            return false;
        }

        // warn client join has failed
        socket.emit('session_cancel', {'message': 'Failed to join game.'});

    });

    socket.on('click_square', (data) => {

        debugLog('[click_square] Click Square Received', data.hash);

        let session = findSession(data.hash);

        if (!session) {
            io.to(data.hash).emit('session_cancel', {'message': 'Start game failed.'});
            return false;
        }

        // UPDATE NEXT SYMBOL
        session.current_symbol = session.current_symbol === 'O' ? 'X':'O';
        session.play_board[data.index] = session.current_symbol;

        // CHECK FOR DRAW
        let roundDraw = !session.play_board.includes("");
        if (roundDraw) {
            console.log(data, "IS A DRAW");
            session.play_board = [...DEFAULT_BOARD],
            session.current_symbol = SYMBOL_O,
            session.player_turn = data.name;
            session.started = 1;
            session.draw += 1;

            io.to(data.hash).emit('session_update', session);

            return false;
        }

        // CHECK FOR WINNER
        if(checkForWinners(session.play_board)){

            console.log(data, "HAS WON");

            // INCREMENT SCORE
            let s = session.players.findIndex(player => player.name === data.name);
            session.players[s].win += 1;

            // RESTART GAME
            session.play_board = [...DEFAULT_BOARD],
            session.current_symbol = SYMBOL_O,
            session.player_turn = data.name;
            session.started = 1;

            io.to(data.hash).emit('session_update', session);

            return false;
        }

        // ELSE FIND NEXT PLAYER
        console.log("FIND NEXT PLAYER");
        for (let s in session.players) {
            if (data.name !== session.players[s].name) {
                session.player_turn = session.players[s].name;
            }
        }

        // give update to room
        io.to(data.hash).emit('session_update', session);

    });

    socket.on('leave_game', (data) => {

        debugLog('[leave_game] Leave Game Received', data.hash);

        let foundIndex = SESSIONS.findIndex(session => session.id === data.hash);
        if (foundIndex === undefined) return false;

        // REMOVE SOCKET
        removeSocketFromSession(data.name, data.hash)

        // SET UPDATED ROOM
        io.to(data.hash).emit('session_update', SESSIONS[foundIndex]);

        // IF SOMEONE LEAVES DURING THE GAME, CANCEL GAME
        if(SESSIONS[foundIndex] && SESSIONS[foundIndex].started === 1 && SESSIONS[foundIndex].players.length < MAX_PLAYERS){
            SESSIONS.splice(foundIndex, 1);
            io.to(data.hash).emit('session_cancel', {'message': 'Your opponent has left'});
        }

        // IF SESSION EXISTS AND NO PLAYERS LEFT, MIGHT AS WELL DELETE IT
        if(SESSIONS[foundIndex] && SESSIONS[foundIndex].players.length === 0){
            SESSIONS.splice(foundIndex, 1);
        }

    });

    socket.on('disconnect', function (reason) {

        debugLog('[disconnect] Socket '+socket.id+' disconnected', reason);

        // remove player from all or any SESSIONS
        for (let i in SESSIONS) {

            // remove player first
            for (let s in SESSIONS[i].players) {
                if (socket.id == SESSIONS[i].players[s].socket_id) {
                    SESSIONS[i].players.splice(s, 1);
                    io.to(SESSIONS[i].id).emit('session_update', SESSIONS[i]);
                }
            }

            // IF GAME STARTED AND LESS THAN 2 PLAYERS, GAME SESSION IS DELETED AND REMAINING PLAYER ARE KICK FROM THE ROOM
            if(SESSIONS[i].started === 1 && SESSIONS[i].players.length < 2) {
                io.to(SESSIONS[i].id).emit('session_cancel', {'message': 'Your opponent has been disconnected.'});
                SESSIONS.splice(i, 1);
            }
        }
    });

    socket.on('load_games', (data) => {

        var game_sessions = SESSIONS.map(session => {
            var newObj = {};
            newObj["id"] = session.id;
            newObj["players"] = session.players.length;
            if(session.started === 0) {
                return newObj;
            }
        });

        socket.emit('sessions', game_sessions);
    });

});

//////////////////////////////////////////////////////////
///////////////////// UTILS

function debugLog(msg, data) {
    if(DEBUG){
        console.log(msg, (data ? data : false));
    }
}

findSession = (hash) => {
    let foundIndex = SESSIONS.findIndex(session => session.id === hash);
    return SESSIONS[foundIndex];
}

findSessionPlayer = (hash, username) => {
    let session = findSession(hash);
    if(!session){
        return false;
    }
    let foundUserIndex = session.players.findIndex(player => player.name === username);
    if(!session.players[foundUserIndex]){
     return false;
    }
    return session.players[foundUserIndex]
}

findUser = (username, socket_id) => {
    for (let s in ONLINE_PLAYERS) {
        if (username == ONLINE_PLAYERS[s].username) {
            return s
        }
    }
    return false;
}


function checkForWinners(gameState) {
    let roundWon = false;
    for (let i = 0; i <= 7; i++) {
        const winCondition = WINNING_CONDITIONS[i];
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
        if(SESSIONS[i].id === hash) {
            for (let s in SESSIONS[i].players) {
                if (name == SESSIONS[i].players[s].name) {
                    SESSIONS[i].players.splice(s, 1);
                }
            }
        }
    }
}

function debugLog(msg, data) {
    if(DEBUG){
        console.log(msg, (data ? data : false));
    }
}