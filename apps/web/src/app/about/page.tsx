'use client';

import { Card, Space, Typography } from 'antd';
import { PageHeader } from '@/components/common/PageChrome';

const { Paragraph, Title } = Typography;

export default function AboutPage() {
  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <PageHeader
        eyebrow="About"
        title="关于我们"
        description="掘金股聚焦公开市场数据整理、股东持仓跟踪、公告与研报信息聚合，为登录用户提供结构化的数据检索和浏览服务。"
      />

      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Title level={4}>服务定位</Title>
            <Paragraph>
              平台数据来源于上市公司公告、公开披露信息、券商机构研报、行业公开调研及订单披露信息。系统会对原始数据进行清洗、聚合和字段标准化，便于用户查看牛散、机构、个人股东、分红股息率、涨跌统计和相关资讯。
            </Paragraph>
          </div>

          <div>
            <Title level={4}>使用边界</Title>
            <Paragraph>
              平台内容仅作行业信息参考，不构成任何投资建议、收益承诺或交易依据。用户应结合公开披露原文和自身判断独立决策。
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
