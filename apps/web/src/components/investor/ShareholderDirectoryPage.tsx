'use client';

import { Card, Table, Input, Button, Space, Select, Row, Col, Tag, Typography, Statistic } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useInvestors, type InvestorCategory } from '@/hooks/useInvestors';
import {
  useHiddenShareholdersInGainers,
  useHiddenShareholdersInLimitUp,
  type HiddenShareholderRow,
} from '@/hooks/useNaturalPersonHolders';
import type { GainerPeriod } from '@/hooks/useTopGainers';
import { FilterBar, PageHeader } from '@/components/common/PageChrome';

const { Text } = Typography;

const teteguPeriods: Array<{ key: Exclude<GainerPeriod, ''>; label: string }> = [
  { key: '1w', label: '1周' },
  { key: '2w', label: '2周' },
  { key: '3w', label: '3周' },
  { key: '1m', label: '1月' },
  { key: '2m', label: '2月' },
  { key: '3m', label: '3月' },
  { key: '4m', label: '4月' },
];

function formatMarketValue(value?: number | null) {
  if (!value) return '—';
  if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
  return `${(value / 10000).toFixed(2)}万`;
}

interface ShareholderDirectoryPageProps {
  category: InvestorCategory;
  entityName: string;
  basePath: string;
}

export function ShareholderDirectoryPage({
  category,
  entityName,
  basePath,
}: ShareholderDirectoryPageProps) {
  const [gainerPeriod, setGainerPeriod] = useState<Exclude<GainerPeriod, ''>>('1m');
  const [limitUpPeriod, setLimitUpPeriod] = useState<Exclude<GainerPeriod, ''>>('1m');
  const [params, setParams] = useState({
    page: 1,
    page_size: 20,
    sort: 'totalMarketValue',
    order: 'desc' as 'asc' | 'desc',
    keyword: '',
  });

  const { data, isLoading, mutate } = useInvestors({
    ...params,
    category,
  });
  const {
    data: hiddenInGainers,
    isLoading: hiddenInGainersLoading,
    mutate: mutateHiddenInGainers,
  } = useHiddenShareholdersInGainers(gainerPeriod, 12, 120, category);
  const {
    data: hiddenInLimitUp,
    isLoading: hiddenInLimitUpLoading,
    mutate: mutateHiddenInLimitUp,
  } = useHiddenShareholdersInLimitUp(limitUpPeriod, 12, 120, category);

  const list = data?.list || [];
  const pageMarketValue = list.reduce((sum, item) => sum + (item.totalMarketValue || 0), 0);
  const maxStockCount = list.reduce((max, item) => Math.max(max, item.stockCount || 0), 0);
  const leadingHolder = list[0];

  const getSortOrder = (field: string): 'ascend' | 'descend' | null => {
    if (params.sort !== field) {
      return null;
    }

    return params.order === 'asc' ? 'ascend' : 'descend';
  };

  const columns = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_: unknown, __: unknown, index: number) =>
        (params.page - 1) * params.page_size + index + 1,
    },
    {
      title: `${entityName}名称`,
      dataIndex: 'name',
      key: 'name',
      sorter: { multiple: 1 },
      sortOrder: getSortOrder('name'),
      render: (name: string, record: { id: number }) => (
        <Link href={`${basePath}/${record.id}`}>
          {name}
        </Link>
      ),
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 80,
      render: (avatar: string | null, record: { name: string }) => {
        if (!avatar) return '—';
        return (
          <Image
            src={avatar}
            alt={record.name}
            width={40}
            height={40}
            unoptimized
            className="w-10 h-10 rounded-full object-cover"
          />
        );
      },
    },
    {
      title: '持仓数量',
      dataIndex: 'stockCount',
      key: 'stockCount',
      sorter: { multiple: 1 },
      sortOrder: getSortOrder('stockCount'),
    },
    {
      title: '总市值',
      dataIndex: 'totalMarketValue',
      key: 'totalMarketValue',
      sorter: { multiple: 1 },
      sortOrder: getSortOrder('totalMarketValue'),
      render: (value: number) => formatMarketValue(value),
    },
    {
      title: '简介',
      dataIndex: 'bio',
      key: 'bio',
      ellipsis: true,
      render: (bio: string | null) => bio || '—',
    },
  ];

  const hiddenColumns = [
    {
      title: entityName,
      dataIndex: 'shareholderName',
      key: 'shareholderName',
      width: 180,
      render: (name: string, record: HiddenShareholderRow) => (
        <div className="flex flex-col">
          <Link href={`${basePath}/${record.investorId}`} className="font-medium hover:text-blue-600">
            {name}
          </Link>
          <Text type="secondary">总持仓 {record.stockCount} 只</Text>
        </div>
      ),
    },
    {
      title: '命中股票数',
      dataIndex: 'matchedStockCount',
      key: 'matchedStockCount',
      width: 100,
      render: (value: number) => <span className="font-semibold text-slate-800">{value}</span>,
    },
    {
      title: '命中持仓市值',
      dataIndex: 'matchedMarketValue',
      key: 'matchedMarketValue',
      width: 130,
      render: (value: number) => (
        <span className="font-semibold text-red-600">{formatMarketValue(value)}</span>
      ),
    },
    {
      title: '覆盖股票',
      dataIndex: 'matchedStocks',
      key: 'matchedStocks',
      render: (stocks: HiddenShareholderRow['matchedStocks']) => (
        <div className="flex flex-wrap gap-2">
          {stocks.slice(0, 4).map((stock) => (
            <Tag key={`${stock.stockCode}-${stock.reportDate}`} className="mr-0">
              {stock.stockName} {stock.sourceMetricLabel}
            </Tag>
          ))}
          {stocks.length > 4 && <Tag className="mr-0">+{stocks.length - 4}</Tag>}
        </div>
      ),
    },
    {
      title: `${entityName}总市值`,
      dataIndex: 'totalMarketValue',
      key: 'totalMarketValue',
      width: 120,
      render: (value: number) => formatMarketValue(value),
    },
    {
      title: '最新报告期',
      dataIndex: 'latestReportDate',
      key: 'latestReportDate',
      width: 110,
    },
  ];

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    const sortFieldMap: Record<string, string> = {
      totalMarketValue: 'totalMarketValue',
      stockCount: 'stockCount',
      name: 'name',
    };

    const nextSort = sorter?.field ? sortFieldMap[String(sorter.field)] ?? params.sort : params.sort;
    const nextOrder = sorter?.order === 'ascend'
      ? 'asc'
      : sorter?.order === 'descend'
        ? 'desc'
        : nextSort === 'name'
          ? 'asc'
          : 'desc';

    setParams((current) => ({
      ...current,
      page: pagination.current,
      page_size: pagination.pageSize,
      sort: nextSort,
      order: nextOrder,
    }));
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        eyebrow={category === 'personal' ? 'Personal Shareholders' : 'Institution Holders'}
        title={`${entityName}列表`}
        description={`基于当前激活业务数据源的最新持仓快照，按持仓市值、持仓数量与强势股命中情况筛选${entityName}。`}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Card className="bg-gradient-to-br from-slate-950 to-slate-800 text-white">
            <Statistic title={<span className="text-slate-300">主体总数</span>} value={data?.meta?.total || 0} valueStyle={{ color: '#fff' }} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="当前页持仓市值" value={formatMarketValue(pageMarketValue)} />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="最高持仓数量" value={maxStockCount} suffix="只" />
          </Card>
        </Col>
        <Col xs={24} md={6}>
          <Card>
            <Statistic title="当前榜首" value={leadingHolder?.name || '—'} />
            <Text type="secondary">按最新快照与当前排序计算</Text>
          </Card>
        </Col>
      </Row>

      <Card
        title={`强势股里隐藏的${entityName}`}
        extra={
          <Button
            size="small"
            onClick={() => {
              mutateHiddenInGainers();
              mutateHiddenInLimitUp();
            }}
          >
            刷新榜单
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card
              size="small"
              title={`最近涨幅最大股票中隐藏的${entityName}`}
              bordered={false}
              className="bg-slate-50"
            >
              <Space wrap className="mb-3">
                {teteguPeriods.map((period) => (
                  <Button
                    key={period.key}
                    size="small"
                    type={gainerPeriod === period.key ? 'primary' : 'default'}
                    onClick={() => setGainerPeriod(period.key)}
                  >
                    {period.label}
                  </Button>
                ))}
              </Space>
              <Text type="secondary" className="mb-3 block">
                从近 {gainerPeriod} 的强势股池中，反查最新业务持仓快照里的已跟踪{entityName}。
              </Text>
              <Table
                columns={hiddenColumns}
                dataSource={hiddenInGainers?.list || []}
                loading={hiddenInGainersLoading}
                rowKey={(record) => `gainer-${record.investorId}`}
                pagination={false}
                size="small"
                scroll={{ x: 900 }}
              />
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card
              size="small"
              title={`最近涨停板中隐藏的${entityName}`}
              bordered={false}
              className="bg-orange-50"
            >
              <Space wrap className="mb-3">
                {teteguPeriods.map((period) => (
                  <Button
                    key={period.key}
                    size="small"
                    type={limitUpPeriod === period.key ? 'primary' : 'default'}
                    onClick={() => setLimitUpPeriod(period.key)}
                  >
                    {period.label}
                  </Button>
                ))}
              </Space>
              <Text type="secondary" className="mb-3 block">
                从近 {limitUpPeriod} 的涨停强势股池中，反查最新业务持仓快照里的已跟踪{entityName}。
              </Text>
              <Table
                columns={hiddenColumns}
                dataSource={hiddenInLimitUp?.list || []}
                loading={hiddenInLimitUpLoading}
                rowKey={(record) => `limit-${record.investorId}`}
                pagination={false}
                size="small"
                scroll={{ x: 900 }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card title={`${entityName}列表`}>
        <FilterBar extra="默认按总持仓市值降序，支持表头排序">
          <Input
            placeholder={`搜索${entityName}名称`}
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            allowClear
            value={params.keyword}
            onChange={(event) =>
              setParams((current) => ({
                ...current,
                page: 1,
                keyword: event.target.value,
              }))
            }
          />
          <Select
            value={params.sort}
            style={{ width: 120 }}
            options={[
              { value: 'totalMarketValue', label: '市值' },
              { value: 'stockCount', label: '持仓数' },
              { value: 'name', label: '名称' },
            ]}
            onChange={(value) =>
              setParams((current) => ({
                ...current,
                page: 1,
                sort: value,
                order: value === 'name' ? 'asc' : 'desc',
              }))
            }
          />
          <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
            刷新
          </Button>
        </FilterBar>

        <Table
          columns={columns}
          dataSource={data?.list || []}
          loading={isLoading}
          rowKey="id"
          onChange={handleTableChange}
          pagination={{
            current: params.page,
            pageSize: params.page_size,
            total: data?.meta?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
    </Space>
  );
}
