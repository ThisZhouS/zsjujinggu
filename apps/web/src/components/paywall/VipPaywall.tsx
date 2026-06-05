'use client';

import { Result, Button, Card, Space, Typography } from 'antd';
import { CheckCircleOutlined, LoginOutlined } from '@ant-design/icons';
import Link from 'next/link';

interface VipPaywallProps {
  visible: boolean;
  onClose?: () => void;
  featureName?: string;
}

export function VipPaywall({ visible, onClose, featureName }: VipPaywallProps) {
  if (!visible) return null;

  const features = [
    '查看完整持仓明细',
    '牛散增持/减持/新进分析',
    '共同持仓分析',
    '涨幅榜历史数据',
    '股息率排行榜',
    '个人股东数据',
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-xl w-full mx-4">
        <Result
          status="info"
          icon={<LoginOutlined />}
          title="该功能需要登录后访问"
          subTitle={
            featureName
              ? `${featureName} 对登录用户开放，请先登录或注册账号。`
              : '登录后即可使用完整数据功能。'
          }
        />

        <Space direction="vertical" size={8} style={{ width: '100%', padding: '0 24px' }}>
          {features.map((feature) => (
            <Typography.Text key={feature}>
              <CheckCircleOutlined className="text-blue-500" /> {feature}
            </Typography.Text>
          ))}
        </Space>

        <div className="mt-6 text-center">
          <Space>
            <Link href="/login">
              <Button type="primary" size="large">去登录</Button>
            </Link>
            <Link href="/register">
              <Button size="large">注册账号</Button>
            </Link>
          </Space>
          <Button onClick={onClose} size="large" style={{ marginLeft: 12 }}>
            稍后再说
          </Button>
        </div>
      </Card>
    </div>
  );
}
