'use client';

import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Input, Select, Space, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api';

type OrderStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'EXPIRED';
type MemberPlan = 'VIP_MONTHLY' | 'VIP_YEARLY' | 'LIFETIME';
type PaymentType = 'WECHAT' | 'ALIPAY';

interface AdminOrderItem {
  id: number;
  orderNo: string;
  userId: number;
  userPhone: string;
  userNickname: string | null;
  plan: MemberPlan;
  productName: string;
  amount: number;
  status: OrderStatus;
  paymentType: PaymentType;
  expiresAt: string;
  paidAt?: string | null;
  refundedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AdminOrdersResponse {
  list: AdminOrderItem[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
  const [planFilter, setPlanFilter] = useState<MemberPlan | undefined>();
  const [keyword, setKeyword] = useState('');

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('page_size', '20');
  if (statusFilter) {
    params.set('status', statusFilter);
  }
  if (planFilter) {
    params.set('plan', planFilter);
  }
  if (keyword.trim()) {
    params.set('keyword', keyword.trim());
  }

  const fetcher = async (url: string) => apiClient.get<AdminOrdersResponse>(url);
  const { data, isLoading, mutate } = useSWR<AdminOrdersResponse>(
    `/api/v1/admin/orders?${params.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch admin orders:', error);
      },
    },
  );

  const handleRefund = async (id: number) => {
    try {
      await apiClient.post(`/api/v1/admin/orders/${id}/refund`);
      message.success('退款成功');
      mutate();
    } catch (error: any) {
      message.error(error.message || '退款失败');
    }
  };

  const getStatusTag = (status: OrderStatus) => {
    const statusMap: Record<OrderStatus, { color: string; text: string }> = {
      PENDING: { color: 'orange', text: '待支付' },
      PAID: { color: 'green', text: '已支付' },
      REFUNDED: { color: 'default', text: '已退款' },
      EXPIRED: { color: 'red', text: '已过期' },
    };
    const config = statusMap[status];
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
      title: '用户',
      key: 'user',
      render: (_: unknown, record: AdminOrderItem) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{record.userNickname || '未设置昵称'}</Typography.Text>
          <Typography.Text type="secondary">{record.userPhone}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '商品',
      key: 'productName',
      render: (_: unknown, record: AdminOrderItem) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{record.productName}</Typography.Text>
          <Typography.Text type="secondary">{record.plan}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      render: (value: number) => `¥${value.toFixed(2)}`,
    },
    {
      title: '支付方式',
      dataIndex: 'paymentType',
      key: 'paymentType',
      width: 100,
      render: (value: PaymentType) => value === 'WECHAT' ? '微信' : '支付宝',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: OrderStatus) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => value ? new Date(value).toLocaleString('zh-CN') : '—',
    },
    {
      title: '支付时间',
      dataIndex: 'paidAt',
      key: 'paidAt',
      width: 180,
      render: (value: string | null | undefined) => value ? new Date(value).toLocaleString('zh-CN') : '—',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: AdminOrderItem) => (
        record.status === 'PAID' && (
          <Button
            type="link"
            danger
            onClick={() => handleRefund(record.id)}
          >
            退款
          </Button>
        )
      ),
    },
  ];

  return (
    <Card
      title="订单管理"
      extra={
        <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
          刷新
        </Button>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="支持按状态、历史付费计划和关键词筛选订单。对已支付订单可执行退款操作。"
        />

        <Space wrap>
          <Input
            placeholder="搜索订单号/手机号/昵称"
            style={{ width: 260 }}
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="状态筛选"
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            options={[
              { label: '待支付', value: 'PENDING' },
              { label: '已支付', value: 'PAID' },
              { label: '已退款', value: 'REFUNDED' },
              { label: '已过期', value: 'EXPIRED' },
            ]}
          />
          <Select
            allowClear
            placeholder="历史付费计划"
            style={{ width: 160 }}
            value={planFilter}
            onChange={(value) => {
              setPlanFilter(value);
              setPage(1);
            }}
            options={[
              { label: '历史月度权益', value: 'VIP_MONTHLY' },
              { label: '历史年度权益', value: 'VIP_YEARLY' },
              { label: '历史长期权益', value: 'LIFETIME' },
            ]}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={data?.list ?? []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.meta.total ?? 0,
            onChange: (nextPage) => setPage(nextPage),
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Space>
    </Card>
  );
}
