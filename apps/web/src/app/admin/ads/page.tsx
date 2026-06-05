'use client';

import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  Upload,
  message,
} from 'antd';
import { useState } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api';

const { TextArea } = Input;

type AdPosition =
  | 'HOME_TOP'
  | 'HOME_VIDEO_HERO'
  | 'HOME_SIDEBAR'
  | 'ARTICLE_BOTTOM'
  | 'MOBILE_BANNER';

type AdMediaType = 'IMAGE' | 'VIDEO';

interface AdItem {
  id: number;
  position: AdPosition;
  mediaType: AdMediaType;
  title: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  linkUrl: string;
  isActive: boolean;
  priority: number;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AdFormValues {
  position: AdPosition;
  mediaType: AdMediaType;
  title: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  linkUrl: string;
  priority?: number;
  isActive: boolean;
}

const POSITION_OPTIONS: Array<{ label: string; value: AdPosition }> = [
  { label: '首页顶部', value: 'HOME_TOP' },
  { label: '首页视频广告', value: 'HOME_VIDEO_HERO' },
  { label: '首页侧边栏', value: 'HOME_SIDEBAR' },
  { label: '文章底部', value: 'ARTICLE_BOTTOM' },
  { label: '移动端横幅', value: 'MOBILE_BANNER' },
];

const POSITION_LABELS: Record<AdPosition, string> = {
  HOME_TOP: '首页顶部',
  HOME_VIDEO_HERO: '首页视频广告',
  HOME_SIDEBAR: '首页侧边栏',
  ARTICLE_BOTTOM: '文章底部',
  MOBILE_BANNER: '移动端横幅',
};

const MEDIA_OPTIONS: Array<{ label: string; value: AdMediaType }> = [
  { label: '图片', value: 'IMAGE' },
  { label: '视频', value: 'VIDEO' },
];

export default function AdminAdsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<AdItem | null>(null);
  const [positionFilter, setPositionFilter] = useState<AdPosition | undefined>();
  const [statusFilter, setStatusFilter] = useState<'all' | 'true' | 'false'>('all');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<AdFormValues>();
  const mediaType = Form.useWatch('mediaType', form) ?? 'IMAGE';

  const params = new URLSearchParams();
  if (positionFilter) {
    params.set('position', positionFilter);
  }
  if (statusFilter !== 'all') {
    params.set('isActive', statusFilter);
  }
  const query = params.toString() ? `?${params.toString()}` : '';

  const fetcher = async (url: string) => apiClient.get<AdItem[]>(url);
  const { data, isLoading, mutate } = useSWR<AdItem[]>(
    `/api/v1/ads/admin/list${query}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch admin ads:', error);
      },
    },
  );

  const handleOpenModal = (record?: AdItem) => {
    if (record) {
      setEditingAd(record);
      form.setFieldsValue({
        position: record.position,
        mediaType: record.mediaType,
        title: record.title,
        content: record.content,
        imageUrl: record.imageUrl ?? undefined,
        videoUrl: record.videoUrl ?? undefined,
        linkUrl: record.linkUrl,
        priority: record.priority,
        isActive: record.isActive,
      });
    } else {
      setEditingAd(null);
      form.resetFields();
      form.setFieldsValue({
        position: 'HOME_TOP',
        mediaType: 'IMAGE',
        priority: 0,
        isActive: true,
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingAd(null);
    form.resetFields();
    setSubmitting(false);
  };

  const handleVideoUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    setUploadingVideo(true);
    try {
      const result = await apiClient.post<{ url: string }>(
        '/api/v1/videos/upload',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );

      form.setFieldValue('videoUrl', result.url);
      message.success('广告视频上传成功');
    } catch (error: any) {
      message.error(error.message || '广告视频上传失败');
    } finally {
      setUploadingVideo(false);
    }

    return false;
  };

  const handleSubmit = async (values: AdFormValues) => {
    try {
      setSubmitting(true);
      const payload = {
        ...values,
        imageUrl: values.mediaType === 'IMAGE' ? values.imageUrl?.trim() || null : null,
        videoUrl: values.mediaType === 'VIDEO' ? values.videoUrl?.trim() || null : null,
        linkUrl: values.linkUrl.trim(),
        content: values.content.trim(),
        title: values.title.trim(),
      };

      if (editingAd) {
        await apiClient.put(`/api/v1/ads/${editingAd.id}`, payload);
        message.success('广告已更新');
      } else {
        await apiClient.post('/api/v1/ads', payload);
        message.success('广告已创建');
      }

      closeModal();
      mutate();
    } catch (error: any) {
      message.error(error.message || '操作失败');
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/api/v1/ads/${id}`);
      message.success('广告已删除');
      mutate();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (value: string, record: AdItem) => (
        <Space direction="vertical" size={0}>
          <Space size={8}>
            <Typography.Text strong>{value}</Typography.Text>
            <Tag color={record.mediaType === 'VIDEO' ? 'cyan' : 'blue'}>
              {record.mediaType === 'VIDEO' ? '视频' : '图片'}
            </Tag>
          </Space>
          <Typography.Text type="secondary" ellipsis>
            {record.content}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '广告位',
      dataIndex: 'position',
      key: 'position',
      width: 140,
      render: (value: AdPosition) => POSITION_LABELS[value] || value,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      render: (value: boolean) => (
        <Tag color={value ? 'green' : 'default'}>{value ? '启用中' : '已停用'}</Tag>
      ),
    },
    {
      title: '素材地址',
      key: 'mediaUrl',
      render: (_: unknown, record: AdItem) => {
        const mediaUrl = record.mediaType === 'VIDEO' ? record.videoUrl : record.imageUrl;
        return mediaUrl ? (
          <Typography.Text copyable ellipsis style={{ maxWidth: 220 }}>
            {mediaUrl}
          </Typography.Text>
        ) : (
          '—'
        );
      },
    },
    {
      title: '点击数',
      dataIndex: 'clickCount',
      key: 'clickCount',
      width: 90,
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (value: string) => value ? new Date(value).toLocaleString('zh-CN') : '—',
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, record: AdItem) => (
        <Space size="small">
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
      title="广告管理"
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
            添加广告
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="广告支持图片与视频两种素材。首页视频广告位使用 HOME_VIDEO_HERO，优先级越高前台展示越靠前。"
        />

        <Space wrap>
          <Select
            allowClear
            placeholder="筛选广告位"
            style={{ width: 180 }}
            options={POSITION_OPTIONS}
            value={positionFilter}
            onChange={(value) => setPositionFilter(value)}
          />
          <Select
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
            options={[
              { label: '全部状态', value: 'all' },
              { label: '仅启用', value: 'true' },
              { label: '仅停用', value: 'false' },
            ]}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={data ?? []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            pageSize: 20,
            showSizeChanger: false,
            showQuickJumper: true,
          }}
        />
      </Space>

      <Modal
        title={editingAd ? '编辑广告' : '添加广告'}
        open={modalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="title"
            label="广告标题"
            rules={[{ required: true, message: '请输入广告标题' }]}
          >
            <Input placeholder="例如：限时会员活动" />
          </Form.Item>
          <Form.Item
            name="content"
            label="广告文案"
            rules={[{ required: true, message: '请输入广告文案' }]}
          >
            <TextArea rows={3} placeholder="用于列表展示或前台文案说明" />
          </Form.Item>
          <Form.Item
            name="position"
            label="广告位"
            rules={[{ required: true, message: '请选择广告位' }]}
          >
            <Select options={POSITION_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="mediaType"
            label="素材类型"
            rules={[{ required: true, message: '请选择素材类型' }]}
          >
            <Select options={MEDIA_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="priority"
            label="优先级"
            tooltip="数值越大，展示优先级越高"
            initialValue={0}
          >
            <InputNumber style={{ width: '100%' }} min={0} max={999} />
          </Form.Item>
          {mediaType === 'VIDEO' ? (
            <Form.Item
              name="videoUrl"
              label="视频 URL"
              rules={[{ required: true, message: '请填写视频地址或先上传视频' }]}
            >
              <Space.Compact style={{ width: '100%' }}>
                <Input placeholder="/uploads/videos/xxx.mp4 或外部视频地址" />
                <Upload
                  accept="video/*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    void handleVideoUpload(file);
                    return Upload.LIST_IGNORE;
                  }}
                >
                  <Button icon={<UploadOutlined />} loading={uploadingVideo}>
                    上传视频
                  </Button>
                </Upload>
              </Space.Compact>
            </Form.Item>
          ) : (
            <Form.Item
              name="imageUrl"
              label="图片 URL"
              rules={[{ required: true, message: '请输入图片地址' }]}
            >
              <Input placeholder="https://example.com/banner.jpg" />
            </Form.Item>
          )}
          <Form.Item
            name="linkUrl"
            label="跳转链接"
            rules={[{ required: true, message: '请输入跳转链接' }]}
          >
            <Input placeholder="/videos 或 https://example.com/activity" />
          </Form.Item>
          <Form.Item
            name="isActive"
            label="启用状态"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="启用" unCheckedChildren="停用" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              {editingAd ? '保存修改' : '创建广告'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
