# TIC TAC TOE
A small personal to test my skills. End goal is for users to easily share a link to a friend to play a quick tic tac toe games, all while keeping the score

**ONLY RULE I SET FOR MYSELF, NO COPYING OR LOOKING AT SIMILAR TIC TAC TOE CODE FROM INTERNET**

CURRENT DEMO LINK: https://tictactoe-vuejs.herokuapp.com/

## Initial Goal
I'm going to build it quick and dirty and then refine until I'm happy with the result.
- Share links to a friend to start a session
- Play a game of tic-tac-toe and keep track of the scores
- Refactoring the code to make it as clean and simple as possible
   
## Features
- Create and share a link (DONE)
- Game waiting room until 2 players join with the same sharing link (DONE)
- Playing the tic-tac-toe game (DONE)
- Adding a mini chat (DONE)
- Implement a database system  (like Firebase)

## Installation Guide
- Clone the repository
- Open a terminal and launch these commands from the root folder
- ```npm install``` (install server dependencies)
- ```npm build``` (install client dependencies & build the client for production)
- ```npm start``` (launch the socket server and web server)
- go to "localhost:5000" to view the game.
   
## Technology

#### 1) A SOCKET SERVER
Using socket.io, will allow to realtime messaging between users and keeping records of current game sessions and scores 
- Initially, all information will be lost when the server is restarted as we have not implemented a database yet.
#### 2) A CLIENT APP
Will use VUE.JS 2 and interact with the SOCKET SERVER
