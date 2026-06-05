'use client';

import { useEffect, useState } from 'react';
import { Button, Form, Input, message } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import apiClient from '@/lib/api';

export interface RegisterFormValues {
  phone: string;
  email: string;
  password: string;
  smsCode: string;
  emailCode: string;
  username?: string;
  nickname?: string;
}

interface RegisterFormProps {
  submitText?: string;
  onRegistered?: (values: RegisterFormValues) => void;
}

export function RegisterForm({ submitText = '注册', onRegistered }: RegisterFormProps) {
  const [loading, setLoading] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [form] = Form.useForm<RegisterFormValues>();

  useEffect(() => {
    if (smsCountdown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => setSmsCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [smsCountdown]);

  useEffect(() => {
    if (emailCountdown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => setEmailCountdown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [emailCountdown]);

  const handleRegister = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const result = await apiClient.post<{ token?: string }>('/api/v1/auth/register', {
        phone: values.phone,
        email: values.email,
        password: values.password,
        smsCode: values.smsCode,
        emailCode: values.emailCode,
        username: values.username,
        nickname: values.nickname,
      });

      if (!result?.token) {
        message.error('注册失败');
        return;
      }

      message.success('注册成功，请登录');
      onRegistered?.(values);
    } catch (error: any) {
      message.error(error.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSmsCode = async () => {
    try {
      const phone = await form.validateFields(['phone']).then((values) => values.phone);
      await apiClient.post('/api/v1/auth/sms-code', {
        phone,
        purpose: 'register',
      });
      message.success('验证码已发送');
      setSmsCountdown(60);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(error.message || '发送失败');
    }
  };

  const handleSendEmailCode = async () => {
    try {
      const email = await form.validateFields(['email']).then((values) => values.email);
      await apiClient.post('/api/v1/auth/email-code', {
        email,
        purpose: 'register',
      });
      message.success('邮箱验证码已发送');
      setEmailCountdown(60);
    } catch (error: any) {
      if (error?.errorFields) {
        return;
      }
      message.error(error.message || '发送失败');
    }
  };

  return (
    <Form
      form={form}
      onFinish={handleRegister}
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
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '邮箱格式不正确' },
        ]}
      >
        <Input
          prefix={<MailOutlined />}
          placeholder="邮箱"
          maxLength={120}
        />
      </Form.Item>

      <Form.Item
        name="smsCode"
        rules={[
          { required: true, message: '请输入短信验证码' },
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
              disabled={smsCountdown > 0}
              style={{ padding: 0, minWidth: 80 }}
            >
              {smsCountdown > 0 ? `${smsCountdown}秒` : '获取验证码'}
            </Button>
          }
        />
      </Form.Item>

      <Form.Item
        name="emailCode"
        rules={[
          { required: true, message: '请输入邮箱验证码' },
          { pattern: /^\d{6}$/, message: '邮箱验证码格式不正确' },
        ]}
      >
        <Input
          prefix={<MailOutlined />}
          placeholder="邮箱验证码"
          maxLength={6}
          addonAfter={
            <Button
              type="link"
              onClick={handleSendEmailCode}
              disabled={emailCountdown > 0}
              style={{ padding: 0, minWidth: 80 }}
            >
              {emailCountdown > 0 ? `${emailCountdown}秒` : '获取邮箱码'}
            </Button>
          }
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少 6 位' },
          { max: 32, message: '密码最多 32 位' },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
          maxLength={32}
        />
      </Form.Item>

      <Form.Item
        name="nickname"
        rules={[{ required: true, message: '请输入昵称' }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="昵称"
          maxLength={50}
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
          {submitText}
        </Button>
      </Form.Item>
    </Form>
  );
}
