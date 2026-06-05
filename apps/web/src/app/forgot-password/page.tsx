'use client';

import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Typography, message } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }

    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendSmsCode = async () => {
    try {
      const phone = await form.validateFields(['phone']).then((values) => values.phone);
      await apiClient.post('/api/v1/auth/sms-code', {
        phone,
        purpose: 'reset-password',
      });
      message.success('验证码已发送');
      setCountdown(60);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(error.message || '发送失败');
    }
  };

  const handleSubmit = async (values: {
    phone: string;
    smsCode: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    setLoading(true);

    try {
      await apiClient.post('/api/v1/auth/reset-password', {
        phone: values.phone,
        smsCode: values.smsCode,
        newPassword: values.newPassword,
      });
      message.success('密码已重置，请重新登录');
      router.push('/login');
    } catch (error: any) {
      message.error(error.message || '重置失败');
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
      <Card style={{ width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ margin: 0 }}>找回密码</Title>
          <Text type="secondary">通过短信验证码重置登录密码</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          size="large"
          onFinish={handleSubmit}
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
            name="smsCode"
            rules={[
              { required: true, message: '请输入验证码' },
              { pattern: /^\d{6}$/, message: '短信验证码格式不正确' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="短信验证码"
              maxLength={6}
              addonAfter={
                <Button
                  type="link"
                  onClick={handleSendSmsCode}
                  disabled={countdown > 0}
                  style={{ padding: 0, minWidth: 80 }}
                >
                  {countdown > 0 ? `${countdown}秒` : '获取验证码'}
                </Button>
              }
            />
          </Form.Item>

          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少 6 位' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="新密码"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }

                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="确认新密码"
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
              重置密码
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Link href="/login">
              <Text type="secondary">返回登录</Text>
            </Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}
