'use client';

import { Card, Empty, List, Skeleton, Space, Tag, Typography } from 'antd';
import { ClockCircleOutlined, LinkOutlined } from '@ant-design/icons';
import Link from 'next/link';
import dayjs from 'dayjs';
import { ArticleItem } from '@/hooks/useArticles';

const { Paragraph, Text } = Typography;

interface RelatedNewsPanelProps {
  title: string;
  description: string;
  articles?: ArticleItem[];
  loading?: boolean;
  emptyText: string;
}

export function RelatedNewsPanel(props: RelatedNewsPanelProps) {
  const { title, description, articles = [], loading, emptyText } = props;

  return (
    <Card title={title} extra={<Text type="secondary">{description}</Text>}>
      {loading ? (
        <List
          itemLayout="vertical"
          dataSource={Array.from({ length: 3 }, (_, index) => ({ id: index }))}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <Skeleton active paragraph={{ rows: 2 }} />
            </List.Item>
          )}
        />
      ) : articles.length > 0 ? (
        <List
          itemLayout="vertical"
          dataSource={articles}
          renderItem={(article) => (
            <List.Item key={article.id}>
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                <Link href={`/articles/${article.id}`} className="font-medium hover:text-blue-600">
                  {article.title}
                </Link>
                {article.summary && (
                  <Paragraph type="secondary" style={{ margin: 0 }} ellipsis={{ rows: 2 }}>
                    {article.summary}
                  </Paragraph>
                )}
                <Space wrap size="small">
                  <Text type="secondary">
                    <ClockCircleOutlined /> {dayjs(article.publishDate).format('YYYY-MM-DD')}
                  </Text>
                  {article.author && <Text type="secondary">作者：{article.author}</Text>}
                  {article.automationProvider && (
                    <Tag color="blue">{article.automationProvider}</Tag>
                  )}
                  {article.sourceUrl && (
                    <a href={article.sourceUrl} target="_blank" rel="noreferrer">
                      <Space size={4}>
                        <LinkOutlined />
                        原文
                      </Space>
                    </a>
                  )}
                </Space>
              </Space>
            </List.Item>
          )}
        />
      ) : (
        <Empty
          description={emptyText}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      )}
    </Card>
  );
}
