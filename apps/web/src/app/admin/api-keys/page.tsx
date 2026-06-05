'use client';

import { DeleteOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, InputNumber, Modal, Select, Space, Switch, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api';

type ApiPlan = 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE';

interface AdminApiKeyItem {
  id: number;
  userId: number;
  userPhone: string;
  userNickname: string | null;
  keyPrefix: string | null;
  plan: ApiPlan;
  quota: number;
  used: number;
  expiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminApiKeysResponse {
  list: AdminApiKeyItem[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

interface CreateApiKeyResponse {
  apiKey: string;
  keyPrefix: string;
}

interface CreateApiKeyFormValues {
  userId: number;
  plan: ApiPlan;
}

const PLAN_OPTIONS = [
  { label: '免费版', value: 'FREE' },
  { label: '基础版', value: 'BASIC' },
  { label: '专业版', value: 'PRO' },
  { label: '企业版', value: 'ENTERPRISE' },
];

const PLAN_COLORS: Record<ApiPlan, string> = {
  FREE: 'default',
  BASIC: 'blue',
  PRO: 'gold',
  ENTERPRISE: 'purple',
};

export default function AdminApiKeysPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all');
  const [planFilter, setPlanFilter] = useState<ApiPlan | undefined>();
  const [keyword, setKeyword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(null);
  const [form] = Form.useForm<CreateApiKeyFormValues>();

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('page_size', '20');
  if (statusFilter !== 'all') {
    params.set('isActive', statusFilter);
  }
  if (planFilter) {
    params.set('plan', planFilter);
  }
  if (keyword.trim()) {
    params.set('keyword', keyword.trim());
  }

  const fetcher = async (url: string) => apiClient.get<AdminApiKeysResponse>(url);
  const { data, isLoading, mutate } = useSWR<AdminApiKeysResponse>(
    `/api/v1/admin/api-keys?${params.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch admin api keys:', error);
      },
    },
  );

  const openCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({
      plan: 'FREE',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSubmitting(false);
    form.resetFields();
  };

  const handleCreate = async (values: CreateApiKeyFormValues) => {
    try {
      setSubmitting(true);
      const result = await apiClient.post<CreateApiKeyResponse, CreateApiKeyFormValues>(
        '/api/v1/admin/api-keys',
        values,
      );
      setCreatedKey(result);
      message.success('API Key 创建成功');
      closeModal();
      mutate();
    } catch (error: any) {
      message.error(error.message || '创建失败');
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/api/v1/admin/api-keys/${id}`);
      message.success('删除成功');
      mutate();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleToggle = async (record: AdminApiKeyItem, isActive: boolean) => {
    try {
      await apiClient.put(`/api/v1/admin/api-keys/${record.id}/toggle`, { isActive });
      message.success(isActive ? 'API Key 已启用' : 'API Key 已停用');
      mutate();
    } catch (error: any) {
      message.error(error.message || '状态更新失败');
    }
  };

  const columns = [
    {
      title: '用户',
      key: 'user',
      render: (_: unknown, record: AdminApiKeyItem) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{record.userNickname || `用户 #${record.userId}`}</Typography.Text>
          <Typography.Text type="secondary">{record.userPhone}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '标识',
      key: 'identifier',
      width: 120,
      render: (_: unknown, record: AdminApiKeyItem) => (
        <Typography.Text code>{record.keyPrefix ? `${record.keyPrefix}****` : `Key #${record.id}`}</Typography.Text>
      ),
    },
    {
      title: '计划',
      dataIndex: 'plan',
      key: 'plan',
      width: 110,
      render: (value: ApiPlan) => <Tag color={PLAN_COLORS[value]}>{value}</Tag>,
    },
    {
      title: '配额使用',
      key: 'quota',
      width: 120,
      render: (_: unknown, record: AdminApiKeyItem) => `${record.used} / ${record.quota}`,
    },
    {
      title: '状态',
      key: 'status',
      width: 150,
      render: (_: unknown, record: AdminApiKeyItem) => (
        <Space size="small">
          <Tag color={record.isActive ? 'green' : 'default'}>
            {record.isActive ? '启用中' : '已停用'}
          </Tag>
          <Switch
            size="small"
            checked={record.isActive}
            onChange={(checked) => handleToggle(record, checked)}
          />
        </Space>
      ),
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 150,
      render: (value: string | null | undefined) => value ? new Date(value).toLocaleDateString('zh-CN') : '永不过期',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: AdminApiKeyItem) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id)}
        >
          删除
        </Button>
      ),
    },
  ];

  return (
    <Card
      title="API Key 管理"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
          >
            创建 API Key
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="管理员可为指定用户创建 API Key，并统一管理计划、启停状态与使用配额。明文密钥仅在创建成功后展示一次。"
        />

        {createdKey && (
          <Card size="small" title="最近创建的 API Key">
            <Space direction="vertical" size={8}>
              <Typography.Text type="secondary">完整密钥</Typography.Text>
              <Typography.Text code copyable>{createdKey.apiKey}</Typography.Text>
            </Space>
          </Card>
        )}

        <Space wrap>
          <Input
            placeholder="搜索手机号或昵称"
            style={{ width: 240 }}
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="计划筛选"
            style={{ width: 150 }}
            value={planFilter}
            onChange={(value) => {
              setPlanFilter(value);
              setPage(1);
            }}
            options={PLAN_OPTIONS}
          />
          <Select
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            options={[
              { label: '全部状态', value: 'all' },
              { label: '仅启用', value: 'true' },
              { label: '仅停用', value: 'false' },
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

      <Modal
        title="创建 API Key"
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Form form={form} onFinish={handleCreate} layout="vertical">
          <Form.Item
            name="userId"
            label="用户 ID"
            rules={[{ required: true, message: '请输入用户 ID' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="例如：1001" min={1} />
          </Form.Item>
          <Form.Item
            name="plan"
            label="计划类型"
            rules={[{ required: true, message: '请选择计划类型' }]}
          >
            <Select options={PLAN_OPTIONS} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
