'use client';

import { Badge, Dropdown, List, Empty, Button, Spin } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { getToken } from '@/lib/auth';

interface Notification {
  id: number;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationResponse {
  list: Notification[];
  unreadCount: number;
}

export function NotificationDropdown() {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (visible) {
      fetchNotifications();
    }
  }, [visible]);

  const fetchNotifications = async () => {
    if (!getToken()) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const result = await apiClient.get<NotificationResponse>('/api/v1/notifications', {
        skipAuthRedirect: true,
      });
      setNotifications(result.list);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.put('/api/v1/notifications/read-all', undefined, {
        skipAuthRedirect: true,
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // 服务端渲染时返回简单占位，避免 hydration 错误
  if (!isClient) {
    return (
      <Button
        type="text"
        icon={<BellOutlined />}
        className="flex items-center"
      />
    );
  }

  const menuItems = [
    {
      key: 'notifications',
      label: (
        <div className="w-80">
          <div className="flex justify-between items-center p-3 border-b">
            <span className="font-semibold">通知</span>
            {unreadCount > 0 && (
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={handleMarkAllRead}
              >
                全部已读
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center p-4">
                <Spin />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4">
                <Empty description="暂无通知" />
              </div>
            ) : (
              <List
                dataSource={notifications}
                renderItem={(item) => (
                  <List.Item
                    key={item.id}
                    className={`cursor-pointer ${!item.isRead ? 'bg-blue-50' : ''}`}
                    style={{ padding: '12px' }}
                  >
                    <div className="flex-1">
                      <div
                        className={`text-sm font-medium ${
                          !item.isRead ? 'text-black' : 'text-gray-600'
                        }`}
                      >
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.content}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(item.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    {!item.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </List.Item>
                )}
              />
            )}
          </div>

          <div className="p-3 border-t text-center">
            <Link href="/notifications">
              <Button type="link" size="small">
                查看全部通知
              </Button>
            </Link>
          </div>
        </div>
      ),
    },
  ];

  return (
    <Dropdown
      menu={{ items: menuItems }}
      open={visible}
      onOpenChange={setVisible}
      placement="bottomRight"
      trigger={['click']}
    >
      <Badge count={unreadCount} overflowCount={99}>
        <Button
          type="text"
          icon={<BellOutlined />}
          className="flex items-center"
        />
      </Badge>
    </Dropdown>
  );
}
