'use client';

import { Card, Table, Button, Space, Row, Col, Statistic, Tag, Segmented, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined } from '@ant-design/icons';
import useSWR from 'swr';
import apiClient from '@/lib/api';
import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/common/PageChrome';
import { compareNumber, compareText } from '@/lib/table-sorters';

type Period = '' | '1w' | '2w' | '3w' | '1m' | '2m' | '3m' | '4m' | '6m' | '12m';

interface UseLimitCountParams {
  period?: Period;
}

function useLimitUpCount(params: UseLimitCountParams) {
  const query = new URLSearchParams();
  if (params.period) query.append('period', params.period);

  const fetcher = async (url: string) => apiClient.get(url);

  return useSWR(
    `/api/v1/top-gainers/limit-up-count?${query.toString()}`,
    fetcher,
    { revalidateOnFocus: false, onError: () => {} },
  );
}

function useLimitDownCount(params: UseLimitCountParams) {
  const query = new URLSearchParams();
  if (params.period) query.append('period', params.period);

  const fetcher = async (url: string) => apiClient.get(url);

  return useSWR(
    `/api/v1/top-gainers/limit-down-count?${query.toString()}`,
    fetcher,
    { revalidateOnFocus: false, onError: () => {} },
  );
}

const periodOptions: { key: Period; label: string }[] = [
  { key: '', label: '今日' },
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

type LimitRow = {
  dm: string;
  mc: string;
  count: number;
  latestDate: string;
};

const { Text } = Typography;

export default function LimitStatsPage() {
  const [period, setPeriod] = useState<Period>('');

  const { data: limitUpData, isLoading: limitUpLoading, mutate: mutateLimitUp } = useLimitUpCount({ period });
  const { data: limitDownData, isLoading: limitDownLoading, mutate: mutateLimitDown } = useLimitDownCount({ period });
  const limitUpList: LimitRow[] = limitUpData?.list || [];
  const limitDownList: LimitRow[] = limitDownData?.list || [];
  const activePeriod = periodOptions.find((option) => option.key === period) || periodOptions[0];
  const limitUpTotal = limitUpList.reduce((sum, row) => sum + (row.count || 0), 0);
  const limitDownTotal = limitDownList.reduce((sum, row) => sum + (row.count || 0), 0);
  const limitNet = limitUpTotal - limitDownTotal;
  const leadingUp = limitUpList[0];
  const leadingDown = limitDownList[0];

  const limitUpColumns = [
    {
      title: '排名',
      key: 'index',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '股票',
      key: 'stock',
      sorter: (a: LimitRow, b: LimitRow) => compareText(a.mc, b.mc),
      render: (_: unknown, record: LimitRow) => (
        <Space direction="vertical" size={0}>
          <Link href={`/stocks/${record.dm}`} className="font-semibold hover:text-red-600">
            {record.mc || record.dm}
          </Link>
          <span className="text-xs text-slate-500">{record.dm}</span>
        </Space>
      ),
    },
    {
      title: '涨停次数',
      dataIndex: 'count',
      key: 'count',
      width: 120,
      render: (value: number) => (
        <span className="text-red-500 font-bold">
          <ArrowUpOutlined /> {value} 次
        </span>
      ),
      sorter: (a: LimitRow, b: LimitRow) => compareNumber(a.count, b.count),
    },
    {
      title: '最后涨停日期',
      dataIndex: 'latestDate',
      key: 'latestDate',
      width: 120,
    },
  ];

  const limitDownColumns = [
    {
      title: '排名',
      key: 'index',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '股票',
      key: 'stock',
      sorter: (a: LimitRow, b: LimitRow) => compareText(a.mc, b.mc),
      render: (_: unknown, record: LimitRow) => (
        <Space direction="vertical" size={0}>
          <Link href={`/stocks/${record.dm}`} className="font-semibold hover:text-green-700">
            {record.mc || record.dm}
          </Link>
          <span className="text-xs text-slate-500">{record.dm}</span>
        </Space>
      ),
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
      sorter: (a: LimitRow, b: LimitRow) => compareNumber(a.count, b.count),
    },
    {
      title: '最后跌停日期',
      dataIndex: 'latestDate',
      key: 'latestDate',
      width: 120,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Limit Statistics"
        title="涨跌统计"
        description="按选定区间统计涨停与跌停次数，双榜对比市场强弱与极端波动股票。"
      />

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-rose-950 via-slate-950 to-emerald-950 text-white shadow-lg">
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} lg={10}>
            <Space direction="vertical" size={12}>
              <Tag color={limitNet >= 0 ? 'red' : 'green'}>{activePeriod.label}</Tag>
              <div className="text-3xl font-semibold leading-tight md:text-4xl">
                用涨停与跌停次数拆解市场热度
              </div>
              <div className="max-w-xl text-sm leading-6 text-slate-300">
                统一区间同时刷新涨停榜与跌停榜，避免两张表使用不同口径导致误判。
              </div>
            </Space>
          </Col>
          <Col xs={24} lg={14}>
            <Row gutter={[12, 12]}>
              <Col xs={12} md={6}>
                <Statistic title={<span className="text-slate-300">涨停股票</span>} value={limitUpList.length} valueStyle={{ color: '#fb7185' }} />
              </Col>
              <Col xs={12} md={6}>
                <Statistic title={<span className="text-slate-300">跌停股票</span>} value={limitDownList.length} valueStyle={{ color: '#4ade80' }} />
              </Col>
              <Col xs={12} md={6}>
                <Statistic title={<span className="text-slate-300">涨停次数</span>} value={limitUpTotal} valueStyle={{ color: '#f87171' }} />
              </Col>
              <Col xs={12} md={6}>
                <Statistic title={<span className="text-slate-300">强弱差</span>} value={limitNet} prefix={limitNet >= 0 ? '+' : undefined} valueStyle={{ color: limitNet >= 0 ? '#fb7185' : '#4ade80' }} />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card>
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Segmented
            value={period}
            options={periodOptions.map((option) => ({ label: option.label, value: option.key }))}
            onChange={(value) => setPeriod(value as Period)}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              mutateLimitUp();
              mutateLimitDown();
            }}
          >
            刷新双榜
          </Button>
        </div>

        <Row gutter={[16, 16]} className="mb-5">
          <Col xs={24} lg={12}>
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <Text type="secondary">涨停榜首</Text>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <div className="text-xl font-semibold text-slate-950">{leadingUp?.mc || '—'}</div>
                  <div className="text-xs text-slate-500">{leadingUp?.dm || '暂无数据'}</div>
                </div>
                <div className="text-3xl font-bold text-red-500">
                  {leadingUp ? `${leadingUp.count}次` : '—'}
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} lg={12}>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <Text type="secondary">跌停榜首</Text>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <div className="text-xl font-semibold text-slate-950">{leadingDown?.mc || '—'}</div>
                  <div className="text-xs text-slate-500">{leadingDown?.dm || '暂无数据'}</div>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {leadingDown ? `${leadingDown.count}次` : '—'}
                </div>
              </div>
            </div>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card title="涨停统计" extra={<Tag color="red">{activePeriod.label}</Tag>}>
              <Table
                columns={limitUpColumns}
                dataSource={limitUpList}
                loading={limitUpLoading}
                rowKey="dm"
                pagination={{
                  pageSize: 15,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条`,
                }}
                scroll={{ x: 620 }}
              />
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="跌停统计" extra={<Tag color="green">{activePeriod.label}</Tag>}>
              <Table
                columns={limitDownColumns}
                dataSource={limitDownList}
                loading={limitDownLoading}
                rowKey="dm"
                pagination={{
                  pageSize: 15,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条`,
                }}
                scroll={{ x: 620 }}
              />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
