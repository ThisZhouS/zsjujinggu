'use client';

import { Card, Typography, Space, Tag, Skeleton, Divider, Button } from 'antd';
import { ClockCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useArticleDetail } from '@/hooks/useArticles';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import Image from 'next/image';

const { Title, Paragraph, Text } = Typography;

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const { data, isLoading, error } = useArticleDetail(id);

  if (isLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <Text type="secondary">文章不存在或加载失败</Text>
          <div style={{ marginTop: 16 }}>
            <Button type="primary" onClick={() => router.push('/articles')}>
              返回文章列表
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const article = data;

  return (
    <Card>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push('/articles')}
        style={{ marginBottom: 16, padding: 0 }}
      >
        返回文章列表
      </Button>

      <Title level={2} style={{ marginBottom: 16 }}>
        {article.isPinned && <Tag color="red">置顶</Tag>}
        {article.title}
      </Title>

      <Space size="middle" style={{ marginBottom: 24 }}>
        <Text type="secondary">
          <ClockCircleOutlined /> {dayjs(article.publishDate).format('YYYY-MM-DD HH:mm')}
        </Text>
        {article.author && (
          <Text type="secondary">作者：{article.author}</Text>
        )}
        {article.category && (
          <Tag>
            {article.category === 'buffett' && '巴菲特'}
            {article.category === 'arkk' && 'ARKK'}
            {article.category === 'general' && '综合'}
          </Tag>
        )}
      </Space>

      {article.coverImage && (
        <div style={{ marginBottom: 24 }}>
          <Image
            src={article.coverImage}
            alt={article.title}
            width={1200}
            height={675}
            unoptimized
            style={{
              width: '100%',
              maxHeight: 400,
              height: 'auto',
              objectFit: 'cover',
              borderRadius: 8,
            }}
          />
        </div>
      )}

      {article.summary && (
        <>
          <Title level={5}>摘要</Title>
          <Paragraph style={{ fontSize: 16 }}>{article.summary}</Paragraph>
          <Divider />
        </>
      )}

      <Title level={5}>正文</Title>
      <div
        style={{
          fontSize: 16,
          lineHeight: 1.8,
          whiteSpace: 'pre-wrap',
        }}
      >
        {article.content}
      </div>

      {article.tags && article.tags.length > 0 && (
        <>
          <Divider />
          <Space>
            <Text type="secondary">标签：</Text>
            {article.tags.map((tag: string) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        </>
      )}
    </Card>
  );
}
