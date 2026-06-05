'use client';

import { Card, List, Button, Space, Typography, Badge, Empty, message, Popconfirm } from 'antd';
import { BellOutlined, CheckOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { NotificationItem, useNotifications } from '@/hooks/useNotification';
import { useState } from 'react';
import dayjs from 'dayjs';
import apiClient from '@/lib/api';

const { Text, Paragraph } = Typography;

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, mutate } = useNotifications({ page, page_size: 20 });

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put('/api/v1/notifications/read-all');
      message.success('已全部标记为已读');
      mutate();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await apiClient.put(`/api/v1/notifications/${id}/read`);
      message.success('已标记为已读');
      mutate();
    } catch (error: any) {
      message.error(error.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/api/v1/notifications/${id}`);
      message.success('通知已删除');
      mutate();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const notifications = data?.list || [];

  return (
    <Card
      title={
        <Space>
          <BellOutlined />
          <span>消息通知</span>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
            刷新
          </Button>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleMarkAllRead}
            disabled={!notifications.length}
          >
            全部已读
          </Button>
        </Space>
      }
    >
      {notifications.length === 0 && !isLoading ? (
        <Empty description="暂无通知" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          loading={isLoading}
          dataSource={notifications}
          renderItem={(item: NotificationItem) => (
            <List.Item
              actions={[
                !item.isRead ? (
                  <Button
                    key="read"
                    type="link"
                    icon={<CheckOutlined />}
                    onClick={() => handleMarkRead(item.id)}
                  >
                    已读
                  </Button>
                ) : null,
                <Popconfirm
                  key="delete"
                  title="删除通知"
                  description="确认删除这条通知？"
                  okText="删除"
                  cancelText="取消"
                  onConfirm={() => handleDelete(item.id)}
                >
                  <Button type="link" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <Badge dot={!item.isRead} offset={[-4, 4]}>
                    <BellOutlined style={{ fontSize: 20 }} />
                  </Badge>
                }
                title={
                  <Text strong={!item.isRead}>{item.title}</Text>
                }
                description={
                  <Space direction="vertical" size="small">
                    <Paragraph
                      type="secondary"
                      ellipsis={{ rows: 2 }}
                      style={{ marginBottom: 0 }}
                    >
                      {item.content}
                    </Paragraph>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.meta?.total ?? 0,
            onChange: (nextPage) => setPage(nextPage),
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      )}
    </Card>
  );
}
