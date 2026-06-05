'use client';

import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Switch,
  Select,
  message,
  DatePicker,
  Upload,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { useArticles } from '@/hooks/useArticles';
import { useState } from 'react';
import dayjs from 'dayjs';
import apiClient from '@/lib/api';

const { TextArea } = Input;

const categoryLabelMap: Record<string, string> = {
  buffett: '巴菲特',
  arkk: 'ARKK',
  general: '综合',
};

const topicTypeLabelMap: Record<string, string> = {
  general: '综合新闻',
  investor: '牛散新闻',
  executive: '高管新闻',
};

export default function AdminArticlesPage() {
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [form] = Form.useForm();
  const { data, isLoading, mutate } = useArticles({ page, page_size: 20, category: undefined as any });

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingArticle(record);
      form.setFieldsValue({
        ...record,
        publishDate: record.publishDate ? dayjs(record.publishDate) : undefined,
      });
    } else {
      setEditingArticle(null);
      form.resetFields();
      form.setFieldsValue({
        category: 'general',
        topicType: 'general',
        isPinned: false,
      });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        publishDate: values.publishDate ? dayjs(values.publishDate).format('YYYY-MM-DD') : undefined,
        isPinned: values.isPinned ?? false,
      };
      if (editingArticle) {
        await apiClient.put(`/api/v1/articles/${editingArticle.id}`, payload);
        message.success('更新成功');
      } else {
        await apiClient.post('/api/v1/articles', payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      mutate();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleCoverUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setUploadingCover(true);
    try {
      const result = await apiClient.post<{ url: string }>(
        '/api/v1/articles/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      form.setFieldValue('coverImage', result.url);
      message.success('封面上传成功');
    } catch (error: any) {
      message.error(error.message || '封面上传失败');
    } finally {
      setUploadingCover(false);
    }

    return false;
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/api/v1/articles/${id}`);
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
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (value: string) => categoryLabelMap[value] || value,
    },
    {
      title: '主题',
      dataIndex: 'topicType',
      key: 'topicType',
      width: 110,
      render: (value: string) => topicTypeLabelMap[value] || value || '综合新闻',
    },
    {
      title: '关联对象',
      key: 'target',
      width: 220,
      render: (_: any, record: any) => {
        if (record.topicType === 'investor') {
          return record.relatedInvestorId ? `牛散ID ${record.relatedInvestorId}` : '-';
        }

        if (record.topicType === 'executive') {
          return [record.relatedExecutiveName, record.relatedStockCode].filter(Boolean).join(' / ') || '-';
        }

        return record.relatedStockCode ? `股票 ${record.relatedStockCode}` : '-';
      },
    },
    {
      title: '发布日期',
      dataIndex: 'publishDate',
      key: 'publishDate',
      width: 120,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: '阅读量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'isPinned',
      key: 'isPinned',
      width: 80,
      render: (value: boolean) => value ? '置顶' : '普通',
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
      title="文章管理"
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
            添加文章
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
        title={editingArticle ? '编辑文章' : '发表文章'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={720}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="文章标题" />
          </Form.Item>
          <Form.Item name="author" label="作者">
            <Input placeholder="作者（可选）" />
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="category"
              label="分类"
              initialValue="general"
              rules={[{ required: true, message: '请选择分类' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="选择分类">
                <Select.Option value="buffett">巴菲特</Select.Option>
                <Select.Option value="arkk">ARKK</Select.Option>
                <Select.Option value="general">综合</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="topicType"
              label="新闻类型"
              initialValue="general"
              rules={[{ required: true, message: '请选择新闻类型' }]}
              style={{ flex: 1 }}
            >
              <Select placeholder="选择新闻类型">
                <Select.Option value="general">综合新闻</Select.Option>
                <Select.Option value="investor">牛散新闻</Select.Option>
                <Select.Option value="executive">高管新闻</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="publishDate" label="发布日期" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="relatedInvestorId" label="关联牛散 ID" style={{ flex: 1 }}>
              <InputNumber min={1} precision={0} style={{ width: '100%' }} placeholder="牛散新闻必填" />
            </Form.Item>
            <Form.Item name="relatedStockCode" label="关联股票代码" style={{ flex: 1 }}>
              <Input placeholder="如 300750" />
            </Form.Item>
            <Form.Item name="relatedExecutiveName" label="关联高管姓名" style={{ flex: 1 }}>
              <Input placeholder="高管新闻可填" />
            </Form.Item>
          </div>
          <Form.Item name="sourceUrl" label="来源链接">
            <Input placeholder="https://example.com/news/1" />
          </Form.Item>
          <Form.Item
            name="sourceMetadata"
            label="来源元数据"
            extra="可填写 JSON 字符串，保留抓取源的附加信息。"
          >
            <TextArea rows={3} placeholder='{"crawler":"openclaw","channel":"news"}' />
          </Form.Item>
          <Form.Item name="summary" label="摘要">
            <Input.TextArea rows={2} placeholder="文章摘要（可选）" />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={12} placeholder="文章内容（支持 Markdown 格式）" />
          </Form.Item>
          <Form.Item name="coverImage" label="封面图 URL">
            <Space.Compact style={{ width: '100%' }}>
              <Input placeholder="https://example.com/cover.jpg 或上传图片" />
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={(file) => {
                  void handleCoverUpload(file);
                  return Upload.LIST_IGNORE;
                }}
              >
                <Button icon={<UploadOutlined />} loading={uploadingCover}>
                  上传图片
                </Button>
              </Upload>
            </Space.Compact>
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签后回车" />
          </Form.Item>
          <Form.Item
            name="isPinned"
            label="置顶"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch checkedChildren="置顶" unCheckedChildren="普通" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingArticle ? '保存修改' : '发表文章'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
