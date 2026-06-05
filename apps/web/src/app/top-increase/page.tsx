'use client';

import { Alert, Button, Card, Input, Space, Table, Tag, Typography } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { TopIncreaseItem, useTopIncrease } from '@/hooks/useTopIncrease';
import { useState } from 'react';
import Link from 'next/link';
import { FilterBar, PageHeader } from '@/components/common/PageChrome';
import { VipFeatureBlockedState } from '@/components/paywall/VipFeatureBlockedState';
import { isVipRequiredError } from '@/lib/api-error';

const { Text } = Typography;

function formatShares(value: number) {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(2)}亿股`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}万股`;
  }
  return `${value.toFixed(0)}股`;
}

export default function TopIncreasePage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const { data, error, isLoading, mutate } = useTopIncrease({ page, page_size: 20, keyword });

  if (isVipRequiredError(error)) {
    return (
      <VipFeatureBlockedState
        featureName="十大增持"
        description="全市场自然人股东增持排行需要登录后访问。"
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
      render: (_: unknown, record: TopIncreaseItem) => (
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
      title: '增持的牛散',
      dataIndex: 'shareholderNames',
      key: 'shareholderNames',
      width: 360,
      render: (value: string[]) => (
        <Space wrap size={[4, 4]}>
          {value.map((name) => (
            <Tag key={name}>{name}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '总增持数量',
      dataIndex: 'totalIncreaseShares',
      key: 'totalIncreaseShares',
      render: (value: number) => (
        <span className="text-red-500">+{formatShares(value)}</span>
      ),
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
        eyebrow="Top Increase"
        title="十大股东增持"
        description="按股票聚合自然人流通股东增持记录，核心字段为股票、现价、增持牛散与总增持数量。"
      />

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message={`按自然人流通股东最新报告期对比上一期持仓生成股票聚合榜，固定展示前 100 名，当前报告期：${data?.meta?.report_date || '—'}`}
        />

        <FilterBar>
          <Input
            placeholder="搜索股票代码 / 股票名称 / 牛散名称"
            prefix={<SearchOutlined />}
            style={{ width: 320 }}
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
          scroll={{ x: 1080 }}
        />
        </Card>

        {!data?.list?.length && !isLoading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Text type="secondary">暂无符合条件的增持记录</Text>
          </div>
        )}
      </Space>
    </div>
  );
}
