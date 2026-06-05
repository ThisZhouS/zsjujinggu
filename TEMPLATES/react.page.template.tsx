/**
 * React Page 样板
 * 职责：页面组件、路由页面、业务逻辑展示
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Input, message, Modal } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useXxxList, useXxxDetail } from '@/hooks/useXxx';
import { XxxForm } from '@/components/xxx/XxxForm';
import { VipPaywall } from '@/components/paywall/VipPaywall';

interface PageParams {
  page: number;
  page_size: number;
  sort?: string;
  keyword?: string;
}

export default function XxxPage() {
  const [params, setParams] = useState<PageParams>({
    page: 1,
    page_size: 20,
    sort: '-created_at',
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(false);

  // R16: SWR配置onError回调
  const { data, isLoading, error, mutate } = useXxxList(params);

  useEffect(() => {
    if (error) {
      message.error(error.message || '加载数据失败');
    }
  }, [error]);

  const handleTableChange = (pagination: any, filters: any, sorter: any) => {
    setParams({
      ...params,
      page: pagination.current,
      page_size: pagination.pageSize,
      sort: sorter.field
        ? `${sorter.order === 'descend' ? '-' : ''}${sorter.field}`
        : params.sort,
    });
  };

  const handleSearch = (keyword: string) => {
    setParams({
      ...params,
      page: 1,
      keyword,
    });
  };

  const handleCreate = () => {
    setSelectedId(null);
    setFormVisible(true);
  };

  const handleEdit = (record: any) => {
    setSelectedId(record.id);
    setFormVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      onOk: async () => {
        try {
          await apiClient.delete(`/api/v1/xxx/${id}`);
          message.success('删除成功');
          mutate();
        } catch (error: any) {
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  const handleFormSuccess = () => {
    setFormVisible(false);
    mutate();
  };

  // R15: 字段名使用camelCase
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => {
        if (!date) return '—';
        return new Date(date).toLocaleString('zh-CN');
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" danger onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="XXX列表" extra={<Button icon={<PlusOutlined />} onClick={handleCreate}>新建</Button>}>
      <Space className="mb-4">
        <Input.Search
          placeholder="搜索..."
          allowClear
          style={{ width: 300 }}
          onSearch={handleSearch}
          prefix={<SearchOutlined />}
        />
        <Button icon={<SearchOutlined />} onClick={() => mutate()}>
          刷新
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={data?.data?.items || []}
        loading={isLoading}
        rowKey="id"
        onChange={handleTableChange}
        pagination={{
          current: params.page,
          pageSize: params.page_size,
          total: data?.data?.meta?.total || 0,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />

      <XxxForm
        visible={formVisible}
        id={selectedId}
        onSuccess={handleFormSuccess}
        onCancel={() => setFormVisible(false)}
      />
    </Card>
  );
}

/**
 * VIP功能页面样板
 */
export function VipPage() {
  const { data, isLoading, error } = useXxxList({ page: 1, page_size: 20 });

  // R12: 检查VIP拦截响应
  const isVipRequired = data?.code === 403;

  if (isVipRequired) {
    return (
      <VipPaywall
        message={data?.message || '该功能需要VIP会员'}
      />
    );
  }

  return (
    <Card title="VIP功能">
      {/* 页面内容 */}
    </Card>
  );
}
