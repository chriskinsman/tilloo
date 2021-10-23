<template>
  <v-container :fluid="true">
    <v-data-table
      :headers="headers"
      :items="runs"
      item-key="runid"
      class="elevation-1 runs"
      :loading="loading"
      loading-text="Loading runs..."
      sort-by="startedAt"
      :sort-desc="true"
      :footer-props="{
        'items-per-page-options': [10, 25, 50, 100],
      }"
      :items-per-page="25"
      :item-class="rowClasses"
    >
      <template v-slot:header.actions="{}">
        <v-icon :disabled="runDisabled" @click="jobRun()"> mdi-play </v-icon>
      </template>

      <template v-slot:item._id="{ item }">
        <a :href="`/run/${item._id}`">{{ item._id }}</a>
      </template>

      <template v-slot:item.startedAt="{ item }">
        {{ item.startedAt | formatDate }}
      </template>
      <template v-slot:item.completedAt="{ item }">
        {{ item.completedAt | formatDate }}
      </template>

      <template v-slot:item.actions="{ item }">
        <v-icon v-if="item.status === 'busy'" @click="runStop(item._id)">
          mdi-stop
        </v-icon>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import jobService from "../services/job.service.js";

export default {
  data() {
    return {
      runs: [],
      loading: false,
      job: null,
    };
  },
  computed: {
    headers() {
      return [
        { text: "Id", align: "start", value: "_id", sortable: false },
        { text: "Started", value: "startedAt", width: "1%" },
        { text: "Completed", value: "completedAt", width: "1%" },
        { text: "Status", value: "status", width: "1%" },
        {
          text: "",
          value: "actions",
          align: "end",
          sortable: false,
          width: "1%",
        },
      ];
    },
    runDisabled() {
      return (
        !this.job ||
        (this.job.mutex &&
          (this.job.lastStatus === "busy" ||
            this.job.lastStatus === "scheduled"))
      );
    },
  },
  mounted() {
    this.getBreadcrumbs(this.$route.params.jobid);
    this.getData(this.$route.params.jobid);
  },
  methods: {
    async getBreadcrumbs(jobId) {
      const job = await jobService.getJob(jobId);
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
            disabled: true,
          },
        ]);
      }
    },
    async getData(jobId) {
      this.loading = true;
      const runsData = await jobService.getRunsForJob(jobId);
      if (runsData) {
        this.runs = runsData.runs;
      }
      this.loading = false;
    },
    async jobRun() {
      await jobService.runJob(this.$route.params.jobid);
    },
    async runStop(runId) {
      await jobService.stopRun(runId);
    },
    rowClasses(row) {
      return `run-${row.status}`;
    },
  },
  sockets: {
    async status(statusUpdate) {
      if (
        statusUpdate.jobId &&
        statusUpdate.jobId === this.$route.params.jobid &&
        statusUpdate.runId
      ) {
        const run = await jobService.getRun(statusUpdate.runId);
        const runIndex = this.runs.findIndex((run) => {
          return run._id == statusUpdate.runId; // eslint-disable-line eqeqeq
        });

        if (runIndex !== -1) {
          this.$set(this.runs, runIndex, run);
        } else {
          this.runs.push(run);
        }

        this.$set(this.job, "lastStatus", statusUpdate.status);
      }
    },
    async jobchange(jobMessage) {
      const job = await jobService.getJob(jobMessage.jobId);
      if (job) {
        const jobIndex = this.jobs.findIndex((item) => item._id === job._id);
        if (jobIndex !== -1) {
          if (job.deleted) {
            this.$delete(this.jobs, jobIndex);
          } else {
            this.$set(this.jobs, jobIndex, job);
          }
        } else {
          this.jobs.push(job);
        }
      }
    },
  },
};
</script>

<style lang="scss">
.runs > div.v-data-table__wrapper > table {
  thead > tr > th {
    white-space: nowrap;
  }

  tbody > tr {
    td:nth-child(2),
    td:nth-child(3) {
      white-space: nowrap;

      button.v-icon {
        margin-right: 10px;
        &:last-child {
          margin-right: 0px;
        }
      }
    }

    &.run-busy {
      background-color: rgba(92, 184, 92, 0.2);
      transition: background-color 1s;
    }
  }
  i.v-icon {
    padding-bottom: 0px;
  }
}

button.v-icon {
  padding-bottom: 0px;
}
</style>
