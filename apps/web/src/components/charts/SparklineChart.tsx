'use client';

import ReactECharts from 'echarts-for-react';

interface SparklineChartProps {
  data: number[];
  height?: number;
  color?: string;
  showArea?: boolean;
}

export function SparklineChart({
  data,
  height = 60,
  color = '#1890ff',
  showArea = true,
}: SparklineChartProps) {
  const option = {
    grid: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    xAxis: {
      type: 'category',
      data: data.map((_, i) => i),
      show: false,
    },
    yAxis: {
      type: 'value',
      show: false,
    },
    series: [
      {
        type: 'line',
        data,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          color,
          width: 2,
        },
        areaStyle: showArea
          ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: `${color}40`, // 25% opacity
                  },
                  {
                    offset: 1,
                    color: `${color}05`, // 2% opacity
                  },
                ],
              },
            }
          : undefined,
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} />;
}
