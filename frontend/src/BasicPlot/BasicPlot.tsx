import Plotly from "plotly.js";
import { memo } from "react";
import createPlotlyComponent from "react-plotly.js/factory";

const BasicPlot = createPlotlyComponent(Plotly);

export default memo(BasicPlot);
