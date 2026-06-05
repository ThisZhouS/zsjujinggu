'use client';

import { Card, Table, Typography, Input, Button, Space, Tabs, Tag } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useState } from 'react';
import Link from 'next/link';
import {
  useIndividualShareholders,
  type IndividualShareholderItem,
} from '@/hooks/useIndividualShareholder';
import type { InvestorCategory } from '@/hooks/useInvestors';
import { compareNumber, compareText } from '@/lib/table-sorters';

const { Text } = Typography;

function formatMoney(value?: number | null) {
  if (value == null) return '—';
  if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
  if (value >= 10000) return `${(value / 10000).toFixed(2)}万`;
  return value.toFixed(2);
}

export default function IndividualShareholdersPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState<InvestorCategory>('personal');

  const { data, error, isLoading, mutate } = useIndividualShareholders({
    page,
    page_size: 20,
    category,
    keyword: keyword || undefined,
  });

  const currentLabel = category === 'personal' ? '牛散单支持股' : '机构单支持股';

  const columns = [
    {
      title: '排名',
      key: 'index',
      width: 80,
      render: (_: unknown, __: unknown, index: number) => (page - 1) * 20 + index + 1,
    },
    {
      title: category === 'personal' ? '牛散姓名' : '机构名称',
      dataIndex: 'investorName',
      key: 'investorName',
      width: 180,
      sorter: (left: IndividualShareholderItem, right: IndividualShareholderItem) =>
        compareText(left.investorName, right.investorName),
      render: (value: string, record: IndividualShareholderItem) => (
        <Space direction="vertical" size={0}>
          <Link
            href={`${category === 'personal' ? '/investors' : '/institutions'}/${record.investorId}`}
            className="font-semibold hover:text-blue-600"
          >
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
      sorter: (left: IndividualShareholderItem, right: IndividualShareholderItem) =>
        compareText(left.stockCode, right.stockCode),
      render: (_: unknown, record: IndividualShareholderItem) => (
        <Space direction="vertical" size={0}>
          <Link href={`/stocks/${record.stockCode}`} className="font-medium hover:text-blue-600">
            {record.stockName}
          </Link>
          <Text type="secondary">{record.stockCode}</Text>
        </Space>
      ),
    },
    {
      title: '持股数',
      dataIndex: 'holdCount',
      key: 'holdCount',
      width: 120,
      sorter: (left: IndividualShareholderItem, right: IndividualShareholderItem) =>
        compareNumber(left.holdCount, right.holdCount),
      render: (value: number) => `${(value / 10000).toFixed(2)}万股`,
    },
    {
      title: '持股比例',
      dataIndex: 'holdRatio',
      key: 'holdRatio',
      width: 100,
      sorter: (left: IndividualShareholderItem, right: IndividualShareholderItem) =>
        compareNumber(left.holdRatio, right.holdRatio),
      render: (value: number | null) => (value != null ? `${value.toFixed(2)}%` : '—'),
    },
    {
      title: '现价',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 100,
      sorter: (left: IndividualShareholderItem, right: IndividualShareholderItem) =>
        compareNumber(left.currentPrice, right.currentPrice),
      render: (value: number | null) => (value != null ? `¥${value.toFixed(2)}` : '—'),
    },
    {
      title: '持仓市值',
      dataIndex: 'totalMarketValue',
      key: 'totalMarketValue',
      width: 140,
      sorter: (left: IndividualShareholderItem, right: IndividualShareholderItem) =>
        compareNumber(left.totalMarketValue, right.totalMarketValue),
      defaultSortOrder: 'descend' as const,
      render: (value: number) => (
        <span className="font-semibold text-red-500">{formatMoney(value)}</span>
      ),
    },
    {
      title: '报告期',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 120,
      sorter: (left: IndividualShareholderItem, right: IndividualShareholderItem) =>
        compareText(left.reportDate, right.reportDate),
    },
  ];

  return (
    <Card title="个人股东">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Tabs
          activeKey={category}
          onChange={(value) => {
            setCategory(value as InvestorCategory);
            setPage(1);
          }}
          items={[
            {
              key: 'personal',
              label: '牛散单支持股',
            },
            {
              key: 'institution',
              label: '机构单支持股',
            },
          ]}
        />

        <Card size="small" className="bg-slate-50">
          <Space direction="vertical" size={8}>
            <Text>
              当前口径：<Tag color="blue">{currentLabel}</Tag>
              只保留当前业务表中 `stockCount = 1` 的已跟踪股东，并按持仓市值从高到低排序。
            </Text>
            <Space>
              <Input
                placeholder="搜索股东姓名 / 股票代码 / 股票名称"
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setPage(1);
                }}
                style={{ width: 280 }}
                prefix={<SearchOutlined />}
                allowClear
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
            </Space>
          </Space>
        </Card>

        <Table
          columns={columns}
          dataSource={data?.list || []}
          loading={isLoading}
          rowKey={(record) => `${record.category}-${record.investorId}`}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.meta?.total || 0,
            onChange: (nextPage) => setPage(nextPage),
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
          scroll={{ x: 1100 }}
        />

        {!data?.list?.length && !isLoading && !error && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Text type="secondary">暂无符合条件的单支持股股东</Text>
          </div>
        )}
      </Space>
    </Card>
  );
}
