<template>
  <v-container :fluid="true">
    <v-icon @click="jobStop()" :disabled="stopDisabled"> mdi-stop </v-icon>
    <RecycleScroller
      class="scroller"
      :items="loglines"
      :item-size="19"
      v-slot="{ item }"
      key-field="_id"
      :page-mode="true"
    >
      <div flex layout="row">
        <span class="output">{{ item.output }}</span>
      </div>
    </RecycleScroller>
  </v-container>
</template>

<script>
import jobService from "../services/job.service.js";
import { RecycleScroller } from "vue-virtual-scroller";

import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

export default {
  components: { RecycleScroller },
  data() {
    return {
      loglines: [],
      job: null
    };
  },
  mounted() {
    this.getBreadcrumbs(this.$route.params.runid);
    this.getData(this.$route.params.runid);
  },
  methods: {
    async getBreadcrumbs(runId) {
      const job = await jobService.getJobByRunId(runId);
      if (job) {
        this.job = job;
        this.$store.commit("setBreadcrumbs", [
          {
            text: "Jobs",
            disabled: false,
            href: "/"
          },
          {
            text: job.name,
            disabled: false,
            href: `/job/${job._id}`
          },
          {
            text: runId,
            disabled: true
          }
        ]);
      }
    },
    async getData(runId) {
      this.loglines = await jobService.getRunOutput(runId);
    },
    async jobStop() {
      await jobService.stopRun(this.$route.params.runid);
    }
  },
  computed: {
    stopDisabled() {
      return !this.job || this.job.lastStatus !== "busy";
    }
  },
  sockets: {
    status(statusUpdate) {
      if (statusUpdate.runId === this.$route.params.runid) {
        this.$set(this.job, "lastStatus", statusUpdate.status);
      }
    },
    log(logLine) {
      if (logLine.runId === this.$route.params.runid) {
        this.loglines.push({
          _id: logLine._id ?? new Date(),
          output: logLine.output
        });
      }
    }
  }
};
</script>

<style lang="scss">
.output {
  white-space: pre;
  font-family: ‘Lucida Console’, Monaco, monospace;
}

.v-icon {
  padding-bottom: 10px;
}
</style>
