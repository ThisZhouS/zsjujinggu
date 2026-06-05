'use client';

import { Card, Table, Button, Space, Input, Row, Col, Statistic, Tag } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { useTopGainers } from '@/hooks/useTopGainers';
import { useState } from 'react';
import Link from 'next/link';
import { FilterBar, PageHeader } from '@/components/common/PageChrome';
import { compareNumber, compareText } from '@/lib/table-sorters';

export default function TopGainersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const { data, isLoading, mutate } = useTopGainers({
    page,
    page_size: pageSize,
    keyword,
  });
  const list = data?.list || [];
  const topThree = list.slice(0, 3);
  const averageChange = list.length
    ? list.reduce((sum, item) => sum + (item.changePercent || 0), 0) / list.length
    : 0;
  const positiveCount = list.filter((item) => (item.changePercent || 0) >= 0).length;
  const negativeCount = list.length - positiveCount;

  const columns = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_: any, __: any, index: number) => (page - 1) * pageSize + index + 1,
    },
    {
      title: '股票',
      key: 'stock',
      width: 180,
      sorter: (a: any, b: any) => compareText(a.name, b.name),
      render: (_: unknown, record: any) => (
        <Space direction="vertical" size={0}>
          <Link href={`/stocks/${record.code}`} className="font-semibold hover:text-teal-700">
            {record.name}
          </Link>
          <span className="text-xs text-slate-500">{record.code}</span>
        </Space>
      ),
    },
    {
      title: '现价',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      sorter: (a: any, b: any) => compareNumber(a.currentPrice, b.currentPrice),
      render: (value: number) => value?.toFixed(2) || '—',
    },
    {
      title: '涨幅',
      dataIndex: 'changePercent',
      key: 'changePercent',
      sorter: (a: any, b: any) => compareNumber(a.changePercent, b.changePercent),
      defaultSortOrder: 'descend' as const,
      render: (value: number) => (
        <span className={value >= 0 ? 'text-red-500' : 'text-green-500'}>
          {value >= 0 ? '+' : ''}{value?.toFixed(2)}%
        </span>
      ),
    },
    {
      title: '涨跌',
      dataIndex: 'change',
      key: 'change',
      sorter: (a: any, b: any) => compareNumber(a.change, b.change),
      render: (value: number) => (
        <span className={value >= 0 ? 'text-red-500' : 'text-green-500'}>
          {value >= 0 ? '+' : ''}{value?.toFixed(2)}
        </span>
      ),
    },
    {
      title: '换手率',
      dataIndex: 'turnover',
      key: 'turnover',
      sorter: (a: any, b: any) => compareNumber(a.turnover, b.turnover),
      render: (value: number) => value ? `${value.toFixed(2)}%` : '—',
    },
    {
      title: '成交量',
      dataIndex: 'volume',
      key: 'volume',
      sorter: (a: any, b: any) => compareNumber(a.volume, b.volume),
      render: (value: number) => value ? `${(value / 10000).toFixed(2)}万` : '—',
    },
    {
      title: '成交额',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a: any, b: any) => compareNumber(a.amount, b.amount),
      render: (value: number) => {
        if (!value) return '—';
        if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
        return `${(value / 10000).toFixed(2)}万`;
      },
    },
    {
      title: '市值',
      dataIndex: 'marketCap',
      key: 'marketCap',
      sorter: (a: any, b: any) => compareNumber(a.marketCap, b.marketCap),
      render: (value: number) => {
        if (!value) return '—';
        return `${(value / 100000000).toFixed(2)}亿`;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Market Ranking"
        title="涨幅榜"
        description="按今日涨幅筛选全 A 股，使用当前业务数据源的最新行情展示价格、成交与市值。"
      />

      <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-slate-900 to-stone-900 text-white shadow-lg">
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} lg={10}>
            <Space direction="vertical" size={12}>
              <Tag color="gold">今日涨幅</Tag>
              <div className="text-3xl font-semibold leading-tight md:text-4xl">
                追踪今日强势股的价格、成交与市值变化
              </div>
              <div className="max-w-xl text-sm leading-6 text-slate-300">
                榜单数据来自后端最新业务数据源。页面只展示今日涨幅排名，避免混入历史周期口径。
              </div>
            </Space>
          </Col>
          <Col xs={24} lg={14}>
            <Row gutter={[12, 12]}>
              <Col xs={12} md={6}>
                <Statistic title={<span className="text-slate-300">总记录</span>} value={data?.meta?.total || 0} valueStyle={{ color: '#fff' }} />
              </Col>
              <Col xs={12} md={6}>
                <Statistic title={<span className="text-slate-300">当前页均涨幅</span>} value={averageChange} precision={2} suffix="%" valueStyle={{ color: '#f87171' }} />
              </Col>
              <Col xs={12} md={6}>
                <Statistic title={<span className="text-slate-300">上涨</span>} value={positiveCount} valueStyle={{ color: '#fb7185' }} />
              </Col>
              <Col xs={12} md={6}>
                <Statistic title={<span className="text-slate-300">下跌</span>} value={negativeCount} valueStyle={{ color: '#4ade80' }} />
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card>
        <FilterBar extra="字段按股票、价格、涨跌、成交、市值排序，支持服务端分页与表头排序">
          <Input
            placeholder="搜索股票代码 / 名称"
            prefix={<SearchOutlined />}
            allowClear
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
            style={{ width: 260 }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
            刷新
          </Button>
          <Button
          onClick={() => {
            setKeyword('');
            setPage(1);
            setPageSize(20);
          }}
          >
            重置
          </Button>
        </FilterBar>

        <Row gutter={[16, 16]} className="mb-5">
          {topThree.map((stock, index) => (
            <Col xs={24} md={8} key={stock.code}>
              <Link href={`/stocks/${stock.code}`} className="block rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 transition hover:border-red-300 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Tag color={index === 0 ? 'red' : index === 1 ? 'orange' : 'gold'}>TOP {index + 1}</Tag>
                    <div className="mt-3 text-lg font-semibold text-slate-950">{stock.name}</div>
                    <div className="text-xs text-slate-500">{stock.code}</div>
                  </div>
                  <div className={stock.changePercent >= 0 ? 'text-right text-red-500' : 'text-right text-green-600'}>
                    <div className="text-2xl font-bold">
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent?.toFixed(2)}%
                    </div>
                    <div className="text-sm">现价 {stock.currentPrice?.toFixed(2) || '—'}</div>
                  </div>
                </div>
              </Link>
            </Col>
          ))}
        </Row>

        <Table
          columns={columns}
          dataSource={list}
          loading={isLoading}
          rowKey="code"
          pagination={{
            current: page,
            pageSize,
            total: data?.meta?.total || 0,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>
    </div>
  );
}
