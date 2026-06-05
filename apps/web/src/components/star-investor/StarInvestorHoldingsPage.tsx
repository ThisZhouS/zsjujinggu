'use client';

import { Avatar, Card, Col, Empty, Input, Row, Select, Space, Statistic, Table, Tabs, Tag, Typography } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { PageHeader, FilterBar } from '@/components/common/PageChrome';
import {
  useStarInvestorHoldings,
  useStarInvestorTrades,
  type StarHoldingType,
  type StarInvestorHolding,
  type StarInvestorSlug,
} from '@/hooks/useStarInvestors';

const { Text } = Typography;

const holdingTypeOptions: Array<{ value: StarHoldingType; label: string }> = [
  { value: 'ALL', label: '全部' },
  { value: 'INCREASE', label: '买入/增持' },
  { value: 'DECREASE', label: '卖出/减持' },
  { value: 'KEEP', label: '持有不变' },
];

const holdingTypeMeta: Record<StarInvestorHolding['holdingType'], { color: string; text: string }> = {
  INCREASE: { color: 'red', text: '买入/增持' },
  DECREASE: { color: 'green', text: '卖出/减持' },
  KEEP: { color: 'default', text: '持有不变' },
  UNKNOWN: { color: 'default', text: '未知' },
};

function formatMoney(value?: number | null) {
  if (value == null) return '—';
  if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
  if (value >= 10000) return `${(value / 10000).toFixed(2)}万`;
  return value.toFixed(2);
}

function formatShares(value?: number | null) {
  if (value == null) return '—';
  const abs = Math.abs(value);
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  if (abs >= 100000000) return `${sign}${(abs / 100000000).toFixed(2)}亿股`;
  if (abs >= 10000) return `${sign}${(abs / 10000).toFixed(2)}万股`;
  return `${sign}${abs.toFixed(0)}股`;
}

function formatPercent(value?: number | null) {
  if (value == null) return '—';
  return `${(value * 100).toFixed(2)}%`;
}

interface StarInvestorHoldingsPageProps {
  slug: StarInvestorSlug;
  title: string;
  eyebrow: string;
  fallbackDescription: string;
}

export function StarInvestorHoldingsPage({
  slug,
  title,
  eyebrow,
  fallbackDescription,
}: StarInvestorHoldingsPageProps) {
  const [params, setParams] = useState({
    page: 1,
    page_size: 20,
    holdingType: 'ALL' as StarHoldingType,
    keyword: '',
  });
  const [tradeParams, setTradeParams] = useState({
    page: 1,
    page_size: 20,
    holdingType: 'ALL' as StarHoldingType,
    keyword: '',
  });

  const { data, isLoading } = useStarInvestorHoldings(slug, params);
  const { data: tradeData, isLoading: isTradeLoading } = useStarInvestorTrades(slug, tradeParams);
  const investor = data?.investor;

  const createColumns = (page: number, pageSize: number, includePreviousHolding: boolean) => {
    const baseColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 70,
      render: (_: unknown, __: unknown, index: number) =>
        (page - 1) * pageSize + index + 1,
    },
    {
      title: '股票',
      dataIndex: 'stockName',
      key: 'stockName',
      width: 220,
      render: (value: string, record: StarInvestorHolding) => (
        <Space>
          {record.iconUrl ? <Avatar size={28} src={record.iconUrl} /> : <Avatar size={28}>{record.stockCode.slice(0, 1)}</Avatar>}
          <Space direction="vertical" size={0}>
            <span className="font-medium text-slate-900">{value}</span>
            <Text type="secondary">{record.stockCode}{record.instrumentCode ? ` / ${record.instrumentCode}` : ''}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: '买卖方向',
      dataIndex: 'holdingType',
      key: 'holdingType',
      width: 110,
      render: (value: StarInvestorHolding['holdingType']) => {
        const meta = holdingTypeMeta[value] || holdingTypeMeta.UNKNOWN;
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    {
      title: '交易数量',
      dataIndex: 'tradeQuantity',
      key: 'tradeQuantity',
      width: 130,
      render: (value: number | null) => (
        <span className={value != null && value > 0 ? 'text-red-600' : value != null && value < 0 ? 'text-green-600' : ''}>
          {formatShares(value)}
        </span>
      ),
    },
    {
      title: '上期持仓',
      dataIndex: 'previousHoldingQuantity',
      key: 'previousHoldingQuantity',
      width: 130,
      render: (value: number | null) => formatShares(value),
    },
    {
      title: '当前持仓',
      dataIndex: 'holdingQuantity',
      key: 'holdingQuantity',
      width: 130,
      render: (value: number | null) => <span className="font-semibold">{formatShares(value)}</span>,
    },
    {
      title: '组合占比',
      dataIndex: 'proportion',
      key: 'proportion',
      width: 110,
      render: (value: number | null) => formatPercent(value),
    },
    {
      title: '报告日市值',
      dataIndex: 'reportMarketValue',
      key: 'reportMarketValue',
      width: 130,
      render: (value: number | null) => formatMoney(value),
    },
    {
      title: '交易均价',
      dataIndex: 'tradePrice',
      key: 'tradePrice',
      width: 110,
      render: (value: number | null) => value == null ? '—' : value.toFixed(2),
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 160,
      render: (value: string | null) => value || '—',
    },
    {
      title: '报告日期',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 120,
      render: (value: string | null) => value || '—',
    },
    ];

    return includePreviousHolding
      ? baseColumns
      : baseColumns.filter((column) => column.key !== 'previousHoldingQuantity');
  };

  const columns = createColumns(params.page, params.page_size, true);
  const tradeColumns = createColumns(tradeParams.page, tradeParams.page_size, false);

  const filterControls = (
    <>
      <Input
        placeholder="搜索股票代码 / 名称 / 行业"
        prefix={<SearchOutlined />}
        allowClear
        style={{ width: 260 }}
        value={params.keyword}
        onChange={(event) => {
          const keyword = event.target.value;
          setParams((current) => ({
            ...current,
            page: 1,
            keyword,
          }));
          setTradeParams((current) => ({
            ...current,
            page: 1,
            keyword,
          }));
        }}
      />
      <Select
        value={params.holdingType}
        options={holdingTypeOptions}
        style={{ width: 140 }}
        onChange={(value) => {
          setParams((current) => ({
            ...current,
            page: 1,
            holdingType: value,
          }));
          setTradeParams((current) => ({
            ...current,
            page: 1,
            holdingType: value,
          }));
        }}
      />
    </>
  );

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={investor?.description || fallbackDescription}
        extra={investor?.sourceUrl ? (
          <a href={investor.sourceUrl} target="_blank" rel="noreferrer" className="text-white underline underline-offset-4">
            数据来源 TradingKey
          </a>
        ) : null}
      />

      {investor ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Card>
              <Statistic title="报告期" value={investor.period} />
              <Text type="secondary">报告日期 {investor.reportDate || '—'}</Text>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic title="持仓股票数" value={investor.holdingStockCount ?? 0} suffix="只" />
              <Text type="secondary">当前已抓取 {data?.meta.total ?? 0} 条明细</Text>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic title="报告持仓市值" value={formatMoney(investor.holdingValue)} />
              <Text type="secondary">前十占比 {formatPercent(investor.topTenPercent)}</Text>
            </Card>
          </Col>
          <Col xs={24} md={6}>
            <Card>
              <Statistic title="最大增/减持" value={investor.topIncreaseCode || '—'} />
              <Text type="secondary">减持 {investor.topDecreaseCode || '—'}</Text>
            </Card>
          </Col>
        </Row>
      ) : (
        <Card>
          <Empty description="暂无持仓数据，请先执行 TradingKey 明星投资人持仓同步" />
        </Card>
      )}

      <FilterBar extra={`最近抓取：${investor?.scrapedAt ? new Date(investor.scrapedAt).toLocaleString('zh-CN') : '—'}`}>
        {filterControls}
      </FilterBar>

      <Card>
        <Tabs
          items={[
            {
              key: 'holdings',
              label: `当前持仓 ${data?.meta.total ?? 0}`,
              children: (
                <Table
                  columns={columns}
                  dataSource={data?.list || []}
                  loading={isLoading}
                  rowKey={(record) => `holding-${record.id}`}
                  scroll={{ x: 1320 }}
                  pagination={{
                    current: params.page,
                    pageSize: params.page_size,
                    total: data?.meta.total || 0,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                  }}
                  onChange={(pagination) => setParams((current) => ({
                    ...current,
                    page: pagination.current || 1,
                    page_size: pagination.pageSize || current.page_size,
                  }))}
                />
              ),
            },
            {
              key: 'trades',
              label: `买卖记录 ${tradeData?.meta.total ?? 0}`,
              children: (
                <Table
                  columns={tradeColumns}
                  dataSource={tradeData?.list || []}
                  loading={isTradeLoading}
                  rowKey={(record) => `trade-${record.id}`}
                  scroll={{ x: 1200 }}
                  pagination={{
                    current: tradeParams.page,
                    pageSize: tradeParams.page_size,
                    total: tradeData?.meta.total || 0,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                  }}
                  onChange={(pagination) => setTradeParams((current) => ({
                    ...current,
                    page: pagination.current || 1,
                    page_size: pagination.pageSize || current.page_size,
                  }))}
                />
              ),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
