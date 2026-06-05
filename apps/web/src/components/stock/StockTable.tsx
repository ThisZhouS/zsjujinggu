'use client';

import { Table, Tag, Space, Button } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';

interface StockData {
  code: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  volume: number;
  amount: number;
  marketCap: number;
}

interface StockTableProps {
  data: StockData[];
  loading?: boolean;
  onRowClick?: (stock: StockData) => void;
}

export function StockTable({ data, loading, onRowClick }: StockTableProps) {
  const columns = [
    {
      title: '代码',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      fixed: 'left' as const,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      fixed: 'left' as const,
    },
    {
      title: '现价',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 100,
      render: (value: number) => value?.toFixed(2) || '—',
    },
    {
      title: '涨跌',
      dataIndex: 'change',
      key: 'change',
      width: 100,
      render: (value: number) => (
        <span className={value >= 0 ? 'text-red-500' : 'text-green-500'}>
          {value >= 0 ? '+' : ''}{value?.toFixed(2)}
        </span>
      ),
    },
    {
      title: '涨跌幅',
      dataIndex: 'changePercent',
      key: 'changePercent',
      width: 100,
      render: (value: number) => (
        <span className={value >= 0 ? 'text-red-500' : 'text-green-500'}>
          {value >= 0 ? '+' : ''}{value?.toFixed(2)}%
        </span>
      ),
    },
    {
      title: '成交量',
      dataIndex: 'volume',
      key: 'volume',
      width: 120,
      render: (value: number) => value ? `${(value / 10000).toFixed(2)}万` : '—',
    },
    {
      title: '成交额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
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
      width: 100,
      render: (value: number) => {
        if (!value) return '—';
        return `${(value / 100000000).toFixed(2)}亿`;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: StockData) => (
        <Button
          type="link"
          size="small"
          onClick={() => onRowClick?.(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="code"
      scroll={{ x: 1200, y: 500 }}
      pagination={false}
      bordered
      size="small"
      onRow={(record) => ({
        onClick: () => onRowClick?.(record),
        className: 'cursor-pointer hover:bg-gray-50',
      })}
    />
  );
}
