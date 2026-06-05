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
import { VideoAccessLevel } from '@/hooks/useVideos';

const { TextArea } = Input;

interface AdminVideoItem {
  id: number;
  title: string;
  summary: string | null;
  description: string | null;
  coverUrl: string | null;
  videoUrl: string;
  durationSec: number | null;
  accessLevel: VideoAccessLevel;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface VideoFormValues {
  title: string;
  summary?: string;
  description?: string;
  coverUrl?: string;
  videoUrl: string;
  durationSec?: number | null;
  accessLevel: VideoAccessLevel;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder?: number;
}

const ACCESS_OPTIONS: Array<{ label: string; value: VideoAccessLevel }> = [
  { label: '游客可看', value: 'PUBLIC' },
  { label: '登录可看', value: 'USER' },
  { label: '视频专属', value: 'VIDEO' },
  { label: '登录可看（兼容旧VIP）', value: 'VIP' },
];

const ACCESS_LABELS: Record<VideoAccessLevel, string> = {
  PUBLIC: '游客可看',
  USER: '登录可看',
  VIDEO: '视频专属',
  VIP: '登录可看',
};

export default function AdminVideosPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<AdminVideoItem | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<VideoFormValues>();

  const fetcher = async (url: string) => apiClient.get<AdminVideoItem[]>(url);
  const { data, isLoading, mutate } = useSWR<AdminVideoItem[]>(
    '/api/v1/videos/admin/list',
    fetcher,
    {
      revalidateOnFocus: false,
    },
  );

  const handleOpenModal = (record?: AdminVideoItem) => {
    if (record) {
      setEditingVideo(record);
      form.setFieldsValue({
        title: record.title,
        summary: record.summary ?? undefined,
        description: record.description ?? undefined,
        coverUrl: record.coverUrl ?? undefined,
        videoUrl: record.videoUrl,
        durationSec: record.durationSec,
        accessLevel: record.accessLevel,
        isActive: record.isActive,
        isFeatured: record.isFeatured,
        sortOrder: record.sortOrder,
      });
    } else {
      setEditingVideo(null);
      form.resetFields();
      form.setFieldsValue({
        accessLevel: 'PUBLIC',
        isActive: true,
        isFeatured: false,
        sortOrder: 0,
      });
    }

    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingVideo(null);
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
      message.success('视频上传成功');
    } catch (error: any) {
      message.error(error.message || '视频上传失败');
    } finally {
      setUploadingVideo(false);
    }

    return false;
  };

  const handleSubmit = async (values: VideoFormValues) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        title: values.title.trim(),
        summary: values.summary?.trim() || null,
        description: values.description?.trim() || null,
        coverUrl: values.coverUrl?.trim() || null,
        videoUrl: values.videoUrl.trim(),
        sortOrder: values.sortOrder ?? 0,
        durationSec: values.durationSec ?? null,
      };

      if (editingVideo) {
        await apiClient.put(`/api/v1/videos/${editingVideo.id}`, payload);
        message.success('视频已更新');
      } else {
        await apiClient.post('/api/v1/videos', payload);
        message.success('视频已创建');
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
      await apiClient.delete(`/api/v1/videos/${id}`);
      message.success('视频已删除');
      mutate();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const columns = [
    {
      title: '视频',
      key: 'video',
      render: (_: unknown, record: AdminVideoItem) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{record.title}</Typography.Text>
          <Typography.Text type="secondary" ellipsis>
            {record.summary || record.description || '暂无说明'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: '权限',
      dataIndex: 'accessLevel',
      key: 'accessLevel',
      width: 120,
      render: (value: VideoAccessLevel) => {
        const colorMap: Record<VideoAccessLevel, string> = {
          PUBLIC: 'default',
          USER: 'blue',
          VIDEO: 'cyan',
          VIP: 'gold',
        };
        return <Tag color={colorMap[value]}>{ACCESS_LABELS[value]}</Tag>;
      },
    },
    {
      title: '状态',
      key: 'status',
      width: 150,
      render: (_: unknown, record: AdminVideoItem) => (
        <Space wrap>
          <Tag color={record.isActive ? 'green' : 'default'}>
            {record.isActive ? '上架中' : '已下架'}
          </Tag>
          {record.isFeatured ? <Tag color="red">精选</Tag> : null}
        </Space>
      ),
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 90,
    },
    {
      title: '视频地址',
      dataIndex: 'videoUrl',
      key: 'videoUrl',
      render: (value: string) => (
        <Typography.Text copyable ellipsis style={{ maxWidth: 220 }}>
          {value}
        </Typography.Text>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      render: (_: unknown, record: AdminVideoItem) => (
        <Space size="small">
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

  return (
    <Card
      title="视频管理"
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
            新建视频
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="视频内容与首页视频广告分离管理。广告负责曝光，视频模块负责存储、播放和独立权限。"
        />

        <Table
          columns={columns}
          dataSource={data || []}
          loading={isLoading}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1000 }}
        />
      </Space>

      <Modal
        title={editingVideo ? '编辑视频' : '新建视频'}
        open={modalOpen}
        onCancel={closeModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        width={760}
        destroyOnClose
      >
        <Form layout="vertical" form={form} onFinish={handleSubmit}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="视频标题" />
          </Form.Item>
          <Form.Item name="summary" label="摘要">
            <Input placeholder="视频摘要" />
          </Form.Item>
          <Form.Item name="description" label="详细描述">
            <TextArea rows={5} placeholder="视频详细描述" />
          </Form.Item>
          <Form.Item name="coverUrl" label="封面图 URL">
            <Input placeholder="https://example.com/cover.jpg" />
          </Form.Item>
          <Form.Item name="videoUrl" label="视频 URL" rules={[{ required: true, message: '请填写视频地址或先上传视频' }]}>
            <Space.Compact style={{ width: '100%' }}>
              <Input placeholder="/uploads/videos/xxx.mp4 或外部地址" />
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
          <Space style={{ width: '100%' }} size={16} align="start">
            <Form.Item name="durationSec" label="时长（秒）" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="sortOrder" label="排序值" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={16} align="start">
            <Form.Item
              name="accessLevel"
              label="访问权限"
              rules={[{ required: true, message: '请选择访问权限' }]}
              style={{ flex: 1 }}
            >
              <Select options={ACCESS_OPTIONS} />
            </Form.Item>
            <Form.Item name="isActive" label="上架状态" valuePropName="checked" style={{ flex: 1 }}>
              <Switch checkedChildren="上架" unCheckedChildren="下架" />
            </Form.Item>
            <Form.Item name="isFeatured" label="首页精选" valuePropName="checked" style={{ flex: 1 }}>
              <Switch checkedChildren="精选" unCheckedChildren="普通" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}
