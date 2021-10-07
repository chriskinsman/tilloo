<template>
  <v-container :fluid="true">
    <v-data-table
      :headers="headers"
      :items="jobs"
      item-key="jobid"
      class="elevation-1 jobs"
      :loading="loading"
      loading-text="Loading jobs..."
      sort-by="name"
      :search="search"
      :custom-filter="filterOnlyCapsText"
      :footer-props="{
        'items-per-page-options': [25, 50, 100],
      }"
      :items-per-page="25"
      :item-class="rowClasses"
    >
      <template v-slot:top>
        <v-text-field v-model="search" label="Search" class="mx-4" />
      </template>
      <template v-slot:header.actions="{}">
        <v-icon @click="jobAdd()"> mdi-plus </v-icon>
      </template>

      <template v-slot:item.name="{ item }">
        <a :href="`/job/${item._id}`">{{ item.name }}</a>
      </template>

      <template v-slot:item.lastRanAt="{ item }">
        {{ item.lastRanAt | formatDate }}
      </template>

      <template v-slot:item.actions="{ item }">
        <v-icon @click="jobDelete(item)"> mdi-delete </v-icon>
        <v-icon @click="jobSettings(item)"> mdi-cog </v-icon>
        <v-icon
          @click="jobRun(item)"
          :disabled="
            item.mutex &&
            (item.lastStatus === 'busy' || item.lastStatus === 'scheduled')
          "
        >
          mdi-play
        </v-icon>
      </template>
    </v-data-table>
  </v-container>
</template>

<script>
import jobService from "../services/job.service.js";
import AddEditJobModal from "./AddEditJob.modal.vue";
import ConfirmModal from "./Confirm.modal.vue";

export default {
  data() {
    return {
      jobs: [],
      loading: false,
      search: "",
    };
  },
  mounted() {
    this.$store.commit("setBreadcrumbs", [
      {
        text: "Jobs",
        disabled: false,
        href: "/",
      },
    ]);
    this.getData();
  },
  computed: {
    headers() {
      return [
        { text: "Name", align: "start", value: "name" },
        { text: "Schedule", value: "schedule", width: "1%", filterable: false },
        { text: "Node Selector", value: "nodeSelector", width: "1%" },
        { text: "Last Ran", value: "lastRanAt", width: "1%" },
        {
          text: "Last Status",
          value: "lastStatus",
          width: "1%",
          filterable: false,
        },
        {
          text: "",
          value: "actions",
          align: "end",
          sortable: false,
          filterable: false,
          width: "1%",
        },
      ];
    },
  },
  methods: {
    async getData() {
      this.loading = true;
      try {
        this.jobs = await jobService.listJobs();
      } finally {
        this.loading = false;
      }
    },
    async jobRun(job) {
      await jobService.runJob(job._id);
    },
    async jobAdd() {
      await this.showModal(AddEditJobModal);
    },
    async jobSettings(job) {
      await this.showModal(AddEditJobModal, { jobId: job._id });
    },
    async jobDelete(job) {
      const res = await this.showModal(ConfirmModal, {
        title: "Confirm Delete",
        textContent: `Are you sure you want to delete ${job.name}?`,
        ok: "Delete",
      });
      if (res === "ok") {
        await jobService.deleteJob(job._id);
      }
    },
    filterOnlyCapsText(value, search) {
      return (
        value !== null &&
        search !== null &&
        typeof value === "string" &&
        value.toString().toLowerCase().indexOf(search.toLowerCase()) !== -1
      );
    },
    rowClasses(row) {
      return `job-${row.lastStatus} ${row.enabled ? "" : "job-disabled"}`;
    },
  },
  sockets: {
    status(statusUpdate) {
      const job = this.jobs.find((job) => job._id === statusUpdate.jobId);
      if (job) {
        this.$set(job, "lastStatus", statusUpdate.status);
        if (statusUpdate.status === "busy") {
          this.$set(job, "lastRanAt", new Date());
        }
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
.jobs > div.v-data-table__wrapper > table {
  thead > tr > th {
    white-space: nowrap;
  }

  tbody > tr {
    td:nth-child(2),
    td:nth-child(3),
    td:nth-child(4),
    td:nth-child(6) {
      white-space: nowrap;

      button.v-icon {
        margin-right: 10px;
        &:last-child {
          margin-right: 0px;
        }
      }
    }

    &.job-disabled td {
      color: rgb(191, 191, 191);
    }

    &.job-disabled a,
    &.job-disabled a:link {
      color: rgb(191, 191, 191);
    }

    &.job-busy {
      background-color: rgba(92, 184, 92, 0.2);
      transition: background-color 1s;
    }

    &.job-fail:not(&.disabled) {
      background-color: rgba(169, 68, 66, 0.2);
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