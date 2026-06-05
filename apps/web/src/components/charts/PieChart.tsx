'use client';

import dynamic from 'next/dynamic';

interface PieChartProps {
  data: Array<{ name: string; value: number }>;
  height?: number;
}

const ReactECharts = dynamic(() => import('echarts-for-react'), {
  ssr: false,
});

export function PieChart({ data, height = 300 }: PieChartProps) {
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        data: data.map(d => ({ name: d.name, value: d.value })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height }} />;
}
