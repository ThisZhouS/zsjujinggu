'use client';

import { Button, Card, Table, Tag } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useOrders } from '@/hooks/useOrder';
import { useState } from 'react';
import dayjs from 'dayjs';

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, mutate } = useOrders({ page, page_size: 20 });

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'orange', text: '待支付' },
      PAID: { color: 'green', text: '已支付' },
      REFUNDED: { color: 'default', text: '已退款' },
      EXPIRED: { color: 'red', text: '已过期' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 180,
    },
    {
      title: '商品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '订单金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => `¥${value.toFixed(2)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (value: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '—',
    },
    {
      title: '支付时间',
      dataIndex: 'paidAt',
      key: 'paidAt',
      width: 160,
      render: (value: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '—',
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: { status: string; plan: string; orderNo: string }) => {
        if (record.status !== 'PENDING') {
          return '—';
        }

        return <Button type="link" disabled>支付已停用</Button>;
      },
    },
  ];

  return (
    <Card
      title="订单记录"
      extra={
        <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
          刷新
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={data?.list || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.meta?.total || 0,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </Card>
  );
}
