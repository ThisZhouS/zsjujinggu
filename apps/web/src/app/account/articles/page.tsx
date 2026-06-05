'use client';

import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import dayjs from 'dayjs';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Result,
  Select,
  Space,
  Table,
  Tag,
  Upload,
} from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import apiClient from '@/lib/api';
import { useAccount } from '@/hooks/useAccount';

const { TextArea } = Input;

interface MyArticleItem {
  id: number;
  title: string;
  content: string;
  summary?: string;
  coverImage?: string;
  author?: string;
  category?: 'buffett' | 'arkk' | 'general' | null;
  topicType?: 'general' | 'investor' | 'executive';
  relatedInvestorId?: number | null;
  relatedStockCode?: string | null;
  relatedExecutiveName?: string | null;
  sourceUrl?: string | null;
  sourceMetadata?: string | null;
  publishDate: string;
  isPinned: boolean;
  viewCount: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

interface MyArticleListResponse {
  list: MyArticleItem[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

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

const coverImagePattern = /^(https?:\/\/|\/uploads\/articles\/).+/i;

export default function AccountArticlesPage() {
  const { data: account, isLoading: accountLoading } = useAccount({ requireAuth: true });
  const canManageArticles = account?.role === 'ADMIN' || account?.canUploadArticles;
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<MyArticleItem | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [form] = Form.useForm();

  const fetcher = async (url: string) => apiClient.get<MyArticleListResponse>(url);
  const { data, isLoading, mutate } = useSWR<MyArticleListResponse>(
    canManageArticles ? `/api/v1/articles/mine?page=${page}&page_size=20` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch my articles:', error);
      },
    },
  );

  const handleOpenModal = (record?: MyArticleItem) => {
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
      });
    }

    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        publishDate: values.publishDate ? dayjs(values.publishDate).format('YYYY-MM-DD') : undefined,
      };

      if (editingArticle) {
        await apiClient.put(`/api/v1/articles/${editingArticle.id}`, payload);
        message.success('文章更新成功');
      } else {
        await apiClient.post('/api/v1/articles', payload);
        message.success('文章发布成功');
      }

      setModalOpen(false);
      await mutate();
    } catch (error: any) {
      message.error(error.message || '文章保存失败');
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
        },
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
      message.success('文章删除成功');
      await mutate();
    } catch (error: any) {
      message.error(error.message || '文章删除失败');
    }
  };

  const columns = [
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
      width: 120,
      render: (value: string | null) => value ? categoryLabelMap[value] || value : '未分类',
    },
    {
      title: '署名',
      dataIndex: 'author',
      key: 'author',
      width: 140,
      render: (value: string | undefined) => value || '默认署名',
    },
    {
      title: '主题',
      dataIndex: 'topicType',
      key: 'topicType',
      width: 120,
      render: (value: string | undefined) => value ? topicTypeLabelMap[value] || value : '综合新闻',
    },
    {
      title: '关联对象',
      key: 'target',
      width: 220,
      render: (_: unknown, record: MyArticleItem) => {
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
      width: 140,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: '阅读量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 100,
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_: unknown, record: MyArticleItem) => (
        record.isPinned ? <Tag color="red">置顶</Tag> : <Tag>普通</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: MyArticleItem) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  if (accountLoading) {
    return <Card loading />;
  }

  if (!canManageArticles) {
    return (
      <Card>
        <Result
          status="403"
          title="当前账号未开通文章上传权限"
          subTitle="请联系管理员为你的账号授权后，再使用文章投稿功能。"
          extra={
            <Link href="/account">
              <Button type="primary">返回个人中心</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <Card
      title="我的文章"
      extra={(
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            写文章
          </Button>
        </Space>
      )}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="已授权账号可在这里发布、编辑和删除自己的文章，发布后会直接展示在文章中心。"
        />

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
        title={editingArticle ? '编辑文章' : '发布文章'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={720}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[
              { required: true, message: '请输入标题' },
              { max: 200, message: '标题最多 200 字' },
            ]}
          >
            <Input placeholder="文章标题" maxLength={200} showCount />
          </Form.Item>

          <Form.Item
            name="author"
            label="署名"
            rules={[{ max: 50, message: '署名最多 50 字' }]}
          >
            <Input placeholder="留空则默认使用昵称/用户名/手机号脱敏" maxLength={50} />
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
            <Form.Item
              name="relatedStockCode"
              label="关联股票代码"
              style={{ flex: 1 }}
              rules={[{ max: 10, message: '股票代码最多 10 位' }]}
            >
              <Input placeholder="如 300750" maxLength={10} />
            </Form.Item>
            <Form.Item
              name="relatedExecutiveName"
              label="关联高管姓名"
              style={{ flex: 1 }}
              rules={[{ max: 100, message: '高管姓名最多 100 字' }]}
            >
              <Input placeholder="高管新闻可填" maxLength={100} />
            </Form.Item>
          </div>

          <Form.Item
            name="sourceUrl"
            label="来源链接"
            rules={[
              { type: 'url', message: '来源链接格式不正确' },
              { max: 500, message: '来源链接最多 500 位' },
            ]}
          >
            <Input placeholder="https://example.com/news/1" maxLength={500} />
          </Form.Item>

          <Form.Item
            name="sourceMetadata"
            label="来源元数据"
            extra="可填写 JSON 字符串，保留抓取或搬运来源的附加信息。"
          >
            <TextArea
              rows={3}
              placeholder='{"crawler":"manual","channel":"investor-news"}'
              maxLength={5000}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="summary"
            label="摘要"
            rules={[{ max: 500, message: '摘要最多 500 字' }]}
          >
            <Input.TextArea rows={2} placeholder="文章摘要（可选）" maxLength={500} showCount />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[
              { required: true, message: '请输入内容' },
              { max: 20000, message: '内容最多 20000 字' },
            ]}
          >
            <TextArea rows={12} placeholder="文章内容（支持 Markdown 格式）" maxLength={20000} showCount />
          </Form.Item>

          <Form.Item
            name="coverImage"
            label="封面图 URL"
            rules={[
              {
                pattern: coverImagePattern,
                message: '封面图必须是 http(s) URL 或上传后的图片路径',
              },
              { max: 500, message: '封面图 URL 最多 500 位' },
            ]}
          >
            <Space.Compact style={{ width: '100%' }}>
              <Input placeholder="https://example.com/cover.jpg 或上传图片" maxLength={500} />
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

          <Form.Item
            name="tags"
            label="标签"
            rules={[
              {
                validator: (_, value: string[] | undefined) => {
                  if (!value?.length) {
                    return Promise.resolve();
                  }

                  if (value.length > 20) {
                    return Promise.reject(new Error('标签最多 20 个'));
                  }

                  if (value.some((item) => item.length > 30)) {
                    return Promise.reject(new Error('单个标签最多 30 字'));
                  }

                  return Promise.resolve();
                },
              },
            ]}
          >
            <Select mode="tags" placeholder="输入标签后回车，最多 20 个" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingArticle ? '保存修改' : '发布文章'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
