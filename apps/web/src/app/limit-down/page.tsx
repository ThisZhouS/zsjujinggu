'use client';

import { Card, Table, Tabs, Button, Space } from 'antd';
import { ArrowDownOutlined, ReloadOutlined } from '@ant-design/icons';
import useSWR from 'swr';
import apiClient from '@/lib/api';
import { useState } from 'react';

type Period = '' | '1w' | '2w' | '3w' | '1m' | '2m' | '3m' | '4m' | '6m' | '12m';

const periodOptions: { key: Period; label: string }[] = [
  { key: '', label: '当日' },
  { key: '1w', label: '近1周' },
  { key: '2w', label: '近2周' },
  { key: '3w', label: '近3周' },
  { key: '1m', label: '近1月' },
  { key: '2m', label: '近2月' },
  { key: '3m', label: '近3月' },
  { key: '4m', label: '近4月' },
  { key: '6m', label: '半年' },
  { key: '12m', label: '一年' },
];

function useLimitDownCount(params: { period?: Period }) {
  const query = new URLSearchParams();
  if (params.period) query.append('period', params.period);
  const fetcher = async (url: string) => apiClient.get(url);
  return useSWR(
    `/api/v1/top-gainers/limit-down-count?${query.toString()}`,
    fetcher,
    { revalidateOnFocus: false, onError: () => {} },
  );
}

export default function LimitDownStatsPage() {
  const [limitDownPeriod, setLimitDownPeriod] = useState<Period>('');
  const { data: limitDownData, isLoading: limitDownLoading, mutate: mutateLimitDown } = useLimitDownCount({ period: limitDownPeriod });

  const limitDownColumns = [
    {
      title: '排名',
      key: 'index',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '股票代码',
      dataIndex: 'dm',
      key: 'dm',
      width: 100,
    },
    {
      title: '股票名称',
      dataIndex: 'mc',
      key: 'mc',
    },
    {
      title: '跌停次数',
      dataIndex: 'count',
      key: 'count',
      width: 120,
      render: (value: number) => (
        <span className="text-green-500 font-bold">
          <ArrowDownOutlined /> {value} 次
        </span>
      ),
      sorter: (a: any, b: any) => a.count - b.count,
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '最后跌停日期',
      dataIndex: 'latestDate',
      key: 'latestDate',
      width: 120,
    },
  ];

  const mainTabs = [
    {
      key: 'limit-down',
      label: '跌停次数统计',
      children: (
        <div>
          <Space className="mb-4">
            {periodOptions.map(opt => (
              <Button
                key={opt.key}
                type={limitDownPeriod === opt.key ? 'primary' : 'default'}
                onClick={() => setLimitDownPeriod(opt.key)}
              >
                {opt.label}
              </Button>
            ))}
            <Button icon={<ReloadOutlined />} onClick={() => mutateLimitDown()}>
              刷新
            </Button>
          </Space>
          <Table
            columns={limitDownColumns}
            dataSource={limitDownData?.list || []}
            loading={limitDownLoading}
            rowKey="dm"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            scroll={{ x: 600 }}
          />
        </div>
      ),
    },
  ];

  return (
    <Card title="跌停统计">
      <Tabs items={mainTabs} defaultActiveKey="limit-down" />
    </Card>
  );
}
