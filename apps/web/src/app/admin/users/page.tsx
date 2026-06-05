'use client';

import { ReloadOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Avatar, Button, Card, Input, Select, Space, Switch, Table, Tag, Typography, message } from 'antd';
import { useState } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api';

type UserRole = 'USER' | 'ADMIN';
type VipStatus = 'ACTIVE' | 'EXPIRED' | 'NONE';

interface AdminUserItem {
  id: number;
  phoneMasked: string;
  username: string | null;
  nickname: string | null;
  role: UserRole;
  canUploadArticles: boolean;
  canAccessVideos: boolean;
  vipExpiresAt: string | null;
  vipStatus: VipStatus;
  avatar: string | null;
  orderCount: number;
  apiKeyCount: number;
  watchlistCount: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminUsersResponse {
  list: AdminUserItem[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

const roleTagMap: Record<UserRole, { color: string; text: string }> = {
  ADMIN: { color: 'red', text: '管理员' },
  USER: { color: 'blue', text: '普通用户' },
};

const vipTagMap: Record<VipStatus, { color: string; text: string }> = {
  ACTIVE: { color: 'gold', text: '历史会员生效中' },
  EXPIRED: { color: 'default', text: '历史会员已过期' },
  NONE: { color: 'default', text: '无历史会员' },
};

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | undefined>();
  const [vipStatusFilter, setVipStatusFilter] = useState<VipStatus | undefined>();
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('page_size', '20');
  if (roleFilter) {
    params.set('role', roleFilter);
  }
  if (vipStatusFilter) {
    params.set('vipStatus', vipStatusFilter);
  }
  if (keyword.trim()) {
    params.set('keyword', keyword.trim());
  }

  const fetcher = async (url: string) => apiClient.get<AdminUsersResponse>(url);
  const { data, isLoading, mutate } = useSWR<AdminUsersResponse>(
    `/api/v1/admin/users?${params.toString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch admin users:', error);
      },
    },
  );

  const handleToggleUploadPermission = async (userId: number, canUploadArticles: boolean) => {
    setUpdatingUserId(userId);
    try {
      await apiClient.put(`/api/v1/admin/users/${userId}/upload-permission`, {
        canUploadArticles,
      });
      message.success(canUploadArticles ? '已开启文章上传权限' : '已关闭文章上传权限');
      await mutate();
    } catch (error: any) {
      message.error(error.message || '更新文章上传权限失败');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleToggleVideoPermission = async (userId: number, canAccessVideos: boolean) => {
    setUpdatingUserId(userId);
    try {
      await apiClient.put(`/api/v1/admin/users/${userId}/video-permission`, {
        canAccessVideos,
      });
      message.success(canAccessVideos ? '已开启视频专属权限' : '已关闭视频专属权限');
      await mutate();
    } catch (error: any) {
      message.error(error.message || '更新视频权限失败');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const renderVipInfo = (record: AdminUserItem) => {
    const status = vipTagMap[record.vipStatus];
    if (record.vipStatus === 'ACTIVE') {
      return (
        <Space direction="vertical" size={0}>
          <Tag color={status.color}>{status.text}</Tag>
          <Typography.Text type="secondary">
            到期：{record.vipExpiresAt ? new Date(record.vipExpiresAt).toLocaleDateString('zh-CN') : '—'}
          </Typography.Text>
        </Space>
      );
    }

    if (record.vipStatus === 'EXPIRED') {
      return (
        <Space direction="vertical" size={0}>
          <Tag color={status.color}>{status.text}</Tag>
          <Typography.Text type="secondary">
            过期：{record.vipExpiresAt ? new Date(record.vipExpiresAt).toLocaleDateString('zh-CN') : '—'}
          </Typography.Text>
        </Space>
      );
    }

    return <Tag color={status.color}>{status.text}</Tag>;
  };

  const columns = [
    {
      title: '用户',
      key: 'user',
      width: 280,
      render: (_: unknown, record: AdminUserItem) => (
        <Space align="start">
          <Avatar src={record.avatar || undefined} icon={<UserOutlined />} />
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{record.nickname || record.username || `用户 #${record.id}`}</Typography.Text>
            <Typography.Text type="secondary">{record.phoneMasked}</Typography.Text>
            {record.username && (
              <Typography.Text type="secondary">@{record.username}</Typography.Text>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (value: UserRole) => <Tag color={roleTagMap[value].color}>{roleTagMap[value].text}</Tag>,
    },
    {
      title: '文章上传',
      key: 'canUploadArticles',
      width: 180,
      render: (_: unknown, record: AdminUserItem) => {
        if (record.role === 'ADMIN') {
          return <Tag color="red">管理员默认允许</Tag>;
        }

        return (
          <Switch
            checked={record.canUploadArticles}
            checkedChildren="已开启"
            unCheckedChildren="未开启"
            loading={updatingUserId === record.id}
            onChange={(checked) => {
              void handleToggleUploadPermission(record.id, checked);
            }}
          />
        );
      },
    },
    {
      title: '视频权限',
      key: 'canAccessVideos',
      width: 180,
      render: (_: unknown, record: AdminUserItem) => {
        if (record.role === 'ADMIN') {
          return <Tag color="red">管理员默认允许</Tag>;
        }

        return (
          <Switch
            checked={record.canAccessVideos}
            checkedChildren="已开启"
            unCheckedChildren="未开启"
            loading={updatingUserId === record.id}
            onChange={(checked) => {
              void handleToggleVideoPermission(record.id, checked);
            }}
          />
        );
      },
    },
    {
      title: '历史会员状态',
      key: 'vipStatus',
      width: 170,
      render: (_: unknown, record: AdminUserItem) => renderVipInfo(record),
    },
    {
      title: '业务数据',
      key: 'stats',
      width: 200,
      render: (_: unknown, record: AdminUserItem) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>订单 {record.orderCount}</Typography.Text>
          <Typography.Text type="secondary">自选 {record.watchlistCount} / API Key {record.apiKeyCount}</Typography.Text>
        </Space>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '最近更新',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
  ];

  return (
    <Card
      title="用户管理"
      extra={
        <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
          刷新
        </Button>
      }
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="info"
          showIcon
          message="支持按手机号、用户名、昵称、角色和历史会员状态筛选用户，并可为指定普通用户开启或关闭文章上传、视频专属权限。"
        />

        <Space wrap>
          <Input
            placeholder="搜索手机号/用户名/昵称"
            style={{ width: 260 }}
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
          />
          <Select
            allowClear
            placeholder="角色筛选"
            style={{ width: 140 }}
            value={roleFilter}
            onChange={(value) => {
              setRoleFilter(value);
              setPage(1);
            }}
            options={[
              { label: '普通用户', value: 'USER' },
              { label: '管理员', value: 'ADMIN' },
            ]}
          />
          <Select
            allowClear
            placeholder="历史会员状态"
            style={{ width: 160 }}
            value={vipStatusFilter}
            onChange={(value) => {
              setVipStatusFilter(value);
              setPage(1);
            }}
            options={[
              { label: '历史会员生效中', value: 'ACTIVE' },
              { label: '历史会员已过期', value: 'EXPIRED' },
              { label: '无历史会员', value: 'NONE' },
            ]}
          />
        </Space>

        <Table
          columns={columns}
          dataSource={data?.list ?? []}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: 1280 }}
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
    </Card>
  );
}
