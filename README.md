# TIC TAC TOE
A small personal to test my skills. End goal is for users to easily share a link to a friend to play a quick tic tac toe games, all while keeping the score

## Initial Roadmap
I'm going to build it quick and dirty and then refine until I'm happy with the result.
- Share links to a friend to start a session
- Play a game of tic tac toe and keep 
    
## Technology
We will be using the simplest possible implementation.

#### 1) A SOCKET SERVER
Using socket.io, will allow to realtime messaging between users and keep keeping records of current game sessions and scores 
- Initially, all information will be lost when the server is restarted
#### 2) A CLIENT APP
Will use VUE.JS and interacts between SOCKET SERVER and MYSQL SERVER
