import Vue from 'vue'
import App from './App.vue'
import router from './router'
import Vuex from 'vuex'

Vue.config.productionTip = false

// import styles
import "@/scss/site.scss";

// IMPORT LAYOUTS
import Default from "./layouts/Default";
Vue.component('default_layout', Default);

// START SOCKET IO
let SOCKET_URL = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:5000/';
import VueSocketIO from 'vue-socket.io'
Vue.use(new VueSocketIO({
  debug: false,
  connection: SOCKET_URL,
  options: {
    'reconnectionDelay': 1000,
    'reconnectionDelayMax' : 5000,
    'reconnectionAttempts': 1
  }
}));

var VueCookie = require('vue-cookie');
Vue.use(VueCookie);

// VUEX
Vue.use(Vuex);
import store from './store'

new Vue({
  router,
  store: store,
  render: h => h(App),
  data: function(){
    return {
      user: {}
    }
  },
}).$mount('#app')
