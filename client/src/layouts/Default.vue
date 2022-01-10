<template>
  <div class="container">

    <header class="p-2">
      <div class="float-end">
        {{name}} | {{$socket.id}}
      </div>
      <h3 class="m-0"><router-link :to="'/'">A Long Title</router-link></h3>
    </header>

    <hr />

    <slot />
  </div>
</template>

<script>
export default {
  computed: {
    name() {
      return this.$cookie.get('name');
    }
  },
  components: {
  }
};

export class Default {

}
</script>

