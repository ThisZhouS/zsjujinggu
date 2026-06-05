'use client';

import { Select, Space, Table, Tag } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { HoldingsHistoryRecord } from '@/hooks/useInvestors';
import { useState } from 'react';

interface HoldingsHistoryTableProps {
  data: HoldingsHistoryRecord[];
  loading?: boolean;
}

export function HoldingsHistoryTable({ data, loading }: HoldingsHistoryTableProps) {
  const [selectedStockCode, setSelectedStockCode] = useState<string>();

  const stockOptions = Array.from(
    new Map(
      data.map((item) => [
        item.stockCode,
        {
          value: item.stockCode,
          label: `${item.stockName} (${item.stockCode})`,
        },
      ]),
    ).values(),
  ).sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));

  const filteredData = selectedStockCode
    ? data.filter((item) => item.stockCode === selectedStockCode)
    : data;

  const columns = [
    {
      title: '股票名称',
      dataIndex: 'stockName',
      key: 'stockName',
      fixed: 'left' as const,
      width: 120,
      render: (name: string, record: HoldingsHistoryRecord) => (
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
      title: '报告期',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 110,
      sorter: (a: HoldingsHistoryRecord, b: HoldingsHistoryRecord) => a.reportDate.localeCompare(b.reportDate),
    },
    {
      title: '持仓数量',
      dataIndex: 'holdAmount',
      key: 'holdAmount',
      width: 120,
      sorter: (a: HoldingsHistoryRecord, b: HoldingsHistoryRecord) => a.holdAmount - b.holdAmount,
      render: (value: number, record: HoldingsHistoryRecord) => {
        if (record.isCleared) return <span className="text-gray-400">已清仓</span>;
        if (value >= 10000) return `${(value / 10000).toFixed(2)}万`;
        return value?.toLocaleString() || '—';
      },
    },
    {
      title: '持仓变动',
      dataIndex: 'holdChange',
      key: 'holdChange',
      width: 120,
      render: (value: number, record: HoldingsHistoryRecord) => {
        if (record.isCleared) {
          return <Tag color="orange">清仓</Tag>;
        }
        if (value > 0) {
          return (
            <Tag icon={<ArrowUpOutlined />} color="red">
              +{value >= 10000 ? `${(value / 10000).toFixed(2)}万` : value.toLocaleString()}
            </Tag>
          );
        } else if (value < 0) {
          return (
            <Tag icon={<ArrowDownOutlined />} color="green">
              {value >= -10000 ? value.toLocaleString() : `${(value / 10000).toFixed(2)}万`}
            </Tag>
          );
        } else {
          return <span className="text-gray-400">0</span>;
        }
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
      title: '持仓成本',
      dataIndex: 'avgCost',
      key: 'avgCost',
      width: 100,
      render: (value: number | null) => value?.toFixed(2) || '—',
    },
    {
      title: '总投入',
      dataIndex: 'totalInvestedCost',
      key: 'totalInvestedCost',
      width: 120,
      render: (value: number) => {
        if (!value) return '—';
        if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
        return `${(value / 10000).toFixed(2)}万`;
      },
    },
    {
      title: '期末收盘价',
      dataIndex: 'closePrice',
      key: 'closePrice',
      width: 120,
      render: (value: number | null) => value?.toFixed(2) || '—',
    },
    {
      title: '持仓市值',
      dataIndex: 'marketValue',
      key: 'marketValue',
      width: 120,
      sorter: (a: HoldingsHistoryRecord, b: HoldingsHistoryRecord) => (a.marketValue ?? 0) - (b.marketValue ?? 0),
      render: (value: number | null) => {
        if (!value) return '—';
        if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
        return `${(value / 10000).toFixed(2)}万`;
      },
    },
    {
      title: '浮盈/浮亏',
      dataIndex: 'unrealizedGain',
      key: 'unrealizedGain',
      width: 120,
      render: (value: number | null, record: HoldingsHistoryRecord) => {
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
      dataIndex: 'currentGainRate',
      key: 'currentGainRate',
      width: 100,
      sorter: (a: HoldingsHistoryRecord, b: HoldingsHistoryRecord) => (a.currentGainRate ?? 0) - (b.currentGainRate ?? 0),
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
      title: '现价',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 100,
      render: (value: number | null) => value?.toFixed(2) || '—',
    },
    {
      title: '全部卖出盈亏',
      dataIndex: 'profitIfSellAll',
      key: 'profitIfSellAll',
      width: 140,
      render: (value: number | null, record: HoldingsHistoryRecord) => {
        if (record.isCleared && value !== null) {
          const isProfit = value >= 0;
          return (
            <Tag color={isProfit ? 'red' : 'green'}>
              {isProfit ? '+' : ''}{(value / 10000).toFixed(2)}万
            </Tag>
          );
        }
        if (value === null || value === undefined) return '—';
        const isProfit = value >= 0;
        return (
          <span className={isProfit ? 'text-red-500' : 'text-green-500'}>
            {isProfit ? '+' : ''}{(value / 10000).toFixed(2)}万
          </span>
        );
      },
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Select
        allowClear
        showSearch
        placeholder="筛选股票"
        value={selectedStockCode}
        options={stockOptions}
        optionFilterProp="label"
        onChange={(value) => setSelectedStockCode(value)}
        style={{ width: '100%', maxWidth: 360 }}
      />

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey={(record) => `${record.stockCode}-${record.reportDate}`}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        scroll={{ x: 1600 }}
        size="small"
      />
    </Space>
  );
}
