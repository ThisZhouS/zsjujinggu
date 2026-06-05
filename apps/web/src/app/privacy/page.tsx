'use client';

import { Card, Space, Typography } from 'antd';
import { PageHeader } from '@/components/common/PageChrome';

const { Paragraph, Title } = Typography;

export default function PrivacyPage() {
  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <PageHeader
        eyebrow="Privacy"
        title="隐私政策"
        description="本页面说明平台在注册、登录、权限控制、文章上传、视频访问和运营管理过程中对用户信息的处理边界。"
      />

      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Title level={4}>收集的信息</Title>
            <Paragraph>
              平台会在用户注册和登录时处理手机号、邮箱、验证码校验状态、登录状态、用户角色、文章上传权限和视频访问权限。管理员操作仅用于账号管理、内容管理和平台运营。
            </Paragraph>
          </div>

          <div>
            <Title level={4}>信息用途</Title>
            <Paragraph>
              相关信息用于身份验证、重复注册校验、权限边界控制、内容发布归属、通知提醒和必要的安全审计。平台不会将用户联系方式用于与服务无关的公开展示。
            </Paragraph>
          </div>

          <div>
            <Title level={4}>安全边界</Title>
            <Paragraph>
              管理员能力、文章上传、视频专属访问和数据服务访问均由后端权限控制。用户应妥善保管账号和验证码，不应向他人转让或共享登录凭据。
            </Paragraph>
          </div>

          <Paragraph type="secondary">
            注意：信息和数据来源于当前上市公司公告、券商机构研报、行业公开调研及订单披露信息。以上内容仅作行业信息参考，不构成任何投资建议。市场有风险，投资需谨慎。
          </Paragraph>
        </Space>
      </Card>
    </Space>
  );
}
