<template>
  <div>

    <button @click="createGame()" class="btn btn-primary">Start New Game</button>

    <hr>

    <div v-if="sessions.length > 0">
      <h5>Existing Games</h5>
      <table class="table table-sm table-bordered">
        <thead>
          <tr>
            <th>Game</th>
            <th>Players</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="session in sessions" :key="session.id">
            <td>{{session.id}}</td>
            <td>{{session.players}}/2</td>
            <td class="text-end"><button @click="joinGame(session.id)" class="btn btn-primary">Join</button></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else>
      <div class="alert bg-light">No games available...</div>
    </div>

  </div>
</template>

<script>
export default {
  name: 'Home',
  components: {

  },
  data() {
    return {
      sessions: [],
    }
  },
  computed: {
    hash(){
      return this.generateGameHash(5)
    },
  },
  mounted() {
    console.log('mounted load_games');
    this.$socket.emit('load_games');
    setInterval(() => this.$socket.emit('load_games'), 1000);
  },
  methods: {

    createGame(){
      this.$socket.emit('create_game', { 'hash': this.hash });
      this.$router.push({ path: 'play/'+this.hash });
    },

    joinGame(hash){
      this.$router.push({ path: 'play/'+hash });
    },

    generateGameHash(len) {
      let text = "#"
      let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"
      for( let i=0; i < len; i++ ) {
        text += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return text
    },

  },
  sockets: {
    sessions: function (sessions) {
      console.log('session refresh', sessions);
      this.sessions = sessions;
    },
  },
}
</script>