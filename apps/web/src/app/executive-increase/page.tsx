'use client';

import { Alert, Button, Card, Input, Space, Table, Tag, Typography } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { ExecutiveIncreaseItem, useExecutiveIncrease } from '@/hooks/useExecutive';
import { RelatedNewsPanel } from '@/components/articles/RelatedNewsPanel';
import { useExecutiveNews } from '@/hooks/useArticles';
import { useState } from 'react';
import Link from 'next/link';
import { FilterBar, PageHeader } from '@/components/common/PageChrome';
import { VipFeatureBlockedState } from '@/components/paywall/VipFeatureBlockedState';
import { isVipRequiredError } from '@/lib/api-error';

const { Text } = Typography;

function formatMoney(value: number) {
  if (value >= 100000000) {
    return `¥${(value / 100000000).toFixed(2)}亿`;
  }
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(2)}万`;
  }
  return `¥${value.toFixed(2)}`;
}

export default function ExecutiveIncreasePage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');

  const { data, error, isLoading, mutate } = useExecutiveIncrease({
    page,
    page_size: 20,
    keyword,
  });
  const { data: newsData, isLoading: newsLoading } = useExecutiveNews({
    page: 1,
    page_size: 6,
  });

  if (isVipRequiredError(error)) {
    return (
      <VipFeatureBlockedState
        featureName="高管增持"
        description="高管增持聚合榜单需要登录后访问。"
      />
    );
  }

  const columns = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_: any, __: any, index: number) => (page - 1) * 20 + index + 1,
    },
    {
      title: '股票',
      key: 'stock',
      width: 220,
      render: (_: unknown, record: ExecutiveIncreaseItem) => (
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
      width: 100,
      render: (value: number | null) => value != null ? `¥${value.toFixed(2)}` : '—',
    },
    {
      title: '总增持数量',
      dataIndex: 'totalIncreaseShares',
      key: 'totalIncreaseShares',
      width: 130,
      render: (value: number) => <span className="text-red-500">{value.toLocaleString()}股</span>,
    },
    {
      title: '估算增持市值',
      dataIndex: 'estimatedIncreaseMarketValue',
      key: 'estimatedIncreaseMarketValue',
      width: 140,
      render: (value: number | null) => value != null ? (
        <span className="text-red-500">{formatMoney(value)}</span>
      ) : '—',
    },
    {
      title: '涉及高管数',
      dataIndex: 'executiveCount',
      key: 'executiveCount',
      width: 110,
    },
    {
      title: '涉及高管',
      dataIndex: 'executives',
      key: 'executives',
      width: 240,
      render: (value: string[]) => (
        <Space wrap size={[4, 4]}>
          {value.map((name) => (
            <Tag key={name}>{name}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '主营收入',
      dataIndex: 'mainRevenue',
      key: 'mainRevenue',
      width: 150,
      render: (value: number | null, record: ExecutiveIncreaseItem) => (
        <Space direction="vertical" size={0}>
          <span>{value != null ? formatMoney(value) : '—'}</span>
          <Text type="secondary">{record.revenueReportDate || '—'}</Text>
        </Space>
      ),
    },
    {
      title: '总市值',
      dataIndex: 'totalMarketCap',
      key: 'totalMarketCap',
      width: 120,
      render: (value: number | null) => value != null ? formatMoney(value) : '—',
    },
    {
      title: '报告期',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 120,
      render: (value: string) => value || '—',
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Executive Increase"
        title="高管增持"
        description="使用真实高管成员与报告期持仓对比链路，展示股票、现价、增持数量、估算增持市值和相关新闻。"
      />

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message={`当前榜单按真实高管成员与最新代表性报告期对比上一期持仓生成，当前报告期：${data?.meta?.report_date ?? '—'}`}
        />

        <FilterBar>
          <Input
            placeholder="搜索股票代码 / 股票名称 / 高管姓名"
            prefix={<SearchOutlined />}
            style={{ width: 260 }}
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setKeyword('');
              setPage(1);
              mutate();
            }}
          >
            重置
          </Button>
        </FilterBar>

        <Card>
        <Table
          columns={columns}
          dataSource={data?.list || []}
          loading={isLoading}
          rowKey="stockCode"
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.meta?.total || 0,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1000 }}
        />
        </Card>

        {!data?.list?.length && !isLoading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Text type="secondary">暂无符合条件的真实高管增持记录</Text>
          </div>
        )}

        <RelatedNewsPanel
          title="高管相关新闻"
          description="已预留 OpenClaw / Harness 自动上传接口，当前展示高管主题新闻。"
          articles={newsData?.list ?? []}
          loading={newsLoading}
          emptyText="暂无高管相关新闻，后续可通过自动化接口补充。"
        />
      </Space>
    </div>
  );
}
