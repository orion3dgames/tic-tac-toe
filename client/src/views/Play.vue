<template>
  <div v-if="session">

    <div class="bg-light p-3 mb-3">
      <div class="row align-items-center">
        <div class="col-auto">
          <div class="input-group">
            <span class="input-group-text">{{share_url}}</span>
            <button class="btn btn-outline-primary" type="button" id="button-addon2">Copy Share Link</button>
          </div>
        </div>
        <div class="col-auto">
          <button @click="leaveGame()" class="btn btn-secondary">Leave</button>
        </div>
        <div class="col-auto">
          <button @click="startGame()" class="btn btn-primary" v-if="session.players && session.players.length === 2 && session.started === 0">Start</button>
        </div>
      </div>
    </div>

    <div class="row">
      <div class="col-sm-8">

        <h5>Game</h5>
        <hr>

        <div v-if="session.started === 1">

          <div class="alert alert-success">It's {{session.player_turn}} turn.</div>

          <div class="play-area">
            <div v-for='index in 9' :key='index' @click="squareClick((index-1))" class="block">{{ session.play_board[(index-1)] }}</div>
          </div>

          <hr />
        </div>
        <div v-else>

          <div v-if="session.started === 0 && session.players.length === 2 ">
            <div class="alert alert-warning">Game is ready to start. Please press the start button to begin the game...</div>
          </div>

          <div v-if="session.started === 0 && session.players.length < 2 ">
            <div class="alert alert-warning">Waiting for another player to connect...</div>
          </div>

        </div>

        {{session}}
      </div>
      <div class="col-sm-4">
        <h5>Users</h5>
        <hr>
        <ul id="example-1">
          <li v-for="player in session.players" :key="player.socket_id">
            {{ player.name }}
          </li>
        </ul>
      </div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'Play',
  components: {

  },
  data() {
    return {
      session: {},
    }
  },
  computed: {
    hash() {
      return location.hash;
    },
    name(){
      return this.$cookie.get('name');
    },
    share_url(){
      return window.location;
    }
  },
  mounted: function () {
    this.$nextTick(function () {
      console.log('[Mounted] Play Page Mounted');
      this.$socket.emit('join_game', { 'hash': this.hash, name: this.name });
    })
  },
  methods: {

    leaveGame(){
      this.$socket.emit('leave_game', { 'hash': this.hash, name: this.name });
      this.$router.push({ path: '/' });
    },
    startGame(){
      this.$socket.emit('start_game', { 'hash': this.hash, name: this.name });
    },
    squareClick(index){
      if(this.session.player_turn === this.name && !this.session.play_board[index]) {
        this.$socket.emit('click_square', {
          'hash': this.hash,
          'name': this.name,
          'index': index
        });
      }
    },

  },
  sockets: {
    connect: function () {
      console.log('connected with socket', this.$socket);
    },
    session_cancel: function () {
      console.log('session_cancel');
      this.$router.push({ path: '/' });
    },
    session_update: function (data) {
      console.log('session_update', data);
      this.session = data;
    },

    disconnect: function(){             console.log('[SOCKET_CLIENT][disconnect]'); this.leaveGame(); },
    connect_error: function(){          console.log('[SOCKET_CLIENT][connect_error]'); this.leaveGame(); },
    reconnect: function(){              console.log('[SOCKET_CLIENT][reconnect]'); this.leaveGame(); },
    connecting: function(){             console.log('[SOCKET_CLIENT][connecting]'); this.leaveGame(); },
    reconnecting: function(){           console.log('[SOCKET_CLIENT][reconnecting]'); this.leaveGame(); },
    connect_failed: function(){         console.log('[SOCKET_CLIENT][connect_failed]'); this.leaveGame(); },
    reconnect_failed: function(){       console.log('[SOCKET_CLIENT][reconnect_failed]'); this.leaveGame(); },
    close: function(){                  console.log('[SOCKET_CLIENT][close]'); this.leaveGame(); },

  }
}
</script>