<template>
  <div class="text-center">
    <v-dialog v-model="dialog" width="500">
      <v-card>
        <v-card-title class="text-h5 light-blue title">
          {{ action }} Job
        </v-card-title>

        <v-container :fluid="true">
          <v-form ref="form">
            <v-row dense>
              <v-col>
                <v-text-field
                  v-model="job.name"
                  label="Name"
                  autofocus
                  :error-messages="nameErrors"
                />
              </v-col>
            </v-row>
            <v-row dense>
              <v-col>
                <v-text-field v-model="job.description" label="Description" />
              </v-col>
            </v-row>
            <v-row dense>
              <v-col cols="4">
                <v-text-field
                  v-model="job.schedule"
                  label="Schedule"
                  :error-messages="scheduleErrors"
                  :hint="scheduleDescription"
                />
              </v-col>
              <v-col cols="5">
                <v-text-field
                  v-model="job.nodeSelector"
                  label="Node Selector"
                />
              </v-col>
              <v-col cols="3">
                <v-checkbox
                  v-model="job.enabled"
                  label="Enabled"
                  :true-value="true"
                  :false-value="false"
                />
              </v-col>
            </v-row>
            <v-row dense>
              <v-col>
                <v-text-field
                  v-model="job.imageUri"
                  label="Container Image Uri"
                  :error-messages="imageUriErrors"
                />
              </v-col>
            </v-row>
            <v-row dense>
              <v-col>
                <v-text-field
                  v-model="job.path"
                  label="Path"
                  :error-messages="pathErrors"
                />
              </v-col>
            </v-row>
            <v-row dense>
              <v-col>
                <v-combobox
                  v-model="job.args"
                  chips
                  clearable
                  label="Args"
                  multiple
                >
                  <template #no-data>
                    <v-list-item>
                      <v-list-item-content>
                        <v-list-item-title>
                          Press <kbd>enter</kbd> to create a new arg
                        </v-list-item-title>
                      </v-list-item-content>
                    </v-list-item>
                  </template>
                  <template #selection="{ attrs, item }">
                    <v-chip
                      v-bind="attrs"
                      close
                      @click:close="removeArg(item)"
                      >{{ item }}</v-chip
                    >
                  </template>
                </v-combobox>
              </v-col>
            </v-row>
            <v-row dense>
              <v-col>
                <v-text-field
                  v-model="job.timeout"
                  label="Timeout"
                  :error-messages="timeoutErrors"
                />
              </v-col>
              <v-col class="d-flex justify-center">
                <v-checkbox v-model="job.mutex" label="Mutex" :true-value="true" :false-value="false" />
              </v-col>
              <v-col>
                <v-text-field
                  v-model="job.failuresBeforeAlert"
                  label="Failures before alert"
                  :error-messages="failuresBeforeAlertErrors"
                />
              </v-col>
            </v-row>
            <v-row dense>
              <v-col>
                <v-text-field
                  v-model="job.alternateFailureEmail"
                  label="Alternate Failure Email"
                  :error-messages="emailErrors"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-container>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="secondary" text @click="cancelModal"> Cancel </v-btn>
          <v-btn color="primary" text @click="okModal"> {{ action }} </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import jobService from "../services/job.service.js";
import modalMixin from "../ModalMixin.js";
import { validationMixin } from "vuelidate";
import { required, integer, email } from "vuelidate/lib/validators";
import cronstrue from "cronstrue";

export default {
  mixins: [modalMixin, validationMixin],
  props: {
    jobId: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      job: {
        name: null,
        schedule: "0 0 */1 * * *",
        nodeSelector: "nodegroup=worker",
        enabled: true,
        imageUri: null,
        path: null,
        args: [],
        timeout: 0,
        mutex: true,
        failuresBeforeAlert: 1,
        description: null,
      },
    };
  },
  validations: {
    job: {
      name: { required },
      schedule: { required },
      imageUri: { required },
      path: { required },
      timeout: { required, integer },
      failuresBeforeAlert: { required, integer },
      alternateFailureEmail: { email },
    },
  },
  computed: {
    action() {
      return this.jobId ? "Update" : "Add";
    },
    scheduleDescription() {
      if (this.job.schedule) {
        try {
          return cronstrue.toString(this.job.schedule);
        } catch (e) {
          return "Invalid schedule";
        }
      } else {
        return undefined;
      }
    },
    nameErrors() {
      const errors = [];
      if (this.$v.job.name.$dirty) {
        if (!this.$v.job.name.required) {
          errors.push("Name is required");
        }
      }
      return errors;
    },
    scheduleErrors() {
      const errors = [];
      if (this.$v.job.schedule.$dirty) {
        if (!this.$v.job.schedule.required) {
          errors.push("Schedule is required");
        }
      }
      return errors;
    },
    imageUriErrors() {
      const errors = [];
      if (this.$v.job.imageUri.$dirty) {
        if (!this.$v.job.imageUri.required) {
          errors.push("Container image uri is required");
        }
      }
      return errors;
    },
    pathErrors() {
      const errors = [];
      if (this.$v.job.path.$dirty) {
        if (!this.$v.job.path.required) {
          errors.push("Path is required");
        }
      }
      return errors;
    },
    timeoutErrors() {
      const errors = [];
      if (this.$v.job.timeout.$dirty) {
        if (!this.$v.job.timeout.required) {
          errors.push("Timeout is required");
        }

        if (
          !this.$v.job.timeout.integer ||
          !(parseInt(this.$v.job.timeout.$model) >= 0)
        ) {
          errors.push("Timeout must be an integer > 0");
        }
      }
      return errors;
    },
    failuresBeforeAlertErrors() {
      const errors = [];
      if (this.$v.job.failuresBeforeAlert.$dirty) {
        if (!this.$v.job.failuresBeforeAlert.required) {
          errors.push("Failures before alert is required");
        }

        if (
          !this.$v.job.failuresBeforeAlert.integer ||
          !(parseInt(this.$v.job.failuresBeforeAlert.$model) >= 0)
        ) {
          errors.push("Failures before alert must be an integer > 0");
        }
      }
      return errors;
    },
    emailErrors() {
      const errors = [];
      if (this.$v.job.alternateFailureEmail.$dirty) {
        if (!this.$v.job.alternateFailureEmail.email) {
          errors.push("Email is invalid");
        }
      }
      return errors;
    },
  },
  mounted() {
    if (this.jobId) {
      this.getData(this.jobId);
    }
  },
  methods: {
    async getData(jobId) {
      this.job = await jobService.getJob(jobId);
    },
    async updateOrCreateJob() {
      if (this.jobId) {
        await jobService.updateJob(this.jobId, this.job);
      } else {
        await jobService.createJob(this.job);
      }
    },
    removeArg: function (item) {
      this.job.args.splice(this.job.args.indexOf(item), 1);
      this.job.args = [...this.job.args];
    },
    async okModal() {
      this.$v.$touch();
      if (!this.$v.$invalid) {
        this.updateOrCreateJob();
        this.close("OK");
      }
    },
    cancelModal() {
      this.close("cancel");
    },
  },
};
</script>

<style lang="scss">
i.v-icon {
  padding-bottom: 0px;
}

.v-dialog > .v-card > .v-card__title.title {
  padding-left: 16px;
}
</style>
