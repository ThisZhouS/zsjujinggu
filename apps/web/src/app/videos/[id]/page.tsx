'use client';

import { Alert, Button, Card, Descriptions, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import { useAccount } from '@/hooks/useAccount';
import { useVideoDetail } from '@/hooks/useVideos';
import { isLoginRequiredError, isVideoRequiredError, isVipRequiredError } from '@/lib/api-error';

const { Paragraph, Title, Text } = Typography;

function formatDuration(value: number | null) {
  if (!value || value <= 0) {
    return '时长待补充';
  }

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
}

export default function VideoDetailPage() {
  const params = useParams();
  const id = Number(params?.id);
  const { data: account } = useAccount({ requireAuth: false });
  const { data, error, isLoading } = useVideoDetail(Number.isFinite(id) ? id : null);

  if (isLoading) {
    return <Card loading />;
  }

  if (isLoginRequiredError(error)) {
    return (
      <Card>
        <Alert
          type="info"
          showIcon
          message="该视频需要登录后观看"
          description="登录后可访问“登录可看”层级的视频内容。"
          action={
            <Link href="/login">
              <Button type="primary">去登录</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  if (isVideoRequiredError(error)) {
    return (
      <Card>
        <Alert
          type="warning"
          showIcon
          message="该视频需要视频专属权限"
          description="视频专属权限与普通登录态分离，由管理员单独授权。"
          action={
            <Space>
              {!account && (
                <Link href="/login">
                  <Button>登录</Button>
                </Link>
              )}
            </Space>
          }
        />
      </Card>
    );
  }

  if (isVipRequiredError(error)) {
    return (
      <Card>
        <Alert
          type="warning"
          showIcon
          message="该视频需要登录后观看"
          description="登录后可访问该层级视频。"
          action={
            <Link href="/login">
              <Button type="primary">去登录</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  if (!data) {
    return <Card>视频不存在或暂不可访问</Card>;
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space wrap>
            <Title level={2} style={{ margin: 0 }}>{data.title}</Title>
            <Tag color={data.accessLevel === 'VIDEO' ? 'cyan' : data.accessLevel === 'PUBLIC' ? 'default' : 'blue'}>
              {data.accessLevel === 'VIP' ? '登录可看' : data.accessLevel}
            </Tag>
            {data.isFeatured ? <Tag color="red">精选</Tag> : null}
          </Space>
          <Text type="secondary">
            更新于 {dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm')} · {formatDuration(data.durationSec)}
          </Text>
          {data.summary ? (
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              {data.summary}
            </Paragraph>
          ) : null}
        </Space>
      </Card>

      <Card bodyStyle={{ padding: 0, overflow: 'hidden' }}>
        <video
          src={data.videoUrl}
          poster={data.coverUrl || undefined}
          controls
          preload="metadata"
          style={{ width: '100%', maxHeight: 720, background: '#000' }}
        />
      </Card>

      <Card title="视频说明">
        <Descriptions
          column={{ xs: 1, md: 2 }}
          items={[
            {
              key: 'access',
              label: '访问级别',
              children: data.accessLevel,
            },
            {
              key: 'duration',
              label: '时长',
              children: formatDuration(data.durationSec),
            },
            {
              key: 'createdAt',
              label: '创建时间',
              children: dayjs(data.createdAt).format('YYYY-MM-DD HH:mm:ss'),
            },
            {
              key: 'updatedAt',
              label: '更新时间',
              children: dayjs(data.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
            },
            {
              key: 'description',
              label: '详细描述',
              span: 2,
              children: data.description || '暂无详细描述',
            },
          ]}
        />
      </Card>
    </Space>
  );
}
