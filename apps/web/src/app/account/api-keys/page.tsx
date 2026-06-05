'use client';

import { Alert, Button, Card, Modal, Space, Switch, Table, Tag, Typography, message } from 'antd';
import { PlusOutlined, CopyOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { ApiKeyItem, ApiPlan, CreateApiKeyResponse, useApiKeys } from '@/hooks/useApiKey';
import { useState } from 'react';
import dayjs from 'dayjs';
import apiClient from '@/lib/api';

const { Text } = Typography;
const PLAN_TAG_COLORS: Record<ApiPlan, string> = {
  FREE: 'default',
  BASIC: 'blue',
  PRO: 'gold',
  ENTERPRISE: 'purple',
};

export default function ApiKeysPage() {
  const [page, setPage] = useState(1);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(null);
  const { data, isLoading, mutate } = useApiKeys({ page, page_size: 20 });

  const handleCreate = async () => {
    try {
      const result = await apiClient.post<CreateApiKeyResponse>('/api/v1/account/api-keys');

      setCreatedKey(result);
      message.success('API Key 创建成功');
      setCreateModalOpen(false);
      mutate();
    } catch (error: any) {
      message.error(error.message || '创建失败');
    }
  };

  const handleToggle = async (record: ApiKeyItem, isActive: boolean) => {
    try {
      await apiClient.put(`/api/v1/account/api-keys/${record.id}/toggle`, { isActive });
      message.success(isActive ? 'API Key 已启用' : 'API Key 已停用');
      mutate();
    } catch (error: any) {
      message.error(error.message || '状态更新失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/api/v1/account/api-keys/${id}`);
      message.success('已删除');
      mutate();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    message.success('已复制到剪贴板');
  };

  const columns = [
    {
      title: '标识',
      key: 'identifier',
      render: (_: unknown, record: ApiKeyItem) => (
        <Text code>{record.keyPrefix ? `${record.keyPrefix}****` : `Key #${record.id}`}</Text>
      ),
    },
    {
      title: '计划',
      dataIndex: 'plan',
      key: 'plan',
      render: (value: ApiPlan) => (
        <Tag color={PLAN_TAG_COLORS[value]}>{value}</Tag>
      ),
    },
    {
      title: '配额',
      dataIndex: 'quota',
      key: 'quota',
      render: (value: number, record: ApiKeyItem) => (
        <Text>{record.used || 0} / {value}</Text>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 140,
      render: (_: unknown, record: ApiKeyItem) => (
        <Space size="small">
          <Tag color={record.isActive ? 'green' : 'red'}>
            {record.isActive ? '活跃' : '已禁用'}
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
      width: 160,
      render: (value: string | null | undefined) => value ? dayjs(value).format('YYYY-MM-DD') : '永不过期',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (value: string | null | undefined) => value ? dayjs(value).format('YYYY-MM-DD') : '—',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: ApiKeyItem) => (
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
            onClick={() => setCreateModalOpen(true)}
          >
            创建 API Key
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%', marginBottom: 16 }}>
        <Alert
          type="info"
          showIcon
          message="新创建的完整 API Key 仅会展示一次，请立即复制并妥善保存。"
        />
        {createdKey && (
          <Card size="small" title="最近创建的 API Key">
            <Space direction="vertical" size={8}>
              <Text type="secondary">完整密钥</Text>
              <Space>
                <Text code copyable={false}>{createdKey.apiKey}</Text>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => handleCopy(createdKey.apiKey)}
                >
                  复制
                </Button>
              </Space>
            </Space>
          </Card>
        )}
      </Space>

      <Table
        columns={columns}
        dataSource={data?.list ?? []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.meta?.total ?? 0,
          onChange: (p) => setPage(p),
          showSizeChanger: false,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <Modal
        title="创建 API Key"
        open={createModalOpen}
        onCancel={() => setCreateModalOpen(false)}
        onOk={handleCreate}
        okText="创建免费 API Key"
        cancelText="取消"
      >
        <Alert
          type="info"
          showIcon
          message="用户侧仅支持创建免费 API Key"
          description="更高配额计划只能由管理员在后台创建和分配。"
        />
      </Modal>
    </Card>
  );
}
