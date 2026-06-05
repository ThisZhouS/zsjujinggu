'use client';

import { Card, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const router = useRouter();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    }}>
      <Card style={{ width: 450, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>注册掘金股</Title>
          <Text type="secondary">专业的牛散持仓追踪平台</Text>
        </div>

        <RegisterForm onRegistered={() => router.push('/login')} />

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">已有账号？</Text>
          <Link href="/login">
            <Text>立即登录</Text>
          </Link>
        </div>
      </Card>
    </div>
  );
}
