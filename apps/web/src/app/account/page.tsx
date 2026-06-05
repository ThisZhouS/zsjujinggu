'use client';

import { Card, Descriptions, Button, Form, Input, Space, message, Typography, Avatar, Tag } from 'antd';
import { UserOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { useAccount } from '@/hooks/useAccount';
import { useState } from 'react';
import dayjs from 'dayjs';
import apiClient from '@/lib/api';
import Link from 'next/link';

const { Title, Text } = Typography;

export default function AccountPage() {
  const { data, isLoading, mutate } = useAccount({ requireAuth: true });
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  const user = data;
  const canManageArticles = user?.role === 'ADMIN' || user?.canUploadArticles;
  const canAccessVideos = user?.role === 'ADMIN'
    || user?.canAccessVideos;

  const handleSave = async (values: any) => {
    try {
      await apiClient.put('/api/v1/account/profile', values);
      message.success('个人信息更新成功');
      setEditing(false);
      mutate();
    } catch (error: any) {
      message.error(error.message || '更新失败');
    }
  };

  const startEditing = () => {
    form.setFieldsValue({
      nickname: user?.nickname,
      avatar: user?.avatar,
    });
    setEditing(true);
  };

  if (isLoading) {
    return <Card loading />;
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title="个人信息"
        extra={
          editing ? (
            <Space>
              <Button onClick={() => setEditing(false)}>取消</Button>
              <Button type="primary" icon={<SaveOutlined />} onClick={() => form.submit()}>
                保存
              </Button>
            </Space>
          ) : (
            <Button icon={<EditOutlined />} onClick={startEditing}>
              编辑
            </Button>
          )
        }
      >
        {editing ? (
          <Form form={form} onFinish={handleSave} layout="vertical">
            <Form.Item
              name="nickname"
              label="昵称"
              rules={[{ max: 50, message: '昵称最多 50 位' }]}
            >
              <Input placeholder="昵称" maxLength={50} />
            </Form.Item>
            <Form.Item
              name="avatar"
              label="头像 URL"
              rules={[
                { type: 'url', message: '头像 URL 格式不正确' },
                { max: 500, message: '头像 URL 最多 500 位' },
              ]}
            >
              <Input placeholder="https://example.com/avatar.png" maxLength={500} />
            </Form.Item>
          </Form>
        ) : (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="头像">
              <Avatar size={48} icon={<UserOutlined />} src={user?.avatar} />
            </Descriptions.Item>
            <Descriptions.Item label="昵称">
              {user?.nickname || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="手机号">
              {user?.phone || '—'}
            </Descriptions.Item>
            <Descriptions.Item label="邮箱">
              <Space>
                <span>{user?.email || '—'}</span>
                {user?.emailVerifiedAt && <Tag color="green">已验证</Tag>}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="角色">
              <Tag color={user?.role === 'ADMIN' ? 'red' : 'blue'}>
                {user?.role === 'ADMIN' ? '管理员' : '普通用户'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="投稿权限">
              {canManageArticles ? (
                <Tag color="green">已开通文章上传</Tag>
              ) : (
                <Space>
                  <Tag>未开通</Tag>
                  <Text type="secondary">仅管理员授权用户可上传文章</Text>
                </Space>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="视频权限">
              {canAccessVideos ? (
                <Tag color="cyan">已开通视频访问</Tag>
              ) : (
                <Space>
                  <Tag>未开通</Tag>
                  <Text type="secondary">视频专属内容由管理员单独授权</Text>
                </Space>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="数据访问">
              <Tag color="green">登录用户可访问完整数据</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="注册时间">
              {user?.createdAt ? dayjs(user.createdAt).format('YYYY-MM-DD HH:mm') : '—'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="快捷入口">
        <Space size="large">
          <Link href="/account/orders">
            <Button>我的订单</Button>
          </Link>
          <Link href="/account/api-keys">
            <Button>API Key 管理</Button>
          </Link>
          {canManageArticles && (
            <Link href="/account/articles">
              <Button type="primary">我的文章</Button>
            </Link>
          )}
          <Link href="/watchlist">
            <Button>自选股</Button>
          </Link>
          <Link href="/notifications">
            <Button>消息通知</Button>
          </Link>
        </Space>
      </Card>
    </Space>
  );
}
