'use client';

import {
  Button,
  Card,
  Space,
  Tag,
  Typography,
} from 'antd';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;

export default function PaymentPage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fb', padding: '48px 24px' }}>
      <Card style={{ maxWidth: 760, margin: '0 auto' }}>
        <Space direction="vertical" size={16} style={{ width: '100%', textAlign: 'center' }}>
          <Tag color="blue">登录用户权益</Tag>
          <Title level={2} style={{ margin: 0 }}>付费购买已停用</Title>
          <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 0 }}>
            原付费数据服务已降级为登录用户可访问，无需创建付费订单。请登录后直接使用牛散列表、股息率、增减持和共同持仓等功能。
          </Paragraph>
          <Space wrap style={{ justifyContent: 'center' }}>
            <Button type="primary" onClick={() => router.push('/login')}>去登录</Button>
            <Button onClick={() => router.push('/investors')}>进入牛散列表</Button>
          </Space>
        </Space>
      </Card>
    </div>
  );
}
