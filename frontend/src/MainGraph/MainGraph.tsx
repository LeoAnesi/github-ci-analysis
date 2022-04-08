import { useMemo } from "react";
import { cloneDeep } from "lodash";
import { PlotData } from "plotly.js";
import BasicPlot from "../BasicPlot";
import { TransformedJob } from "../App";

const MainGraph = ({
  filteredTransformedJobs,
}: {
  filteredTransformedJobs: Record<string, TransformedJob[]>;
}) => {
  const plotDatas = useMemo(() => {
    return Object.entries(filteredTransformedJobs).map(([jobName, jobs]) => {
      let index = 0;
      const trace: Partial<PlotData> & { x: string[]; y: number[] } = {
        x: [],
        y: [],
        type: "scatter",
        name: jobName,
      };
      const sortedJobs = cloneDeep(jobs).sort((firstJob, secondJob) => {
        return (
          new Date(firstJob.startedAt).getTime() -
          new Date(secondJob.startedAt).getTime()
        );
      });

      while (index < sortedJobs.length) {
        const date = new Date(sortedJobs[index].startedAt)
          .toISOString()
          .slice(0, 10);
        const matchingJobs = sortedJobs.filter((testStep) =>
          date.startsWith(
            new Date(testStep.startedAt).toISOString().slice(0, 10)
          )
        );
        const sum = matchingJobs
          .map((matchingJob) => matchingJob.duration)
          .reduce(
            (firstJobDuration, secondJobDuration) =>
              firstJobDuration + secondJobDuration,
            0
          );
        const avg = sum / matchingJobs.length;
        trace.x.push(date);
        trace.y.push(avg);
        index += matchingJobs.length;
      }

      return trace;
    });
  }, [filteredTransformedJobs]);

  return (
    <BasicPlot
      {...{
        data: plotDatas,
        layout: {
          margin: { t: 0 },
          width: 1600,
          height: 900,
          yaxis: { rangemode: "tozero" },
        },
      }}
    />
  );
};

export default MainGraph;
