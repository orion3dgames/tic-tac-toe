<template>
  <div id="app">
      <component :is="layout">
        <router-view />
      </component>
  </div>
</template>

<script>

const default_layout = "default";
const usernameGen = require("username-gen")

export default {
  name: 'App',
  computed: {
    layout() {
      return (this.$route.meta.layout || default_layout) + "_layout";
    }
  },
  mounted: function () {
    this.$nextTick(function () {
      console.log('STARTED');

      if(!this.$cookie.get('name')){
        let username = usernameGen.generateUsername(10, false);
        this.$cookie.set('name', username, 1);
      }

    })
  },
}
</script>

<style></style>
