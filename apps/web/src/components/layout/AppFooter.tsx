'use client';

import { Layout } from 'antd';
import Link from 'next/link';

const { Footer } = Layout;

export function AppFooter() {
  return (
    <Footer className="text-center text-gray-500 text-sm">
      <div>
        掘金股 © 2024
      </div>
      <div className="mt-2">
        <Link href="/about" className="text-gray-500 hover:text-gray-700">关于我们</Link>
        {' | '}
        <Link href="/privacy" className="text-gray-500 hover:text-gray-700">隐私政策</Link>
        {' | '}
        <Link href="/terms" className="text-gray-500 hover:text-gray-700">服务条款</Link>
      </div>
    </Footer>
  );
}
