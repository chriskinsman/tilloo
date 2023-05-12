<template>
  <v-app>
    <v-app-bar app color="primary" dark density="compact">
      <v-breadcrumbs :items="breadcrumbs" large>
        <template v-slot:divider>
          <v-icon>mdi-chevron-right</v-icon>
        </template>
      </v-breadcrumbs>

      <template v-slot:append>
        <v-btn href="/" variant="text">
            Tilloo
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <!-- <alerts /> -->
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
//import Alerts from "./components/alerts/Alerts.vue";
import { computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const breadcrumbs = computed(() => {
    return store.state.breadcrumbs;    
});
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
