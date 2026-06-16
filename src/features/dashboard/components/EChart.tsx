import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface Props {
  option: EChartsOption;
  height?: number | string;
}

/** Wrapper fino de ECharts con tema oscuro del proyecto. */
const EChart: React.FC<Props> = ({ option, height = 320 }) => (
  <ReactECharts
    option={option}
    style={{ height, width: '100%' }}
    opts={{ renderer: 'canvas' }}
    notMerge
    lazyUpdate
  />
);

export default EChart;
