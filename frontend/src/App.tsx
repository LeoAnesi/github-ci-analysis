import { useMemo, useState } from "react";
import { flatten, map, pickBy, uniqBy } from "lodash";
import Select from "react-select";
import transformedJobs from "./graphsData/transformedJobs.json";
import "./App.css";
import MainGraph from "./MainGraph";
import JobDetailsGraphs from "./JobDetailsGraphs";
import StepsGraph from "./StepsGraph";

export interface TransformedJob {
  name: string;
  startedAt: string;
  duration: number;
  steps: {
    name: string;
    number: number;
    duration: number;
  }[];
  workflow: {
    id: number;
    name: string;
  };
}

interface JobNameOption {
  value: string;
  label: string;
}

function App() {
  const [selectedJobTypes, setSelectedJobTypes] = useState<JobNameOption[]>([]);
  const jobNames = useMemo(() => {
    return uniqBy(
      map(
        flatten(
          Object.keys(transformedJobs as Record<string, TransformedJob[]>)
        ),
        (jobName) => ({ value: jobName, label: jobName })
      ),
      "value"
    );
  }, []);

  const filteredTransformedJobs = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const test: Record<string, TransformedJob[]> = pickBy(
      transformedJobs,
      (jobs, jobName) =>
        selectedJobTypes.map(({ value }) => value).includes(jobName)
    );

    return test;
  }, [selectedJobTypes]);

  return (
    <div className="App">
      <Select
        isMulti
        name="jobs"
        options={jobNames}
        className="basic-multi-select"
        classNamePrefix="select"
        closeMenuOnSelect={false}
        value={selectedJobTypes}
        onChange={(values) => setSelectedJobTypes(values as JobNameOption[])}
      />
      <MainGraph filteredTransformedJobs={filteredTransformedJobs} />
      <StepsGraph filteredTransformedJobs={filteredTransformedJobs} />
      <JobDetailsGraphs filteredTransformedJobs={filteredTransformedJobs} />
    </div>
  );
}

export default App;
