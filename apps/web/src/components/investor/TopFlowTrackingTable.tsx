'use client';

import { Select, Space, Table, Tag, Typography } from 'antd';
import Link from 'next/link';
import { TopFlowTrackingRecord } from '@/hooks/useInvestors';
import { useEffect, useState } from 'react';

const { Text } = Typography;

interface TopFlowTrackingTableProps {
  data: TopFlowTrackingRecord[];
  loading?: boolean;
}

function formatMarketValue(value: number) {
  if (!value) return '—';
  if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
  return `${(value / 10000).toFixed(2)}万`;
}

export function TopFlowTrackingTable({ data, loading }: TopFlowTrackingTableProps) {
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
  );

  useEffect(() => {
    if (!selectedStockCode && stockOptions[0]?.value) {
      setSelectedStockCode(stockOptions[0].value);
    }
  }, [selectedStockCode, stockOptions]);

  const filteredData = selectedStockCode
    ? data.filter((item) => item.stockCode === selectedStockCode)
    : data;

  const columns = [
    {
      title: '股票',
      key: 'stock',
      width: 220,
      fixed: 'left' as const,
      render: (_: unknown, record: TopFlowTrackingRecord) => (
        <Space direction="vertical" size={0}>
          <Link href={`/stocks/${record.stockCode}`} className="hover:text-blue-600">
            {record.stockName}
          </Link>
          <Text type="secondary">{record.stockCode}</Text>
        </Space>
      ),
    },
    {
      title: '首次进入',
      dataIndex: 'firstEntryReportDate',
      key: 'firstEntryReportDate',
      width: 120,
    },
    {
      title: '报告期',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 120,
      sorter: (a: TopFlowTrackingRecord, b: TopFlowTrackingRecord) =>
        a.reportDate.localeCompare(b.reportDate),
    },
    {
      title: '是否仍在前十',
      dataIndex: 'isInTopFlowHolders',
      key: 'isInTopFlowHolders',
      width: 120,
      render: (value: boolean) =>
        value ? <Tag color="red">仍在前十</Tag> : <Tag>已掉出前十</Tag>,
    },
    {
      title: '股东排名',
      dataIndex: 'holderRank',
      key: 'holderRank',
      width: 100,
      render: (value: string | null, record: TopFlowTrackingRecord) =>
        record.isInTopFlowHolders && value ? `第 ${value} 名` : '—',
    },
    {
      title: '持股数量',
      dataIndex: 'holdAmount',
      key: 'holdAmount',
      width: 120,
      render: (value: number, record: TopFlowTrackingRecord) =>
        record.isInTopFlowHolders
          ? value >= 10000
            ? `${(value / 10000).toFixed(2)}万`
            : value.toLocaleString()
          : '—',
    },
    {
      title: '持股比例',
      dataIndex: 'holdRatio',
      key: 'holdRatio',
      width: 100,
      render: (value: number | null, record: TopFlowTrackingRecord) =>
        record.isInTopFlowHolders && value != null ? `${value.toFixed(2)}%` : '—',
    },
    {
      title: '持仓市值',
      dataIndex: 'marketValue',
      key: 'marketValue',
      width: 120,
      render: (value: number, record: TopFlowTrackingRecord) =>
        record.isInTopFlowHolders ? formatMarketValue(value) : '—',
    },
    {
      title: '公告日',
      dataIndex: 'announcementDate',
      key: 'announcementDate',
      width: 120,
      render: (value: string | null) => value || '—',
    },
    {
      title: '变动原因',
      dataIndex: 'changeReason',
      key: 'changeReason',
      ellipsis: true,
      render: (value: string | null) => value || '—',
    },
  ];

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Select
        value={selectedStockCode}
        options={stockOptions}
        style={{ width: '100%', maxWidth: 360 }}
        placeholder="按股票查看进入十大流通股东后的连续记录"
        onChange={(value) => setSelectedStockCode(value)}
        allowClear
      />
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey={(record) => `${record.stockCode}-${record.reportDate}`}
        pagination={{
          pageSize: 20,
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        scroll={{ x: 1300 }}
        size="small"
      />
    </Space>
  );
}
