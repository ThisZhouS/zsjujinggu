'use client';

import { Button, Layout, Menu, Result, Spin, theme } from 'antd';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  DashboardOutlined,
  UserOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  KeyOutlined,
  PicCenterOutlined,
  SyncOutlined,
  VideoCameraOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useAccount } from '@/hooks/useAccount';
import { isUnauthorizedError } from '@/lib/api-error';

const { Header, Sider, Content } = Layout;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: account, error, isLoading } = useAccount({ requireAuth: false });
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: '控制台',
    },
    {
      key: '/admin/investors',
      icon: <UserOutlined />,
      label: '牛散管理',
    },
    {
      key: '/admin/articles',
      icon: <FileTextOutlined />,
      label: '文章管理',
    },
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: '/admin/orders',
      icon: <ShoppingOutlined />,
      label: '订单管理',
    },
    {
      key: '/admin/api-keys',
      icon: <KeyOutlined />,
      label: 'API Key 管理',
    },
    {
      key: '/admin/ads',
      icon: <PicCenterOutlined />,
      label: '广告管理',
    },
    {
      key: '/admin/videos',
      icon: <VideoCameraOutlined />,
      label: '视频管理',
    },
    {
      key: '/admin/operations',
      icon: <WalletOutlined />,
      label: '运营配置',
    },
    {
      key: '/admin/sync',
      icon: <SyncOutlined />,
      label: '同步管理',
    },
  ];

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" tip="正在验证管理员权限" />
      </div>
    );
  }

  if (isUnauthorizedError(error) || !account) {
    return (
      <Result
        status="403"
        title="请先登录"
        subTitle="管理后台仅管理员可访问。"
        extra={<Button type="primary" onClick={() => router.replace('/login')}>去登录</Button>}
      />
    );
  }

  if (account.role !== 'ADMIN') {
    return (
      <Result
        status="403"
        title="需要管理员权限"
        subTitle="当前账号没有访问管理后台的权限。"
        extra={<Button onClick={() => router.replace('/')}>返回首页</Button>}
      />
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
          {collapsed ? '掘' : '掘金股管理后台'}
        </div>
        <Menu
          theme="dark"
          selectedKeys={[pathname]}
          mode="inline"
          items={menuItems}
          onClick={({ key }) => router.push(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 18, fontWeight: 'bold' }}>管理后台</span>
          <UserOutlined style={{ fontSize: 20 }} />
        </Header>
        <Content
          style={{
            margin: 16,
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
