'use client';

import { Alert, Button, Card, DatePicker, Input, Space, Table, Typography } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useState } from 'react';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import {
  HoldingChangeItem,
  HoldingNewStockAggregateItem,
  useHoldingsChange,
} from '@/hooks/useHoldings';
import { FilterBar, PageHeader } from '@/components/common/PageChrome';
import { VipFeatureBlockedState } from '@/components/paywall/VipFeatureBlockedState';
import { isVipRequiredError } from '@/lib/api-error';

const { Text } = Typography;

export type HoldingType = 'increase' | 'decrease' | 'new';
type NewViewMode = 'detail' | 'stock';

interface HoldingChangePageProps {
  initialType: HoldingType;
}

function formatMoney(value?: number | null) {
  if (value == null) return '—';
  if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
  if (value >= 10000) return `${(value / 10000).toFixed(2)}万`;
  return value.toFixed(2);
}

function getTableTitle(holdingType: HoldingType) {
  if (holdingType === 'increase') return '牛散增持';
  if (holdingType === 'decrease') return '牛散减持';
  return '牛散新进持仓';
}

export function HoldingChangePage({ initialType }: HoldingChangePageProps) {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [reportDate, setReportDate] = useState<string | undefined>(undefined);
  const [holdingType, setHoldingType] = useState<HoldingType>(initialType);
  const [viewMode, setViewMode] = useState<NewViewMode>(
    initialType === 'new' ? 'stock' : 'detail',
  );

  const { data, error, isLoading, mutate } = useHoldingsChange({
    page,
    page_size: 20,
    keyword: keyword || undefined,
    reportDate,
    type: holdingType,
    mode: holdingType === 'new' ? viewMode : undefined,
  });

  if (isVipRequiredError(error)) {
    return (
      <VipFeatureBlockedState
        featureName="牛散增减持分析"
        description="查看牛散增持、减持和新进持仓榜单需要登录后访问。"
      />
    );
  }

  const detailColumns: ColumnsType<HoldingChangeItem> = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_: unknown, __: HoldingChangeItem, index: number) => (page - 1) * 20 + index + 1,
    },
    {
      title: '牛散',
      dataIndex: 'investorName',
      key: 'investorName',
      width: 140,
      render: (value: string, record: HoldingChangeItem) => (
        <Space direction="vertical" size={0}>
          <Link href={`/investors/${record.investorId}`} className="font-semibold hover:text-blue-600">
            {value}
          </Link>
          <Text type="secondary">ID {record.investorId}</Text>
        </Space>
      ),
    },
    {
      title: '股票',
      key: 'stock',
      width: 180,
      render: (_: unknown, record: HoldingChangeItem) => (
        <Space direction="vertical" size={0}>
          <Link href={`/stocks/${record.stockCode}`} className="font-medium hover:text-blue-600">
            {record.stockName}
          </Link>
          <Text type="secondary">{record.stockCode}</Text>
        </Space>
      ),
    },
    {
      title: '现价',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 100,
      render: (value: number) => value?.toFixed(2) || '—',
    },
    {
      title: holdingType === 'decrease' ? '平均减持均价' : '平均增持均价',
      dataIndex: 'averageChangePrice',
      key: 'averageChangePrice',
      width: 130,
      render: (value: number | null, record: HoldingChangeItem) => (
        <Space direction="vertical" size={0}>
          <span>{value != null ? value.toFixed(2) : '—'}</span>
          <Text type="secondary">{record.averageChangePriceDate || '—'}</Text>
        </Space>
      ),
    },
    {
      title: '当前持股',
      dataIndex: 'currentShares',
      key: 'currentShares',
      width: 120,
      render: (value: number) => value ? `${(value / 10000).toFixed(2)}万股` : '—',
    },
    {
      title: '上期持股',
      dataIndex: 'previousShares',
      key: 'previousShares',
      width: 120,
      render: (value: number | null) => value != null ? `${(value / 10000).toFixed(2)}万股` : '—',
    },
    {
      title: '持仓变化',
      dataIndex: 'changeShares',
      key: 'changeShares',
      width: 120,
      render: (value: number) => (
        <span className={value >= 0 ? 'text-red-500' : 'text-green-600'}>
          {value >= 0 ? '+' : ''}{value ? (value / 10000).toFixed(2) : '0'}万股
        </span>
      ),
    },
    {
      title: '变化比例',
      dataIndex: 'changePercent',
      key: 'changePercent',
      width: 110,
      render: (value: number | null) => value == null ? '—' : (
        <span className={value >= 0 ? 'text-red-500' : 'text-green-600'}>
          {value >= 0 ? '+' : ''}{value.toFixed(2)}%
        </span>
      ),
    },
    {
      title: '变化市值',
      dataIndex: 'changeMarketValue',
      key: 'changeMarketValue',
      width: 130,
      render: (value: number) => formatMoney(value),
    },
    {
      title: '持仓市值',
      dataIndex: 'totalMarketValue',
      key: 'totalMarketValue',
      width: 130,
      render: (value: number) => formatMoney(value),
    },
    {
      title: '主营收入',
      dataIndex: 'mainRevenue',
      key: 'mainRevenue',
      width: 150,
      render: (value: number | null, record: HoldingChangeItem) => (
        <Space direction="vertical" size={0}>
          <span>{formatMoney(value)}</span>
          <Text type="secondary">{record.revenueReportDate || '—'}</Text>
        </Space>
      ),
    },
    {
      title: '报告期',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 120,
      render: (value: string) => value ? dayjs(value).format('YYYY-MM-DD') : '—',
    },
  ];

  const stockColumns: ColumnsType<HoldingNewStockAggregateItem> = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_: unknown, __: HoldingNewStockAggregateItem, index: number) =>
        (page - 1) * 20 + index + 1,
    },
    {
      title: '股票',
      key: 'stock',
      width: 220,
      render: (_: unknown, record: HoldingNewStockAggregateItem) => (
        <Space direction="vertical" size={0}>
          <Link href={`/stocks/${record.stockCode}`} className="font-medium hover:text-blue-600">
            {record.stockName}
          </Link>
          <Text type="secondary">{record.stockCode}</Text>
        </Space>
      ),
    },
    {
      title: '新进牛散数',
      dataIndex: 'newInvestorCount',
      key: 'newInvestorCount',
      width: 120,
      render: (value: number) => <span className="text-red-500">{value}</span>,
    },
    {
      title: '新进牛散',
      dataIndex: 'investorNames',
      key: 'investorNames',
      width: 320,
      render: (value: string[]) => value.length ? value.join('、') : '—',
    },
    {
      title: '现价',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 100,
      render: (value: number) => value?.toFixed(2) || '—',
    },
    {
      title: '新进持仓市值',
      dataIndex: 'changeMarketValue',
      key: 'changeMarketValue',
      width: 140,
      render: (value: number) => formatMoney(value),
    },
    {
      title: '主营收入',
      dataIndex: 'mainRevenue',
      key: 'mainRevenue',
      width: 150,
      render: (value: number | null, record: HoldingNewStockAggregateItem) => (
        <Space direction="vertical" size={0}>
          <span>{formatMoney(value)}</span>
          <Text type="secondary">{record.revenueReportDate || '—'}</Text>
        </Space>
      ),
    },
    {
      title: '报告期',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 120,
      render: (value: string) => value ? dayjs(value).format('YYYY-MM-DD') : '—',
    },
  ];

  const isStockMode = holdingType === 'new' && viewMode === 'stock';
  const columns = (isStockMode ? stockColumns : detailColumns) as ColumnsType<any>;
  const dataSource = (data?.list || []) as Array<HoldingChangeItem | HoldingNewStockAggregateItem>;

  const switchHoldingType = (nextType: HoldingType) => {
    setHoldingType(nextType);
    setPage(1);
    if (nextType === 'new') {
      setViewMode('stock');
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Shareholder Change"
        title="牛散持仓分析"
        description="统一展示牛散增持、减持和新进记录，所有数据均来自后端业务数据接口。"
      />

      <FilterBar>
        <Button
          type={holdingType === 'increase' ? 'primary' : 'default'}
          onClick={() => switchHoldingType('increase')}
        >
          增持
        </Button>
        <Button
          type={holdingType === 'decrease' ? 'primary' : 'default'}
          onClick={() => switchHoldingType('decrease')}
        >
          减持
        </Button>
        <Button
          type={holdingType === 'new' ? 'primary' : 'default'}
          onClick={() => switchHoldingType('new')}
        >
          新进
        </Button>
        <Input
          placeholder={isStockMode ? '搜索股票名称 / 股票代码 / 牛散姓名' : '搜索牛散 / 股票名称 / 股票代码'}
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            setPage(1);
          }}
          onPressEnter={() => setPage(1)}
          style={{ width: 240 }}
          prefix={<SearchOutlined />}
          allowClear
        />
        <DatePicker
          value={reportDate ? dayjs(reportDate) : null}
          onChange={(date) => {
            setReportDate(date?.format('YYYY-MM-DD'));
            setPage(1);
          }}
          placeholder="报告期"
        />
        <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
          刷新
        </Button>
        <Button
          onClick={() => {
            setKeyword('');
            setReportDate(undefined);
            setPage(1);
            switchHoldingType(initialType);
          }}
        >
          重置
        </Button>
      </FilterBar>

      <Card title={getTableTitle(holdingType)}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {holdingType === 'new' && (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                message={
                  viewMode === 'stock'
                    ? '当前按股票聚合统计牛散新进数量，并按新进牛散数优先排序。'
                    : '当前展示牛散新进明细榜单，保留单个牛散-股票维度。'
                }
              />
              <Space>
                <Button
                  type={viewMode === 'stock' ? 'primary' : 'default'}
                  onClick={() => {
                    setViewMode('stock');
                    setPage(1);
                  }}
                >
                  按股票聚合
                </Button>
                <Button
                  type={viewMode === 'detail' ? 'primary' : 'default'}
                  onClick={() => {
                    setViewMode('detail');
                    setPage(1);
                  }}
                >
                  新进明细
                </Button>
              </Space>
            </Space>
          )}

          <Table
            columns={columns}
            dataSource={dataSource}
            loading={isLoading}
            rowKey={(record) => 'id' in record ? record.id : `${record.stockCode}-${record.reportDate}`}
            pagination={{
              current: page,
              pageSize: 20,
              total: data?.meta?.total || 0,
              onChange: (nextPage) => setPage(nextPage),
              showSizeChanger: false,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条`,
            }}
            scroll={{ x: isStockMode ? 1100 : 1450 }}
          />

          {!data?.list?.length && !isLoading && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Text type="secondary">暂无数据</Text>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
}
