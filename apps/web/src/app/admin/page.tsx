'use client';

import { Alert, Card, Col, Row, Space, Statistic, Tag, Typography } from 'antd';
import useSWR from 'swr';
import { SyncManagementPanel } from '@/components/admin/SyncManagementPanel';
import apiClient from '@/lib/api';

const { Title } = Typography;

type SyncStatus = 'RUNNING' | 'SUCCESS' | 'FAILED';

interface DashboardSummaryResponse {
  totalUsers: number;
  adminUsers: number;
  activeVipUsers: number;
  totalOrders: number;
  paidOrders: number;
  totalRevenue: number;
  totalApiKeys: number;
  activeApiKeys: number;
  totalAds: number;
  activeAds: number;
  totalArticles: number;
  trackedInvestors: number;
  latestSync: {
    taskName: string;
    status: SyncStatus;
    startTime: string;
    endTime: string | null;
    recordCount: number | null;
  } | null;
}

export default function AdminDashboardPage() {
  const fetcher = async (url: string) => apiClient.get<DashboardSummaryResponse>(url);
  const { data } = useSWR<DashboardSummaryResponse>('/api/v1/admin/dashboard', fetcher, {
    revalidateOnFocus: false,
    onError: (error) => {
      console.error('Failed to fetch admin dashboard summary:', error);
    },
  });

  const latestSyncStatusColor: Record<SyncStatus, string> = {
    RUNNING: 'processing',
    SUCCESS: 'success',
    FAILED: 'error',
  };

  const latestSyncStatusText: Record<SyncStatus, string> = {
    RUNNING: '运行中',
    SUCCESS: '成功',
    FAILED: '失败',
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        控制台
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="注册用户"
              value={data?.totalUsers ?? 0}
              suffix={data ? `/ 管理员 ${data.adminUsers}` : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="历史会员有效数" value={data?.activeVipUsers ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="订单总量"
              value={data?.totalOrders ?? 0}
              suffix={data ? `/ 已支付 ${data.paidOrders}` : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="支付收入" value={data?.totalRevenue ?? 0} precision={2} prefix="¥" />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="API Key"
              value={data?.totalApiKeys ?? 0}
              suffix={data ? `/ 启用 ${data.activeApiKeys}` : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic
              title="广告位素材"
              value={data?.totalAds ?? 0}
              suffix={data ? `/ 启用 ${data.activeAds}` : undefined}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="文章总数" value={data?.totalArticles ?? 0} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="跟踪牛散" value={data?.trackedInvestors ?? 0} />
          </Card>
        </Col>
      </Row>

      <Alert
        type={data?.latestSync?.status === 'FAILED' ? 'warning' : 'info'}
        showIcon
        message={
          data?.latestSync ? (
            <Space wrap>
              <span>最近同步：{data.latestSync.taskName}</span>
              <Tag color={latestSyncStatusColor[data.latestSync.status]}>
                {latestSyncStatusText[data.latestSync.status]}
              </Tag>
              <span>{new Date(data.latestSync.startTime).toLocaleString('zh-CN')}</span>
              {data.latestSync.recordCount != null && <span>处理 {data.latestSync.recordCount} 条</span>}
            </Space>
          ) : '暂无同步记录'
        }
      />

      <SyncManagementPanel />
    </Space>
  );
}
