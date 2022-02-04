<template>
  <div class="container">

    <header class="pt-2">
      <div class="float-end text-end">
        <div class="">Hi <b>{{ user.name }}</b></div>
        <small class="text-muted invisible">{{ $socket.id }}</small>
      </div>
      <h3 class="m-0">{{ appTitle }} <span class="badge bg-secondary">{{ appVersion }}</span></h3>
    </header>

    <hr />

    <slot />

    <footer>
      <hr />
      Code available at:
      <a class="text-muted" href="https://github.com/oriongunning/tic-tac-toe" target="_blank">https://github.com/oriongunning/tic-tac-toe</a>
    </footer>
  </div>
</template>

<script>
export default {
  computed: {
    appTitle() {
      return this.$store.getters.appTitle;
    },
    appDescription() {
      return this.$store.getters.appDescription;
    },
    appVersion() {
      return this.$store.getters.appVersion;
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

