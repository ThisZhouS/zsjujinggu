'use client';

import { Card, Table, Button, Space, Modal, Form, Input, Switch, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useInvestors } from '@/hooks/useInvestors';
import { useState } from 'react';
import apiClient from '@/lib/api';

const { TextArea } = Input;

export default function AdminInvestorsPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState<any>(null);
  const [form] = Form.useForm();
  const { data, isLoading, mutate } = useInvestors({ page, page_size: 20, admin: true });

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingInvestor(record);
      form.setFieldsValue(record);
    } else {
      setEditingInvestor(null);
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingInvestor) {
        await apiClient.put(`/api/v1/investors/${editingInvestor.id}`, values);
        message.success('更新成功');
      } else {
        await apiClient.post('/api/v1/investors', values);
        message.success('创建成功');
      }
      setModalOpen(false);
      mutate();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/api/v1/investors/${id}`);
      message.success('删除成功');
      mutate();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '持仓市值',
      dataIndex: 'totalMarketValue',
      key: 'totalMarketValue',
      render: (value: number) => value ? `¥${(value / 100000000).toFixed(2)}亿` : '—',
    },
    {
      title: '持仓数量',
      dataIndex: 'stockCount',
      key: 'stockCount',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'isTracked',
      key: 'isTracked',
      width: 80,
      render: (value: boolean) => value ? '活跃' : '隐藏',
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="牛散管理"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
          >
            添加牛散
          </Button>
        </Space>
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

      <Modal
        title={editingInvestor ? '编辑牛散' : '添加牛散'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input placeholder="牛散名称" />
          </Form.Item>
          <Form.Item
            name="bio"
            label="简介"
          >
            <TextArea rows={4} placeholder="牛散简介" />
          </Form.Item>
          <Form.Item
            name="isTracked"
            label="状态"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="活跃" unCheckedChildren="隐藏" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingInvestor ? '保存' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
