'use client';

import ReactECharts from 'echarts-for-react';

interface KLineData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

interface KLineChartProps {
  data: KLineData[];
  height?: number;
}

export function KLineChart({ data, height = 400 }: KLineChartProps) {
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: ['K线', '成交量'],
      top: 10,
    },
    grid: [
      {
        left: '10%',
        right: '10%',
        top: '15%',
        height: '50%',
      },
      {
        left: '10%',
        right: '10%',
        top: '70%',
        height: '15%',
      },
    ],
    xAxis: [
      {
        type: 'category',
        data: data.map((item) => item.date),
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        min: 'dataMin',
        max: 'dataMax',
      },
      {
        type: 'category',
        gridIndex: 1,
        data: data.map((item) => item.date),
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        min: 'dataMin',
        max: 'dataMax',
      },
    ],
    yAxis: [
      {
        scale: true,
        splitArea: {
          show: true,
        },
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
    ],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0, 1],
        start: 50,
        end: 100,
      },
      {
        show: true,
        xAxisIndex: [0, 1],
        type: 'slider',
        top: '90%',
        start: 50,
        end: 100,
      },
    ],
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: data.map((item) => [item.open, item.close, item.low, item.high]),
        itemStyle: {
          color: '#ef5350',
          color0: '#26a69a',
          borderColor: '#ef5350',
          borderColor0: '#26a69a',
        },
      },
      {
        name: '成交量',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: data.map((item) => ({
          value: item.volume,
          itemStyle: {
            color: item.close >= item.open ? '#ef5350' : '#26a69a',
          },
        })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} />;
}
