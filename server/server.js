const Mysql = require('mysql');
const fs = require('fs');
const express = require('express');
const serveStatic = require("serve-static")
const path = require('path');

const DEBUG = true;
const sessions = [];


////////////////////////////////////////////////////////////////////
////////////////    START APP CLIENT      //////////////////////////

const app = express();

// Priority serve any static files.
app.use(serveStatic(path.resolve(__dirname, '../client/dist')));

app.listen(5000, function () {
    console.error(`Node server' : 'cluster worker '+process.pid}: listening on port 5000`);
});

////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////
////////////////    START SOCKET IO SERVER      //////////////////////////

// SETTINGS
const global_settings = {
    var: 1
};

var io_config = {
    port: 3009,
    pingInterval: 25000, // MS
    pingTimeout: 60000, // MS
}

var chat_server = require('http').createServer();

// START IO SERVER
var io = require('socket.io')({
    path: io_config.path,
    serveClient: false,
});

// ATTACH SERVER
io.attach(chat_server, {
    pingInterval: io_config.pingInterval,
    pingTimeout: io_config.pingTimeout,
    cookie: false
});

// CHAT INITIALIZATION
chat_server.listen(io_config.port, function () {
    console.log('Socket Server started on port '+io_config.port);
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
        sessions.push(game_session);
    });

    socket.on('start_game', (data) => {

        var foundIndex = findSession(""+data.hash);
        if (foundIndex) {
            sessions[foundIndex].started = 1;
            sessions[foundIndex].player_turn = sessions[foundIndex].players[0].name;

            // give update to room
            io.to(data.hash).emit('session_update', sessions[foundIndex]);
        }
    });

    socket.on('join_game', (data) => {

        debugLog('[join_game] Join Game Received', data.hash);

        var foundIndex = findSession(""+data.hash);
        if (foundIndex) {

            var foundUserIndex = findUserInSession(data.name, data.hash);

            // check if room is full
            if(sessions[foundIndex].players.length < 2 || foundUserIndex){

                // add player
                if(!foundUserIndex){
                    sessions[foundIndex].players.push({
                        'socket_id': socket.id,
                        'name': data.name,
                    });
                }

                // join the new room
                socket.join(data.hash);
                debugLog('[join_game] Socket Room Joined', data.hash);

                // give update to room
                io.to(data.hash).emit('session_update', sessions[foundIndex]);
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

            sessions[foundIndex].current_symbol = sessions[foundIndex].current_symbol === 'O' ? 'X':'O';

            //
            sessions[foundIndex].play_board[data.index] = sessions[foundIndex].current_symbol;

            // CHECK FOR WIN
            if(checkForWinners(sessions[foundIndex].play_board)){
                console.log(data, "HAS WON");
                io.to(data.hash).emit('player_won', data);

            // ELSE CONTINUE
            }else{

                // switch turn
                for (let s in sessions[foundIndex].players) {
                    if (data.name !== sessions[foundIndex].players[s].name) {
                        sessions[foundIndex].player_turn = sessions[foundIndex].players[s].name;
                    }
                }

            }

            // give update to room
            io.to(data.hash).emit('session_update', sessions[foundIndex]);
        }
    });

    socket.on('restart_game', (data) => {
        var foundIndex = findSession(""+data.hash);
        if (foundIndex) {
            sessions[foundIndex].play_board = ["", "", "", "", "", "", "", "", ""],
            sessions[foundIndex].current_symbol = "",
            sessions[foundIndex].player_turn = "";
            sessions[foundIndex].started = 0

            io.to(data.hash).emit('session_update', sessions[foundIndex]);
        }
    })

    socket.on('leave_game', (data) => {

        debugLog('[leave_game] Leave Game Received', data.hash);

        var foundIndex = findSession(""+data.hash);
        if (foundIndex) {

            removeSocketFromSession(data.name, data.hash)

            io.to(data.hash).emit('session_update', sessions[foundIndex]);

            // check if room is full
            if(sessions[foundIndex].players.length < 2){
                io.to(data.hash).emit('session_cancel');
            }
        }
    });

    socket.on('disconnect', function (reason) {
        debugLog('[disconnect] Socket '+socket.id+' disconnected', reason);

        // remove player from all or any sessions
        for (let i in sessions) {

            // remove player first
            for (let s in sessions[i].players) {
                if (socket.id == sessions[i].players[s]) {
                    sessions[i].players.splice(s, 1);
                    io.to(sessions[i].id).emit('session_update', sessions[i]);
                }
            }

            // IF GAME STARTED AND LESS THAN 2 PLAYERS, SESSION IS REMOVED
            if(sessions[i].started === 1 && sessions[i].players.length < 2) {
                io.to(sessions[i].id).emit('session_cancel');
                sessions.splice(i, 1);
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
    for (let i in sessions) {
        console.log();
        if(sessions[i].id === hash) {
            for (let s in sessions[i].players) {
                if (name == sessions[i].players[s].name) {
                    sessions[i].players.splice(s, 1);
                }
            }
        }
    }
}

findSession = (hash) => {
    for (let i in sessions) {
        if (hash == sessions[i].id) {
            return i;
        }
    }
    return false;
}

findUserInSession = (name, hash) => {
    for (let i in sessions) {
        if(sessions[i].id !== hash) continue;
        for (let s in sessions[i].players) {
            if (name == sessions[i].players[s].name) {
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