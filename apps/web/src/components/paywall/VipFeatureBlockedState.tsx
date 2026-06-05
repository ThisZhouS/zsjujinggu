'use client';

import { Button, Card, Result, Space, Typography } from 'antd';
import { LoginOutlined, LockOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Paragraph } = Typography;

interface VipFeatureBlockedStateProps {
  featureName: string;
  description?: string;
}

export function VipFeatureBlockedState(props: VipFeatureBlockedStateProps) {
  const { featureName, description } = props;

  return (
    <Card>
      <Result
        icon={<LockOutlined />}
        title="该功能需要登录后访问"
        subTitle={description || `${featureName} 当前仅对登录用户开放。`}
        extra={[
          <Link key="login" href="/login">
            <Button type="primary" icon={<LoginOutlined />}>
              去登录
            </Button>
          </Link>,
          <Link key="register" href="/register">
            <Button>注册账号</Button>
          </Link>,
        ]}
      />
      <Space direction="vertical" size={4} style={{ width: '100%', textAlign: 'center' }}>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>
          登录后可访问牛散增减持、共同持仓、十大增持、高管增持、股息率排行、个人股东等数据。
        </Paragraph>
      </Space>
    </Card>
  );
}
