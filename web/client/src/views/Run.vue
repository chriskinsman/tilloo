<template>
  <v-container :fluid="true">
    <v-icon :disabled="stopDisabled" title="Stop Job" @click="jobStop()">
      mdi-stop
    </v-icon>
    <v-icon
      :disabled="downloadDisabled"
      title="Download Log"
      @click="downloadLog()"
    >
      mdi-download
    </v-icon>
    <RecycleScroller
      v-slot="{ item }"
      class="scroller"
      :items="loglines"
      :item-size="19"
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
import Vue from "vue";
import jobService from "../services/job.service.js";
import { RecycleScroller } from "vue-virtual-scroller";

import "vue-virtual-scroller/dist/vue-virtual-scroller.css";

export default {
  components: { RecycleScroller },
  data() {
    return {
      loglines: [],
      job: null,
    };
  },
  computed: {
    stopDisabled() {
      return !this.job || this.job.lastStatus !== "busy";
    },
    downloadDisabled() {
      return this.loglines.length === 0;
    },
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
            href: "/",
          },
          {
            text: job.name,
            disabled: false,
            href: `/job/${job._id}`,
          },
          {
            text: runId,
            disabled: true,
          },
        ]);
      }
    },
    async getData(runId) {
      this.loglines = await jobService.getRunOutput(runId);
    },
    async jobStop() {
      await jobService.stopRun(this.$route.params.runid);
    },
    downloadLog() {
      const filename = `${this.$route.params.runid}.log`;
      const blob = new Blob(
        [
          this.loglines.reduce((log, item) => {
            return log + item.output + "\r\n";
          }, ""),
        ],
        { type: "text/plain" }
      );

      if (window.navigator.msSaveBlob) {
        // Support for IE 11
        window.navigator.msSaveBlob(blob, filename);
      } else {
        // For other browsers. Need to add it to the document for it to work in Firefox.
        let url = window.URL.createObjectURL(blob);
        let a = window.document.createElement("a");
        a.download = filename;
        a.cssText = "display: 'none'";
        a.href = url;
        window.document.body.append(a);
        a.click();
        if (a.remove) a.remove();
        if (url) {
          Vue.nextTick(() => {
            window.URL.revokeObjectURL(url);
          });
        }
      }
    },
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
          output: logLine.output,
        });
      }
    },
  },
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
