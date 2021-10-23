import Vue from "vue";
import VueSocketIOExt from "vue-socket.io-extended";
import io from "socket.io-client";

const socket = io(null, {
  reconnection: true,
  reconnectionDelay: 500,
  maxReconnectionAttempts: Infinity,
});

Vue.use(VueSocketIOExt, socket);

export default {
  socket: {
    connect() {
      console.log("socket connected");
    },
    connect_error(err) {
      console.error(`connect error ${err.message}`);
    },
  },
};
