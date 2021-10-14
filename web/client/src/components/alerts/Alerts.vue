<template>
  <v-container :fluid="true" v-if="messages.length > 0">
    <v-alert
      v-for="m in messages"
      :id="'message-' + m.id"
      :key="m.id"
      :type="m.level"
      transition="fade-transition"
      dense
      class="mb-0"
    >
      {{ m.text }}
    </v-alert>
  </v-container>
</template>

<script>
export default {
  computed: {
    messages() {
      return this.$store.state.alerts.messages;
    }
  }
};
</script>

<style></style>
