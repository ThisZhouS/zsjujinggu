/**
 * React Component 样板
 * 职责：可复用UI组件、业务组件
 */

'use client';

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useXxxDetail } from '@/hooks/useXxx';

interface XxxFormProps {
  visible: boolean;
  id?: number | null;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * 表单组件
 */
export function XxxForm({ visible, id, onSuccess, onCancel }: XxxFormProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const { data: detail } = useXxxDetail(id || 0);

  // 编辑时回显数据
  useEffect(() => {
    if (visible) {
      if (id && detail?.data) {
        // R15: 字段名camelCase
        form.setFieldsValue({
          name: detail.data.name,
          description: detail.data.description,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, id, detail, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (id) {
        await apiClient.put(`/api/v1/xxx/${id}`, values);
        message.success('更新成功');
      } else {
        await apiClient.post('/api/v1/xxx', values);
        message.success('创建成功');
      }
      onSuccess();
      form.resetFields();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={id ? '编辑XXX' : '新建XXX'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          label="名称"
          name="name"
          rules={[{ required: true, message: '请输入名称' }]}
        >
          <Input placeholder="请输入名称" />
        </Form.Item>

        <Form.Item
          label="描述"
          name="description"
        >
          <Input.TextArea placeholder="请输入描述" rows={4} />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {id ? '更新' : '创建'}
            </Button>
            <Button onClick={onCancel}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}

/**
 * 卡片组件
 */
interface XxxCardProps {
  data: any;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export function XxxCard({ data, onEdit, onDelete }: XxxCardProps) {
  return (
    <Card
      title={data.name}
      extra={
        <Space>
          {onEdit && (
            <Button type="link" onClick={() => onEdit(data.id)}>
              编辑
            </Button>
          )}
          {onDelete && (
            <Button type="link" danger onClick={() => onDelete(data.id)}>
              删除
            </Button>
          )}
        </Space>
      }
    >
={data.description && (
        <p>{data.description}</p>
      )}
    </Card>
  );
}

/**
 * 表格组件
 */
interface XxxTableProps {
  data: any[];
  loading?: boolean;
  onEdit?: (record: any) => void;
  onDelete?: (id: number) => void;
}

export function XxxTable({ data, loading, onEdit, onDelete }: XxxTableProps) {
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
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          {onEdit && (
            <Button type="link" onClick={() => onEdit(record)}>
              编辑
            </Button>
          )}
          {onDelete && (
            <Button type="link" danger onClick={() => onDelete(record.id)}>
              删除
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      rowKey="id"
    />
  );
}

/**
 * 异步内容包装组件
 */
interface AsyncContentProps {
  loading?: boolean;
  error?: any;
  children: React.ReactNode;
}

export function AsyncContent({ loading, error, children }: AsyncContentProps) {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  if (error) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
      {error.message || '加载失败'}
    </div>;
  }

  return <>{children}</>;
}
