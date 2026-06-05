'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, message, Typography, Tabs } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { setToken } from '@/lib/auth';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';

const { Title, Text } = Typography;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const [loginForm] = Form.useForm();

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const result = await apiClient.post('/api/v1/auth/login', {
        phone: values.phone,
        password: values.password,
      });

      // result 已经是内层 data 字段（axios 拦截器已解包 { code, message, data } 中的 data）
      // result 包含 { token, user }
      if (result?.token) {
        setToken(result.token);
        message.success('登录成功');
        router.push('/');
      } else {
        message.error(result.message || '登录失败');
      }
    } catch (error: any) {
      message.error(error.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

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
          <Title level={2} style={{ margin: 0 }}>掘金股</Title>
          <Text type="secondary">专业的牛散持仓追踪平台</Text>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as 'login' | 'register')}
          items={[
            {
              key: 'login',
              label: '登录',
              children: (
                <Form
                  form={loginForm}
                  onFinish={handleLogin}
                  layout="vertical"
                  size="large"
                >
                  <Form.Item
                    name="phone"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1\d{10}$/, message: '手机号格式不正确' },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="手机号"
                      maxLength={11}
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="密码"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                    >
                      登录
                    </Button>
                  </Form.Item>

                  <div style={{ textAlign: 'center' }}>
                    <Link href="/forgot-password">
                      <Text type="secondary">忘记密码？</Text>
                    </Link>
                  </div>
                </Form>
              ),
            },
            {
              key: 'register',
              label: '注册',
              children: (
                <RegisterForm
                  onRegistered={(values) => {
                    setActiveTab('login');
                    loginForm.setFieldsValue({ phone: values.phone });
                  }}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
