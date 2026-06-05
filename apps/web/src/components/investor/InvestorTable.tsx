'use client';

import { Table, Avatar, Tag } from 'antd';
import Link from 'next/link';
import { compareNumber } from '@/lib/table-sorters';

interface InvestorData {
  id: number;
  name: string;
  avatar?: string;
  totalMarketValue?: number;
  stockCount?: number;
}

interface InvestorTableProps {
  data: InvestorData[];
  loading?: boolean;
  onRowClick?: (investor: InvestorData) => void;
}

export function InvestorTable({ data, loading, onRowClick }: InvestorTableProps) {
  const columns = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '牛散名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: InvestorData) => (
        <div className="flex items-center space-x-2">
          {record.avatar ? (
            <Avatar src={record.avatar} size="small" />
          ) : (
            <Avatar size="small">{name[0]}</Avatar>
          )}
          <Link href={`/investors/${record.id}`} className="hover:text-blue-600">
            {name}
          </Link>
        </div>
      ),
    },
    {
      title: '持仓数量',
      dataIndex: 'stockCount',
      key: 'stockCount',
      sorter: (a: InvestorData, b: InvestorData) => compareNumber(a.stockCount, b.stockCount),
      render: (value: number) => value || '—',
    },
    {
      title: '总市值',
      dataIndex: 'totalMarketValue',
      key: 'totalMarketValue',
      sorter: (a: InvestorData, b: InvestorData) => compareNumber(a.totalMarketValue, b.totalMarketValue),
      defaultSortOrder: 'descend' as const,
      render: (value: number) => {
        if (!value) return '—';
        if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
        return `${(value / 10000).toFixed(2)}万`;
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
      onRow={(record) => ({
        onClick: () => onRowClick?.(record),
        className: 'cursor-pointer hover:bg-gray-50',
      })}
      pagination={false}
      size="small"
    />
  );
}
