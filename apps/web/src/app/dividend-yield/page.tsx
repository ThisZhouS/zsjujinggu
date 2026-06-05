'use client';

import { Card, Table, Space, Typography, Button } from 'antd';
import { DividendYieldItem, DividendRankingMode, useDividendYield } from '@/hooks/useDividend';
import { useState } from 'react';
import Link from 'next/link';
import { FilterBar, PageHeader } from '@/components/common/PageChrome';
import { VipFeatureBlockedState } from '@/components/paywall/VipFeatureBlockedState';
import { isVipRequiredError } from '@/lib/api-error';

const { Text } = Typography;

function formatMoney(value: number | null) {
  if (value == null) {
    return '—';
  }
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(2)}亿`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}万`;
  }
  return value.toFixed(2);
}

export default function DividendYieldPage() {
  const [page, setPage] = useState(1);
  const [year, setYear] = useState<number | undefined>(undefined);
  const [mode, setMode] = useState<DividendRankingMode>('rolling1y');

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2, currentYear - 3];

  const { data, error, isLoading } = useDividendYield({
    page,
    page_size: 20,
    year: mode === 'annual' ? year : undefined,
    mode,
  });

  if (isVipRequiredError(error)) {
    return (
      <VipFeatureBlockedState
        featureName="分红股息率排行"
        description="股息率排行和高分红筛选需要登录后访问。"
      />
    );
  }

  const columns = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_: unknown, __: DividendYieldItem, index: number) => (page - 1) * 20 + index + 1,
    },
    {
      title: '股票',
      key: 'stock',
      width: 200,
      render: (_: unknown, record: DividendYieldItem) => (
        <Space direction="vertical" size={0}>
          <Link href={`/stocks/${record.stockCode}`} className="font-semibold hover:text-teal-700">
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
      sorter: (a: DividendYieldItem, b: DividendYieldItem) => (a.currentPrice ?? 0) - (b.currentPrice ?? 0),
      render: (value: number | null) => value != null ? value.toFixed(2) : '—',
    },
    {
      title: mode === 'avg3y' ? '3年累计分红金额' : mode === 'rolling1y' ? '近1年累计分红金额' : '分红金额',
      dataIndex: 'totalDividend',
      key: 'totalDividend',
      sorter: (a: DividendYieldItem, b: DividendYieldItem) => (a.totalDividend ?? 0) - (b.totalDividend ?? 0),
      render: (value: number | null, record: DividendYieldItem) => {
        if (value != null) {
          return formatMoney(value);
        }

        if (record.dividendPerShare != null) {
          return `${record.dividendPerShare.toFixed(2)}元/股`;
        }

        return '—';
      },
    },
    {
      title: '股息率',
      dataIndex: 'dividendYield',
      key: 'dividendYield',
      sorter: (a: DividendYieldItem, b: DividendYieldItem) => (a.dividendYield ?? 0) - (b.dividendYield ?? 0),
      defaultSortOrder: 'descend' as const,
      render: (value: number | null) => (
        <span className="text-red-500 font-semibold">{value != null ? `${value.toFixed(2)}%` : '—'}</span>
      ),
    },
    {
      title: mode === 'annual' ? '分红年度' : '统计区间',
      dataIndex: mode === 'annual' ? 'year' : 'periodLabel',
      key: 'periodLabel',
      width: 120,
      render: (value: string | number | null) => value || '—',
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Dividend Ranking"
        title="分红股息率排行"
        description="支持近 1 年、年度和近 3 年平均口径；分红总额在原始值缺失时使用股本估算。"
      />

      <FilterBar
        extra={mode === 'annual' ? '年度模式可切换披露年度' : '当前为滚动统计口径'}
      >
        <Space>
          <Button
            type={mode === 'rolling1y' ? 'primary' : 'default'}
            onClick={() => {
              setMode('rolling1y');
              setPage(1);
            }}
          >
            近1年排行
          </Button>
          <Button
            type={mode === 'annual' ? 'primary' : 'default'}
            onClick={() => {
              setMode('annual');
              setPage(1);
            }}
          >
            按年度
          </Button>
          <Button
            type={mode === 'avg3y' ? 'primary' : 'default'}
            onClick={() => {
              setMode('avg3y');
              setPage(1);
            }}
          >
            近3年平均
          </Button>
        </Space>

        {mode === 'annual' && (
          <Space>
            <span>年度：</span>
            <Button
              type={year == null ? 'primary' : 'default'}
              onClick={() => {
                setYear(undefined);
                setPage(1);
              }}
            >
              全部
            </Button>
            {yearOptions.map((y) => (
              <Button
                key={y}
                type={year === y ? 'primary' : 'default'}
                onClick={() => {
                  setYear(y);
                  setPage(1);
                }}
              >
            {y}年
          </Button>
        ))}
          </Space>
        )}
      </FilterBar>

      <Card>
        <Table
          columns={columns}
          dataSource={data?.list || []}
          loading={isLoading}
          rowKey={(record) => `${record.stockCode}-${record.periodLabel}-${record.year ?? 'avg3y'}`}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.meta?.total || 0,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 800 }}
        />

        {!data?.list?.length && !isLoading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Text type="secondary">暂无数据</Text>
          </div>
        )}
      </Card>
    </div>
  );
}
