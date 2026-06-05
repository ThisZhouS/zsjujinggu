'use client';

import { Menu, Layout } from 'antd';
import { useEffect, useState } from 'react';

const { Sider } = Layout;
import {
  AppstoreOutlined,
  EditOutlined,
  HomeOutlined,
  UserOutlined,
  FileTextOutlined,
  WalletOutlined,
  BellOutlined,
  KeyOutlined,
  GoldOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getToken, subscribeAuthChange } from '@/lib/auth';


export function AppSidebar() {
  const pathname = usePathname();
  const [accountEnabled, setAccountEnabled] = useState(false);

  useEffect(() => {
    const syncAuthState = () => {
      setAccountEnabled(Boolean(getToken()));
    };

    syncAuthState();
    return subscribeAuthChange(syncAuthState);
  }, []);

  const menuItems: any[] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link href="/">首页</Link>,
    },
    {
      key: 'shareholder-group',
      icon: <UserOutlined />,
      label: '股东洞察',
      children: [
        {
          key: '/investors',
          label: <Link href="/investors">牛散列表</Link>,
        },
        {
          key: '/institutions',
          label: <Link href="/institutions">机构列表</Link>,
        },
        {
          key: '/same-surname-investors',
          label: <Link href="/same-surname-investors">同姓牛散</Link>,
        },
        {
          key: '/investor-increase',
          label: <Link href="/investor-increase">牛散增持</Link>,
        },
        {
          key: '/investor-decrease',
          label: <Link href="/investor-decrease">牛散减持</Link>,
        },
        {
          key: '/investor-new',
          label: <Link href="/investor-new">牛散新进</Link>,
        },
      ],
    },
    {
      key: 'market-group',
      icon: <LineChartOutlined />,
      label: '市场榜单',
      children: [
        {
          key: '/top-gainers',
          label: <Link href="/top-gainers">涨幅榜</Link>,
        },
        {
          key: '/limit-stats',
          label: <Link href="/limit-stats">涨跌统计</Link>,
        },
        {
          key: '/common-holdings',
          label: <Link href="/common-holdings">共同持仓</Link>,
        },
        {
          key: '/top-increase',
          label: <Link href="/top-increase">十大增持</Link>,
        },
        {
          key: '/executive-increase',
          label: <Link href="/executive-increase">高管增持</Link>,
        },
        {
          key: '/buffett-holdings',
          label: <Link href="/buffett-holdings">巴菲特持仓</Link>,
        },
        {
          key: '/arkk-holdings',
          label: <Link href="/arkk-holdings">木头姐持仓</Link>,
        },
      ],
    },
    {
      key: 'data-service-group',
      icon: <GoldOutlined />,
      label: '数据服务',
      children: [
        {
          key: '/individual-shareholders',
          label: <Link href="/individual-shareholders">个人股东</Link>,
        },
        {
          key: '/dividend-yield',
          label: <Link href="/dividend-yield">股息率</Link>,
        },
        {
          key: '/pricing',
          label: <Link href="/pricing">访问说明</Link>,
        },
      ],
    },
    {
      key: 'content-group',
      icon: <FileTextOutlined />,
      label: '内容中心',
      children: [
        {
          key: '/articles',
          label: <Link href="/articles">文章资讯</Link>,
        },
        {
          key: '/videos',
          label: <Link href="/videos">视频专区</Link>,
        },
        ...(accountEnabled ? [{
          key: '/account/articles',
          icon: <EditOutlined />,
          label: <Link href="/account/articles">文章投稿</Link>,
        }] : []),
      ],
    },
    {
      key: 'workspace-group',
      icon: <AppstoreOutlined />,
      label: '工作台',
      children: [
        {
          key: '/watchlist',
          icon: <WalletOutlined />,
          label: <Link href="/watchlist">自选股</Link>,
        },
        {
          key: '/notifications',
          icon: <BellOutlined />,
          label: <Link href="/notifications">通知中心</Link>,
        },
      ],
    },
    {
      key: '/account',
      icon: <KeyOutlined />,
      label: <Link href="/account">个人中心</Link>,
    },
  ];

  return (
    <Sider width={232} breakpoint="lg" collapsedWidth={0} className="king-sidebar overflow-y-auto">
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        defaultOpenKeys={['shareholder-group', 'market-group']}
        items={menuItems}
        style={{ height: '100%', borderRight: 0 }}
      />
    </Sider>
  );
}
