'use client';

import { Avatar, Dropdown, Layout, Tag } from 'antd';

const { Header } = Layout;

import { EditOutlined, LogoutOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';

const NotificationDropdown = dynamic(
  () => import('@/components/notification/NotificationDropdown').then((mod) => ({ default: mod.NotificationDropdown })),
  { ssr: false }
);
import { getToken, removeToken, subscribeAuthChange } from '@/lib/auth';
import { useAccount } from '@/hooks/useAccount';


export function AppHeader() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { data: account } = useAccount({ enabled: isLoggedIn, requireAuth: false });
  const canManageArticles = account?.role === 'ADMIN' || account?.canUploadArticles;

  useEffect(() => {
    const syncAuthState = () => {
      setIsLoggedIn(Boolean(getToken()));
    };

    syncAuthState();
    return subscribeAuthChange(syncAuthState);
  }, []);

  const userMenu = isLoggedIn ? [
    {
      key: 'account',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => router.push('/account'),
    },
    {
      key: 'article-submit',
      icon: <EditOutlined />,
      label: canManageArticles ? '我的文章' : '文章投稿',
      onClick: () => router.push('/account/articles'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => router.push('/account'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        removeToken();
        router.push('/');
      },
    },
  ] : [
    {
      key: 'login',
      label: '登录',
      onClick: () => router.push('/login'),
    },
    {
      key: 'register',
      label: '注册',
      onClick: () => router.push('/register'),
    },
  ];

  return (
    <Header className="king-header flex items-center justify-between px-6">
      <div className="flex items-center space-x-4">
        <div>
          <div className="text-xl font-bold text-slate-900">掘金股</div>
          <div className="text-xs text-slate-500">A 股股东、行情与内容数据工作台</div>
        </div>
        <Tag color="cyan" className="hidden md:inline-flex">
          业务数据双源
        </Tag>
      </div>

      <div className="flex items-center space-x-4">
        {isLoggedIn && (
          <NotificationDropdown />
        )}

        <Dropdown
          menu={{ items: userMenu }}
          placement="bottomRight"
        >
          <div className="flex items-center space-x-2 cursor-pointer">
            <Avatar icon={<UserOutlined />} />
            <span className="text-sm">
              {isLoggedIn ? '我的账户' : '登录/注册'}
            </span>
          </div>
        </Dropdown>
      </div>
    </Header>
  );
}
