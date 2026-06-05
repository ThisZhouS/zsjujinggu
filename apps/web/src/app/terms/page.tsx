'use client';

import { Card, Space, Typography } from 'antd';
import { PageHeader } from '@/components/common/PageChrome';

const { Paragraph, Title } = Typography;

export default function TermsPage() {
  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <PageHeader
        eyebrow="Terms"
        title="服务条款"
        description="使用平台即表示用户理解平台的数据来源、权限边界、内容上传规则和投资风险提示。"
      />

      <Card>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Title level={4}>数据服务</Title>
            <Paragraph>
              平台展示的数据来自公开披露和授权接口，并经过系统同步、存储、聚合和筛选。由于公开披露时间、数据源接口、网络同步和字段清洗差异，展示结果可能与原始公告存在时间差，用户应以法定披露文件为准。
            </Paragraph>
          </div>

          <div>
            <Title level={4}>账号与权限</Title>
            <Paragraph>
              核心数据服务面向登录用户开放。文章上传、视频专属内容、管理员控制面板等能力由平台按用户角色和授权状态控制，用户不得绕过权限或干扰平台运行。
            </Paragraph>
          </div>

          <div>
            <Title level={4}>内容责任</Title>
            <Paragraph>
              用户上传文章或资料时应确保内容合法、来源清晰，不得上传虚假、侵权、违法或误导性内容。平台可按运营规则下架、修改或删除不符合要求的内容。
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
