import axios from "axios";
import { readFile, writeFile } from "fs/promises";
import groupBy from "lodash/groupBy";
import flatten from "lodash/flatten";

interface Workflow {
  id: number;
  jobs_url: string;
  status: string;
  conclusion: string;
  name: string;
}

interface Job {
  total_count: number;
  workflow: {
    id: number;
    name: string;
  };
  jobs: {
    started_at: string;
    completed_at: string;
    name: string;
    steps: {
      name: string;
      number: number;
      started_at: string;
      completed_at: string;
    }[];
  }[];
}

interface ScriptParameters {
  saveCsv: boolean;
}

const areEnvironementVariableCorrectlySet = (
  env: Record<string, unknown>
): env is {
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_PERSONAL_TOKEN: string;
  MAX_NUMBER_OF_NEW_WORKFLOWS: string;
} => {
  return (
    typeof env.GITHUB_OWNER === "string" &&
    typeof env.GITHUB_REPO === "string" &&
    typeof env.GITHUB_PERSONAL_TOKEN === "string" &&
    typeof env.MAX_NUMBER_OF_NEW_WORKFLOWS === "string" &&
    !isNaN(parseInt(env.MAX_NUMBER_OF_NEW_WORKFLOWS))
  );
};

if (!areEnvironementVariableCorrectlySet(process.env)) {
  throw new Error("Missing environement variables");
}

const GITHUB_BASE_URL = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}`;
const DEFAULT_HEADERS = {
  Authorization: `token ${process.env.GITHUB_PERSONAL_TOKEN}`,
};
const MAX_NUMBER_OF_NEW_WORKFLOWS = parseInt(
  process.env.MAX_NUMBER_OF_NEW_WORKFLOWS
);

const getScriptParameters = (): ScriptParameters => {
  const args = process.argv;
  const saveCsv = args.findIndex((argument) => argument === "--save-csv") >= 0;

  return {
    saveCsv,
  };
};

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const getWorkflowsAndStoreThem = async (): Promise<Workflow[]> => {
  let previousWorkflowRuns: Workflow[] = [];

  try {
    previousWorkflowRuns = JSON.parse(
      await readFile("frontend/src/graphsData/workflows.json", "utf-8")
    ) as Workflow[];
  } catch (e) {
    console.log("No previously storred workflows found");
  }

  const previousWorkflowRunsIds = previousWorkflowRuns.map(
    (previousWorkflowRun) => previousWorkflowRun.id
  );

  let workflowRuns: Workflow[] = [];
  let newData: Workflow[] = [];
  let index = 1;
  do {
    console.log(`Getting workflow ${index}`);
    const { data } = await axios.get<{ workflow_runs: Workflow[] }>(
      `${GITHUB_BASE_URL}/actions/runs`,
      {
        headers: DEFAULT_HEADERS,
        params: {
          per_page: 100,
          page: index,
        },
      }
    );

    newData = data.workflow_runs.filter(
      (workflowRun) => !previousWorkflowRunsIds.includes(workflowRun.id)
    );
    workflowRuns = workflowRuns.concat(newData);
    index++;
  } while (
    newData.length !== 0 &&
    workflowRuns.length < MAX_NUMBER_OF_NEW_WORKFLOWS
  );

  workflowRuns = previousWorkflowRuns.concat(workflowRuns);

  await writeFile(
    "frontend/src/graphsData/workflows.json",
    JSON.stringify(workflowRuns)
  );

  console.log("workflows data is saved.");

  return workflowRuns;
};

const getJobsFromWorkflows = async (newWorkflows?: Workflow[]) => {
  let workflowRuns =
    newWorkflows ??
    (JSON.parse(
      await readFile("frontend/src/graphsData/workflows.json", "utf-8")
    ) as Workflow[]);

  workflowRuns = workflowRuns.filter(
    (workflowRun) =>
      workflowRun.status === "completed" && workflowRun.conclusion === "success"
  );

  const fetchJob = async (workflowRun: Workflow) => {
    await sleep(Math.floor(Math.random() * 30000));

    const { data } = await axios.get<Omit<Job, "workflow">>(
      workflowRun.jobs_url,
      {
        headers: DEFAULT_HEADERS,
      }
    );

    return {
      ...data,
      workflow: {
        id: workflowRun.id,
        name: workflowRun.name,
      },
    };
  };

  let jobs = await Promise.all(
    workflowRuns.map(async (workflowRun) => {
      let isInError = false;
      let index = 0;

      do {
        isInError = false;
        try {
          const job = await fetchJob(workflowRun);

          return job;
        } catch (e) {
          console.error(
            `Error for workflow ${workflowRun.id}`,
            // @ts-expect-error error is not typed
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            e.response.data
          );
          isInError = true;
          index++;
        }
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } while (isInError && index < 5);

      throw new Error(
        `Unable to fetch job data for workflow ${workflowRun.id}`
      );
    })
  );

  if (newWorkflows !== undefined) {
    let previousJobs: Job[] = [];

    try {
      previousJobs = JSON.parse(
        await readFile("frontend/src/graphsData/jobs.json", "utf-8")
      ) as Job[];
    } catch (e) {
      console.log("No previously storred jobs found");
    }

    jobs = [...previousJobs, ...jobs];
  }

  await writeFile("frontend/src/graphsData/jobs.json", JSON.stringify(jobs));

  console.log("jobs data is saved.");

  return jobs;
};

const getGraphDataFromJobsData = async () => {
  const jobs = JSON.parse(
    await readFile("frontend/src/graphsData/jobs.json", "utf-8")
  ) as Job[];

  const transformedJobs = flatten(
    jobs.map((job) =>
      job.jobs.map((subJob) => {
        return {
          name: subJob.name,
          startedAt: subJob.started_at,
          duration:
            (new Date(subJob.completed_at).getTime() -
              new Date(subJob.started_at).getTime()) /
            1000,
          steps: subJob.steps.map((step) => ({
            name: step.name,
            number: step.number,
            duration:
              (new Date(step.completed_at).getTime() -
                new Date(step.started_at).getTime()) /
              1000,
          })),
          workflow: {
            id: job.workflow.id,
            name: `${job.workflow.name} - ${subJob.name}`,
          },
        };
      })
    )
  );

  await writeFile(
    "frontend/src/graphsData/transformedJobs.json",
    JSON.stringify(groupBy(transformedJobs, "workflow.name"))
  );

  console.log("transformedJobs data is saved.");

  return;
};

const doAll = async () => {
  const { saveCsv } = getScriptParameters();
  await getJobsFromWorkflows(newWorkflows);
  await getGraphDataFromJobsData();
};

void doAll();
