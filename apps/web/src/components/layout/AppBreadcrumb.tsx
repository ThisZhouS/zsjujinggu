'use client';

import { Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function AppBreadcrumb() {
  const pathname = usePathname();

  // 简单的面包屑生成逻辑
  const pathSegments = pathname.split('/').filter(Boolean);

  const items = [
    {
      title: <Link href="/"><HomeOutlined /></Link>,
    },
    ...pathSegments.map((segment, index) => {
      const url = '/' + pathSegments.slice(0, index + 1).join('/');
      const title = segment.charAt(0).toUpperCase() + segment.slice(1);
      return {
        title: <Link href={url}>{title}</Link>,
      };
    }),
  ];

  return <Breadcrumb items={items} className="mb-4" />;
}
