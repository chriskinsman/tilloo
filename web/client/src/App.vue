<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-breadcrumbs :items="items" large>
        <template v-slot:divider>
          <v-icon>mdi-chevron-right</v-icon>
        </template>
      </v-breadcrumbs>

      <v-spacer></v-spacer>

      <v-btn href="/" text x-large>
        <span class="mr-2">Tilloo</span>
      </v-btn>
    </v-app-bar>

    <v-main>
      <HelloWorld />
    </v-main>
  </v-app>
</template>

<script>
import HelloWorld from "./components/HelloWorld";

export default {
  name: "App",

  components: {
    HelloWorld
  },

  data: () => ({
    items: [
      {
        text: "TILLOO",
        disabled: false,
        href: "/"
      },
      {
        text: "Backup",
        disabled: false,
        href: "/job/foo"
      },
      {
        text: "asdfl;akjsdfl;kasjdfas",
        disabled: true
      }
    ]
  })
};
</script>

<style lang="scss">
.v-application {
  .v-breadcrumbs a {
    color: white;
  }
}
</style>
