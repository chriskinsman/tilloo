<template>
  <div class="text-center">
    <v-dialog v-model="dialog" width="500">
      <v-card>
        <v-card-title class="text-h5 light-blue title">
          {{ title }}
        </v-card-title>

        <v-container :fluid="true">
          {{ textContent }}
        </v-container>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" text @click="cancelModal"> Cancel </v-btn>
          <v-btn color="primary" text @click="okModal"> {{ ok }} </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import modalMixin from "../ModalMixin.js";

export default {
  mixins: [modalMixin],
  props: {
    title: {
      type: String,
      required: true,
      default: "",
    },
    textContent: {
      type: String,
      required: true,
      default: "",
    },
    ok: {
      type: String,
      default: "Ok",
    },
  },
  data() {
    return {};
  },
  methods: {
    async okModal() {
      this.close("ok");
    },
    cancelModal() {
      this.close("cancel");
    },
  },
};
</script>

<style lang="scss">
.v-dialog > .v-card > .v-card__title.title {
  padding-left: 16px;
}
</style>
