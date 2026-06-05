'use client';

import { Typography } from 'antd';
import { SyncManagementPanel } from '@/components/admin/SyncManagementPanel';

const { Title } = Typography;

export default function AdminSyncPage() {
  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        同步管理
      </Title>
      <SyncManagementPanel />
    </div>
  );
}
