<template>
  <v-app>
    <v-app-bar app color="primary" dark dense>
      <v-breadcrumbs :items="breadcrumbs" large>
        <template #divider>
          <v-icon>mdi-chevron-right</v-icon>
        </template>
      </v-breadcrumbs>

      <v-spacer></v-spacer>

      <v-btn href="/" text x-large>
        <span class="mr-2">Tilloo</span>
      </v-btn>
    </v-app-bar>

    <v-main>
      <alerts />
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
import Alerts from "./components/alerts/Alerts.vue";

export default {
  name: "App",

  components: { Alerts },

  data: () => ({}),
  computed: {
    breadcrumbs() {
      return this.$store.state.breadcrumbs;
    },
  },
};
</script>

<style lang="scss">
.v-application {
  .v-breadcrumbs {
    a {
      color: white;
    }

    i.v-icon {
      padding-bottom: 0px;
    }
  }
}
</style>
