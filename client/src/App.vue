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

      /*
      if(this.$cookie.get('name')){
        this.$store.dispatch('setUser', {
          'name': this.$cookie.get('name')
        });
      }else{
        let username = usernameGen.generateUsername(10, false);
        this.$cookie.set('name', username, 1);
        this.$store.dispatch('setUser', {
          'name': username
        });
      }*/
      let username = usernameGen.generateUsername(10, false);
      this.$cookie.set('name', username, 1);
      this.$store.dispatch('setUser', {
        'name': username
      });

    })
  },
}
</script>

<style></style>
