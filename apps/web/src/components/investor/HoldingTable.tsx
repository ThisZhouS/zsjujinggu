'use client';

import { Input, Space, Table, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useState } from 'react';

interface HoldingRow {
  stockCode: string;
  stockName: string;
  holdCount: number;
  holdChange: number;
  returnRate: number | null;
  holdRatio: number | null;
  currentPrice: number | null;
  totalMarketCap: number | null;
  reportDate: string;
  avgCost: number | null;
  holdMarketValue: number | null;
  actualCost: number | null;
  sellProfit: number | null;
}

interface HoldingTableProps {
  data: HoldingRow[];
  loading?: boolean;
}

export function HoldingTable({ data, loading }: HoldingTableProps) {
  const [keyword, setKeyword] = useState('');
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredData = normalizedKeyword
    ? data.filter((item) =>
        item.stockCode.toLowerCase().includes(normalizedKeyword) ||
        item.stockName.toLowerCase().includes(normalizedKeyword),
      )
    : data;

  const columns = [
    {
      title: '股票名称',
      dataIndex: 'stockName',
      key: 'stockName',
      fixed: 'left' as const,
      width: 150,
      render: (name: string, record: HoldingRow) => (
        <Link href={`/stocks/${record.stockCode}`} className="hover:text-blue-600">
          {name}
        </Link>
      ),
    },
    {
      title: '代码',
      dataIndex: 'stockCode',
      key: 'stockCode',
      width: 100,
    },
    {
      title: '持仓数量',
      dataIndex: 'holdCount',
      key: 'holdCount',
      width: 120,
      sorter: (a: HoldingRow, b: HoldingRow) => a.holdCount - b.holdCount,
      render: (value: number) => {
        if (value >= 10000) return `${(value / 10000).toFixed(2)}万`;
        return value?.toLocaleString() || '—';
      },
    },
    {
      title: '持仓比例',
      dataIndex: 'holdRatio',
      key: 'holdRatio',
      width: 100,
      render: (value: number | null) => value ? `${value.toFixed(2)}%` : '—',
    },
    {
      title: '持仓变动',
      dataIndex: 'holdChange',
      key: 'holdChange',
      width: 100,
      render: (value: number) => {
        if (value > 0) {
          return (
            <Tag icon={<ArrowUpOutlined />} color="red">
              +{value.toLocaleString()}
            </Tag>
          );
        } else if (value < 0) {
          return (
            <Tag icon={<ArrowDownOutlined />} color="green">
              {value.toLocaleString()}
            </Tag>
          );
        } else {
          return (
            <Tag icon={<MinusOutlined />} color="default">
              0
            </Tag>
          );
        }
      },
    },
    {
      title: '现价',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 100,
      render: (value: number | null) => value?.toFixed(2) || '—',
    },
    {
      title: '市值',
      dataIndex: 'holdMarketValue',
      key: 'holdMarketValue',
      width: 120,
      sorter: (a: HoldingRow, b: HoldingRow) => (a.holdMarketValue ?? 0) - (b.holdMarketValue ?? 0),
      render: (value: number | null) => {
        if (!value) return '—';
        if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
        return `${(value / 10000).toFixed(2)}万`;
      },
    },
    {
      title: '持仓成本',
      dataIndex: 'avgCost',
      key: 'avgCost',
      width: 100,
      render: (value: number | null) => value?.toFixed(2) || '—',
    },
    {
      title: '盈亏',
      dataIndex: 'sellProfit',
      key: 'sellProfit',
      width: 120,
      sorter: (a: HoldingRow, b: HoldingRow) => (a.sellProfit ?? 0) - (b.sellProfit ?? 0),
      render: (value: number | null) => {
        if (value === null || value === undefined) return '—';
        const isProfit = value >= 0;
        return (
          <span className={isProfit ? 'text-red-500' : 'text-green-500'}>
            {isProfit ? '+' : ''}{(value / 10000).toFixed(2)}万
          </span>
        );
      },
    },
    {
      title: '收益率',
      dataIndex: 'returnRate',
      key: 'returnRate',
      width: 100,
      sorter: (a: HoldingRow, b: HoldingRow) => (a.returnRate ?? 0) - (b.returnRate ?? 0),
      render: (value: number | null) => {
        if (value === null || value === undefined) return '—';
        const isProfit = value >= 0;
        return (
          <span className={isProfit ? 'text-red-500' : 'text-green-500'}>
            {isProfit ? '+' : ''}{value.toFixed(2)}%
          </span>
        );
      },
    },
    {
      title: '报告期',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 120,
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Input
        placeholder="筛选股票代码 / 股票名称"
        allowClear
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        style={{ maxWidth: 320 }}
      />

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="stockCode"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        scroll={{ x: 1400 }}
        size="small"
      />
    </Space>
  );
}
