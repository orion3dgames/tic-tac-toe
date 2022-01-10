<template>
  <div>
    <button @click="createGame()" class="btn btn-primary">Start</button>
  </div>
</template>

<script>
export default {
  name: 'Home',
  components: {

  },
  computed: {
    hash(){
      return this.rndStr(5)
    },
  },
  methods: {

    createGame(){

      this.$socket.emit('create_game', { 'hash': this.hash });

      this.$router.push({ path: 'play/'+this.hash });

    },

    rndStr(len) {

      //this.$socket.emit('create_game', { 'hash': this.hash });

      let text = "#"
      let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789"
      for( let i=0; i < len; i++ ) {
        text += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return text
    },

  }
}
</script>