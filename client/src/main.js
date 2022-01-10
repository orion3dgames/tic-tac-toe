import Vue from 'vue'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false

// import styles
import "@/scss/site.scss";

// IMPORT LAYOUTS
import Default from "./layouts/Default";
Vue.component('default_layout', Default);

// START SOCKET IO
import VueSocketIO from 'vue-socket.io'
Vue.use(new VueSocketIO({
  debug: false,
  connection: 'http://localhost:3009',
  options: {
    'reconnection': true,
    'reconnectionDelay': 1000,
    'reconnectionDelayMax' : 5000,
    'reconnectionAttempts': 1
  }
}));

var VueCookie = require('vue-cookie');
Vue.use(VueCookie);

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
