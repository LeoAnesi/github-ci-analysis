import { useMemo } from "react";
import { flatten, groupBy } from "lodash";
import { PlotData } from "plotly.js";
import BasicPlot from "../BasicPlot";
import { TransformedJob } from "../App";

const StepsGraph = ({
  filteredTransformedJobs,
}: {
  filteredTransformedJobs: Record<string, TransformedJob[]>;
}) => {
  const plotDatas = useMemo(() => {
    const testStepsGroupedByName = groupBy(
      flatten(
        Object.values(filteredTransformedJobs).map((jobs) => {
          return flatten(
            jobs.map((job) =>
              job.steps.map((step) => ({
                ...step,
                startedAt: job.startedAt,
              }))
            )
          );
        })
      ).sort((firstStep, secondStep) => {
        return (
          new Date(firstStep.startedAt).getTime() -
          new Date(secondStep.startedAt).getTime()
        );
      }),
      "name"
    );

    return Object.entries(testStepsGroupedByName).map(([key, value]) => {
      let index = 0;
      const jobDetailsPlotDataForGroup: Partial<PlotData> & {
        x: string[];
        y: number[];
      } = {
        x: [],
        y: [],
        type: "scatter",
        name: key,
      };

      while (index < value.length) {
        const date = new Date(value[index].startedAt)
          .toISOString()
          .slice(0, 10);
        const matchingSteps = value.filter(
          (testStep) =>
            new Date(testStep.startedAt).toISOString().slice(0, 10) === date
        );
        const sum = matchingSteps
          .map((matchingStep) => matchingStep.duration)
          .reduce((a, b) => a + b, 0);
        const avg = sum / matchingSteps.length;
        jobDetailsPlotDataForGroup.x.push(date);
        jobDetailsPlotDataForGroup.y.push(avg);
        index += matchingSteps.length;
      }

      return jobDetailsPlotDataForGroup;
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

export default StepsGraph;
