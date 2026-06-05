'use client';

import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import { CheckOutlined, LoginOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useAccount } from '@/hooks/useAccount';

const { Paragraph, Text, Title } = Typography;

const loginFeatures = [
  '查看完整牛散、机构和个人股东数据',
  '访问牛散增持、减持、新进与共同持仓分析',
  '查看分红股息率、十大增持和高管增持榜单',
  '使用自选股、提醒、文章和核心股东数据功能',
];

const managedFeatures = [
  '文章上传权限由管理员指定用户开通',
  '视频专属内容由管理员单独授权',
  '后台控制面板仅管理员可访问',
  '支付与收款码配置仅保留为后台运营能力',
];

export default function PricingPage() {
  const { data: account } = useAccount({ requireAuth: false });

  return (
    <div style={{ padding: '48px 0', background: '#f5f7fb', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <Card>
            <Space direction="vertical" size={12} style={{ width: '100%', textAlign: 'center' }}>
              <Tag color="blue">登录用户权益</Tag>
              <Title level={2} style={{ margin: 0 }}>数据服务已开放给登录用户</Title>
              <Paragraph type="secondary" style={{ fontSize: 16, marginBottom: 0 }}>
                原付费数据权限已降级为登录可访问。注册并登录后即可浏览核心数据模块；少量内容生产和视频专属能力由管理员授权。
              </Paragraph>
              <Space wrap style={{ justifyContent: 'center' }}>
                {account ? (
                  <Link href="/investors">
                    <Button type="primary" icon={<SafetyCertificateOutlined />}>进入牛散列表</Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login">
                      <Button type="primary" icon={<LoginOutlined />}>登录</Button>
                    </Link>
                    <Link href="/register">
                      <Button>注册账号</Button>
                    </Link>
                  </>
                )}
              </Space>
            </Space>
          </Card>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card title="登录后可访问">
                <Space direction="vertical" size={10}>
                  {loginFeatures.map((feature) => (
                    <Text key={feature}>
                      <CheckOutlined style={{ color: '#16a34a', marginRight: 8 }} />
                      {feature}
                    </Text>
                  ))}
                </Space>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="管理员控制边界">
                <Space direction="vertical" size={10}>
                  {managedFeatures.map((feature) => (
                    <Text key={feature}>
                      <CheckOutlined style={{ color: '#2563eb', marginRight: 8 }} />
                      {feature}
                    </Text>
                  ))}
                </Space>
              </Card>
            </Col>
          </Row>
        </Space>
      </div>
    </div>
  );
}
