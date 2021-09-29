import axios from "axios";

import alerts from "../components/alerts/Alerts.js";

const JobService = {};

JobService.listJobs = async function listJobs() {
  try {
    const result = await axios.get("/api/job");
    return result.data;
  } catch (e) {
    alerts.add(alerts.Level.Error, "Error listing jobs");
    console.error(`Error listing jobs`, e);
  }
};

JobService.getJob = async function getJob(jobId) {
  try {
    const result = await axios.get(`/api/job/${jobId}`);
    return result.data;
  } catch (e) {
    alerts.add(alerts.Level.Error, "Error getting job");
    console.error("Error getting job", e);
  }
};

JobService.getRun = async function getRun(runId) {
  try {
    const result = await axios.get(`/api/run/${runId}`);
    return result.data;
  } catch (e) {
    alerts.add(alerts.Level.Error, "Error getting run");
    console.error(`Error getting run for runId: ${runId}`, e);
  }
};

JobService.getRunsForJob = async function getRunsForJob(jobId) {
  try {
    const result = await axios.get(`/api/job/${jobId}/runs`);
    return result.data;
  } catch (e) {
    alerts.add(alerts.Level.Error, "Error getting runs");
    console.error(`Error getting runs for jobid: ${jobId}`, e);
  }
};

JobService.getJobByRunId = async function getJobByRunId(runId) {
  try {
    const result = await axios.get(`/api/job/run/${runId}`);
    return result.data;
  } catch (e) {
    alerts.add(alerts.Level.Error, "Error getting job");
    console.error(`Error getting job for runId: ${runId}`, e);
  }
};

JobService.getRunOutput = async function getRunOutput(runId) {
  try {
    const result = await axios.get(`/api/run/${runId}/output`);
    return result.data;
  } catch (e) {
    alerts.add(alerts.Level.Error, "Error getting output for run");
    console.error(`Error getting output for runId: ${runId}`, e);
  }
};

JobService.runJob = async function runJob(jobId) {
  try {
    await axios.post(`/api/job/${jobId}/run`);
  } catch (e) {
    alerts.add(alerts.Level.Error, "Error running job");
    console.error(`Error running jobid: ${jobId}`, e);
  }
};

JobService.stopRun = async function stopRun(runId) {
  try {
    await axios.post(`/api/run/${runId}/stop`);
  } catch (e) {
    alerts.add(alerts.Level.Error, "Error stopping run");
    console.error(`Error stopping runId: ${runId}`, e);
  }
};

JobService.createJob = async function createJob(jobDef) {
  try {
    await axios.post(`/api/job/create`, { jobDef: jobDef });
  } catch (e) {
    alerts.add(alerts.Level.Error, "Error creating job");
    console.error(`Error creating job`, e);
  }
};

JobService.updateJob = async function updateJob(jobId, jobDef) {
  try {
    await axios.post(`/api/job/${jobId}/update`, { jobDef: jobDef });
  } catch (e) {
    alerts.add(alerts.Level.Error, "Error udpating job");
    console.error(`Error updating jobid: ${jobId}`, e);
  }
};

JobService.deleteJob = async function deleteJob(jobId) {
  try {
    await axios.post(`/api/job/${jobId}/delete`);
  } catch (e) {
    alerts.add(alerts.Level.Error, "Error deleting job");
    console.error(`Error deleting jobid: ${jobId}`, e);
  }
};

export default JobService;
