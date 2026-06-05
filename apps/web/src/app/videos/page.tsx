'use client';

import { Alert, Button, Card, Col, Empty, Pagination, Row, Space, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useState } from 'react';
import { useAccount } from '@/hooks/useAccount';
import { useVideos, VideoItem } from '@/hooks/useVideos';

const { Paragraph, Text, Title } = Typography;

function formatDuration(value: number | null) {
  if (!value || value <= 0) {
    return '时长待补充';
  }

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
}

function getAccessLabel(level: VideoItem['accessLevel']) {
  switch (level) {
    case 'PUBLIC':
      return { color: 'default', text: '游客可看' };
    case 'USER':
      return { color: 'blue', text: '登录可看' };
    case 'VIDEO':
      return { color: 'cyan', text: '视频专属' };
    case 'VIP':
      return { color: 'blue', text: '登录可看' };
    default:
      return { color: 'default', text: level };
  }
}

export default function VideosPage() {
  const [page, setPage] = useState(1);
  const { data: account } = useAccount({ requireAuth: false });
  const { data, isLoading } = useVideos({
    page,
    page_size: 12,
  });

  const hasVideoAccess = Boolean(account?.role === 'ADMIN' || account?.canAccessVideos);

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Title level={2} style={{ margin: 0 }}>视频专区</Title>
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            提供公开视频、登录可看内容和视频专属内容。视频专属权限由管理员单独授权。
          </Paragraph>
          <Space wrap>
            <Tag>当前状态</Tag>
            <Tag color={account ? 'blue' : 'default'}>{account ? '已登录' : '游客'}</Tag>
            <Tag color={hasVideoAccess ? 'cyan' : 'default'}>
              {hasVideoAccess ? '已开通视频专属权限' : '未开通视频专属权限'}
            </Tag>
            {!account && (
              <Link href="/login">
                <Button size="small">登录后查看更多</Button>
              </Link>
            )}
          </Space>
        </Space>
      </Card>

      <Alert
        type="info"
        showIcon
        message="首页轮播视频广告与视频专区已拆分。广告走 ads 模块，完整视频内容走 videos 模块，便于后续做独立权限和后台管理。"
      />

      {data?.list?.length ? (
        <>
          <Row gutter={[16, 16]}>
            {data.list.map((video) => {
              const access = getAccessLabel(video.accessLevel);
              return (
                <Col key={video.id} xs={24} sm={12} xl={8}>
                  <Link href={`/videos/${video.id}`}>
                    <Card
                      hoverable
                      cover={
                        video.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={video.coverUrl}
                            alt={video.title}
                            style={{ height: 220, objectFit: 'cover' }}
                          />
                        ) : (
                          <div className="h-[220px] bg-slate-900 text-white flex items-center justify-center text-lg">
                            视频封面待补充
                          </div>
                        )
                      }
                    >
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Space wrap>
                          <Tag color={access.color}>{access.text}</Tag>
                          {video.isFeatured ? <Tag color="red">精选</Tag> : null}
                        </Space>
                        <Title level={4} style={{ margin: 0 }}>{video.title}</Title>
                        <Paragraph ellipsis={{ rows: 3 }} type="secondary" style={{ marginBottom: 0 }}>
                          {video.summary || video.description || '暂无视频简介'}
                        </Paragraph>
                        <Text type="secondary">{formatDuration(video.durationSec)}</Text>
                      </Space>
                    </Card>
                  </Link>
                </Col>
              );
            })}
          </Row>

          <Pagination
            current={data.meta.page}
            pageSize={data.meta.page_size}
            total={data.meta.total}
            showSizeChanger={false}
            showQuickJumper
            showTotal={(total) => `共 ${total} 条`}
            onChange={(nextPage) => setPage(nextPage)}
            style={{ textAlign: 'center' }}
          />
        </>
      ) : isLoading ? (
        <Card loading />
      ) : (
        <Card>
          <Empty description="暂无可访问视频" />
        </Card>
      )}
    </Space>
  );
}
