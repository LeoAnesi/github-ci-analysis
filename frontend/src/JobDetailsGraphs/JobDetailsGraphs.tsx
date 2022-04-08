import { useMemo } from "react";
import { PlotData } from "plotly.js";
import BasicPlot from "../BasicPlot";
import { TransformedJob } from "../App";

const JobDetailsGraphs = ({
  filteredTransformedJobs,
}: {
  filteredTransformedJobs: Record<string, TransformedJob[]>;
}) => {
  const plotDatas = useMemo(() => {
    return Object.entries(filteredTransformedJobs).reduce(
      (plots, [jobName, jobs]) => {
        const traces: Record<
          string,
          Partial<PlotData> & { x: string[]; y: number[] }
        > = {};
        const generateEmptyTrace = (
          name: string
        ): Partial<PlotData> & { x: string[]; y: number[] } => ({
          x: [],
          y: [],
          name,
          type: "bar",
        });
        let date = "";
        let index = 1;
        jobs
          .sort((firstStep, secondStep) => {
            return (
              new Date(firstStep.startedAt).getTime() -
              new Date(secondStep.startedAt).getTime()
            );
          })
          .map((job) => {
            const jobDate = new Date(job.startedAt).toISOString().slice(0, 10);
            if (jobDate !== date) {
              date = jobDate;
              index = 1;
            }
            job.steps.forEach((step) => {
              // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
              if (traces[step.name] === undefined) {
                traces[step.name] = generateEmptyTrace(step.name);
              }

              traces[step.name].x.push(`${jobDate}-${index}`);
              traces[step.name].y.push(step.duration);
            });

            index++;
          });

        return {
          ...plots,
          [jobName]: traces,
        };
      },
      {} as Record<
        string,
        Record<
          string,
          (Partial<PlotData> & { x: string[]; y: number[] }) | undefined
        >
      >
    );
  }, [filteredTransformedJobs]);

  return (
    <>
      {Object.entries(plotDatas).map(([jobGroupName, plotData]) => (
        <BasicPlot
          {...{
            data: Object.values(
              plotData as Record<
                string,
                Partial<PlotData> & { x: string[]; y: number[] }
              >
            ),
            layout: {
              margin: { t: 0 },
              width: 1600,
              height: 900,
              barmode: "stack",
              title: {
                text: jobGroupName,
              },
            },
          }}
        />
      ))}
    </>
  );
};

export default JobDetailsGraphs;
