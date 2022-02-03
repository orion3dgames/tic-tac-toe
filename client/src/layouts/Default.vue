<template>
  <div class="container">

    <header class="p-2">
      <div class="float-end text-right">
        <div class="badge bg-primary">USERNAME: {{ user.name }}</div><br>
        <div class="badge bg-primary">SOCKET_ID: {{ $socket.id }}</div>
      </div>
      <h3 class="m-0">{{ appTitle }}</h3>
      <a class="text-muted" href="https://github.com/oriongunning/tic-tac-toe" target="_blank">https://github.com/oriongunning/tic-tac-toe</a>
    </header>

    <hr />

    <slot />
  </div>
</template>

<script>
export default {
  computed: {
    appTitle() {
      return this.$store.getters.appTitle;
    },
    user() {
      return this.$store.getters.currentUser;
    },
  },

  components: {

  }
};

export class Default {

}
</script>

