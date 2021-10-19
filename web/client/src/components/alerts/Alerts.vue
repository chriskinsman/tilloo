<template>
  <v-container v-if="messages.length > 0" :fluid="true">
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
