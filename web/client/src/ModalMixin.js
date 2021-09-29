//import "./Modal.scss";

// Using Bootstrap modal here for now
export default {
  data() {
    return {
      dialog: false,
      resolve: null
    };
  },
  methods: {
    // Default show when nothing special is needed
    async show() {
      return this._showModal();
    },
    // Call this to mount the VueJS modal and insert it
    // into the DOM.
    _showModal: async function(parent) {
      return new Promise(resolve => {
        this.resolve = resolve;
        this.close = this._closeModal.bind(this);

        this.$mount();

        window.addEventListener("popstate", this._popstateHandler);

        const parentNode = parent ?? document.getElementsByTagName("body")[0];
        // Using DOM functions to mount the elements
        parentNode.appendChild(this.$el);
        this.dialog = true;
      });
    },
    _closeModal: function(args) {
      // Needs to be before .dialog=false
      this.explicitClose = true;

      this.dialog = false;

      // Call the close callback with the passed in arguments
      this.resolve(args);
    },
    _popstateHandler: function() {
      // Hide modal if back button pressed
      this.dialog = false;
    },
    _cleanup: function() {
      // Eliminate duplicate popstate callbacks
      window.removeEventListener("popstate", this._popstateHandler);
      // Destroy the VueJS component in memory
      this.$destroy();
      // remove el from dom
      this.$el.remove();
    }
  },
  watch: {
    dialog(newVal, oldVal) {
      if (oldVal && !newVal && !this.explicitClose) {
        this.resolve();
        this._cleanup();
      }
    }
  }
};
