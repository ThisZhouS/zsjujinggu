'use client';

import { Card, Table, Button, Space, Select, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useCommonHoldings } from '@/hooks/useHoldings';
import { useInvestors } from '@/hooks/useInvestors';
import { useState } from 'react';
import Link from 'next/link';
import { VipFeatureBlockedState } from '@/components/paywall/VipFeatureBlockedState';
import { isVipRequiredError } from '@/lib/api-error';

const { Text } = Typography;

export default function CommonHoldingsPage() {
  const [page, setPage] = useState(1);
  const [selectedInvestors, setSelectedInvestors] = useState<number[]>([]);

  const { data: investorsData } = useInvestors({ page: 1, page_size: 100 });
  const investorOptions = (investorsData?.list || []).map((inv: any) => ({
    label: inv.name,
    value: inv.id,
  }));

  const { data, error, isLoading, mutate } = useCommonHoldings({
    page,
    page_size: 20,
    investorIds: selectedInvestors.length > 0 ? selectedInvestors : undefined,
  });

  if (isVipRequiredError(error)) {
    return (
      <VipFeatureBlockedState
        featureName="共同持仓分析"
        description="多牛散共同持仓分析需要登录后访问。"
      />
    );
  }

  const formatMoney = (value?: number | null) => {
    if (value == null) return '—';
    if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
    if (value >= 10000) return `${(value / 10000).toFixed(2)}万`;
    return value.toFixed(2);
  };

  const columns = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '股票代码',
      dataIndex: 'stockCode',
      key: 'stockCode',
      width: 100,
    },
    {
      title: '股票名称',
      dataIndex: 'stockName',
      key: 'stockName',
      render: (value: string, record: any) => (
        <Link href={`/stocks/${record.stockCode}`} className="font-medium hover:text-blue-600">
          {value}
        </Link>
      ),
    },
    {
      title: '行业',
      dataIndex: 'industry',
      key: 'industry',
      width: 120,
      render: (value: string | null) => value || '—',
    },
    {
      title: '现价',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      render: (value: number) => value?.toFixed(2) || '—',
    },
    {
      title: '持仓市值',
      dataIndex: 'totalMarketValue',
      key: 'totalMarketValue',
      render: (value: number) => formatMoney(value),
    },
    {
      title: '主营收入',
      dataIndex: 'mainRevenue',
      key: 'mainRevenue',
      width: 150,
      render: (value: number | null, record: any) => (
        <Space direction="vertical" size={0}>
          <span>{formatMoney(value)}</span>
          <Text type="secondary">{record.revenueReportDate || '—'}</Text>
        </Space>
      ),
    },
    {
      title: '持仓牛散数',
      dataIndex: 'investorCount',
      key: 'investorCount',
      width: 100,
      render: (value: number) => value || '—',
    },
    {
      title: '持仓牛散',
      dataIndex: 'investors',
      key: 'investors',
      render: (investors: Array<any>) => (
        <Space wrap size={[4, 4]}>
          {investors?.map((investor) => (
            <Link
              key={investor.investorId}
              href={`/investors/${investor.investorId}`}
              className="rounded border border-slate-200 px-2 py-0.5 text-sm hover:border-blue-500 hover:text-blue-600"
            >
              {investor.investorName}
            </Link>
          )) || '—'}
        </Space>
      ),
    },
  ];

  return (
    <Card title="共同持仓">
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space>
          <Text>选择牛散：</Text>
          <Select
            mode="multiple"
            style={{ width: 400 }}
            options={investorOptions}
            value={selectedInvestors}
            onChange={setSelectedInvestors}
            placeholder="选择要比较的牛散（可选，不选则按全量持仓统计）"
            allowClear
          />
          <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
            刷新
          </Button>
        </Space>

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

        {!data?.list?.length && !isLoading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <Text type="secondary">
              暂无共同持仓数据
            </Text>
          </div>
        )}
      </Space>
    </Card>
  );
}
