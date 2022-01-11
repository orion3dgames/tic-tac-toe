# TIC TAC TOE
A small personal to test my skills. End goal is for users to easily share a link to a friend to play a quick tic tac toe games, all while keeping the score

## Initial Roadmap
I'm going to build it quick and dirty and then refine until I'm happy with the result.
- Share links to a friend to start a session
- Play a game of tic tac toe and keep track of the scores
- Refactoring the code to make it as clean and simple as possible
   
## Currently Working
- Create and share a link
- Game waiting room until 2 players join with the same sharing link
- Playing the tic tac toe game until someone wins (draw is not implemented)
   
## Technology
We will be using the simplest possible implementation.

#### 1) A SOCKET SERVER
Using socket.io, will allow to realtime messaging between users and keep keeping records of current game sessions and scores 
- Initially, all information will be lost when the server is restarted as we have not implemented a database yet.
#### 2) A CLIENT APP
Will use VUE.JS and interact with the SOCKET SERVER
