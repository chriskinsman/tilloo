//@ts-check
const Alerts = {};

let store = null;

/**
 * @typedef   {"error"|"info"|"warning"|"success"|"loading"} Levels
 *
 */

/**
 * Message Levels
 * @readonly
 * @enum {string}
 */
const Level = {
  Error: "error",
  Info: "info",
  Warning: "warning",
  Success: "success",
};

Alerts.Level = Level;

// This is a plugin that registers a store module for the flash messages.
// Call when you setup the store by adding it to the plugins array.
Alerts.storePlugin = function (rootStore) {
  store = rootStore;

  store.registerModule("alerts", {
    namespaced: true,
    state: {
      messages: [], // expected object elements: {level (str), text (str)}
    },
    mutations: {
      add(state, message) {
        var messageId = new Date().getTime();
        message.id = messageId;
        state.messages.push(message);
        setTimeout(() => {
          this.commit("alerts/delete", messageId);
        }, 5000);
      },
      delete(state, messageId) {
        for (var i = 0; i < state.messages.length; i++) {
          if (state.messages[i].id == messageId) {
            state.messages.splice(i, 1);
            break;
          }
        }
      },
      clear(state) {
        state.messages = [];
      },
    },
  });
};

/**
 *  Clear all flash messages
 */
Alerts.clear = function clear() {
  store.commit("alerts/clear");
};

/**
 * Replace all messages in the flash message store with the one specified
 * @param {Levels} level
 * @param {string} message
 */
Alerts.replace = function replace(level, message) {
  if (!Object.values(Level).includes(level)) {
    throw new RangeError("Not a valid 'level'");
  }

  Alerts.clear();
  store.commit("alerts/add", { level: level, text: message });
};

/**
 * Add a new message to the flash message store
 * @param {Levels} level
 * @param {string} message
 */
Alerts.add = function add(level, message) {
  if (!Object.values(Level).includes(level)) {
    throw new RangeError("Not a valid 'level'");
  }

  store.commit("alerts/add", { level: level, text: message });
};

export default Alerts;
