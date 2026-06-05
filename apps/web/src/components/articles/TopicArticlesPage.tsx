'use client';

import { Card, Empty, List, Pagination, Skeleton, Space, Tag, Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dayjs from 'dayjs';
import { useArticles } from '@/hooks/useArticles';

const { Paragraph, Text, Title } = Typography;

type TopicCategory = 'buffett' | 'arkk';

interface TopicArticlesPageProps {
  category: TopicCategory;
  title: string;
  description: string;
}

interface ArticleItem {
  id: number;
  title: string;
  summary?: string | null;
  coverImage?: string | null;
  author?: string | null;
  category?: TopicCategory | 'general' | null;
  publishDate: string;
  isPinned: boolean;
  tags?: string[];
}

export function TopicArticlesPage(props: TopicArticlesPageProps) {
  const { category, title, description } = props;
  const [page, setPage] = useState(1);
  const { data, isLoading } = useArticles({
    page,
    page_size: 12,
    category,
    topicType: 'general',
  });

  const articles = (data?.list ?? []) as ArticleItem[];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={6}>
          <Title level={2} style={{ margin: 0 }}>
            {title}
          </Title>
          <Text type="secondary">{description}</Text>
        </Space>
      </Card>

      <Card>
        {isLoading ? (
          <List
            itemLayout="vertical"
            dataSource={Array.from({ length: 6 }, (_, index) => ({ id: index }))}
            renderItem={(item) => (
              <List.Item key={item.id}>
                <Skeleton active paragraph={{ rows: 3 }} />
              </List.Item>
            )}
          />
        ) : articles.length > 0 ? (
          <>
            <List
              itemLayout="vertical"
              dataSource={articles}
              renderItem={(article) => (
                <List.Item key={article.id}>
                  <Link
                    href={`/articles/${article.id}`}
                    style={{ color: 'inherit', display: 'block', textDecoration: 'none' }}
                  >
                    <Space
                      direction="vertical"
                      size={12}
                      style={{ width: '100%' }}
                    >
                      {article.coverImage && (
                        <Image
                          src={article.coverImage}
                          alt={article.title}
                          width={1200}
                          height={675}
                          unoptimized
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: 260,
                            objectFit: 'cover',
                            borderRadius: 12,
                          }}
                        />
                      )}

                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Title level={4} style={{ margin: 0 }}>
                          {article.isPinned && <Tag color="red">置顶</Tag>}
                          {article.title}
                        </Title>

                        {article.summary && (
                          <Paragraph
                            type="secondary"
                            style={{ margin: 0 }}
                            ellipsis={{ rows: 2 }}
                          >
                            {article.summary}
                          </Paragraph>
                        )}

                        <Space wrap size="middle">
                          <Text type="secondary">
                            <ClockCircleOutlined /> {dayjs(article.publishDate).format('YYYY-MM-DD')}
                          </Text>
                          {article.author && (
                            <Text type="secondary">作者：{article.author}</Text>
                          )}
                          {article.tags?.slice(0, 4).map((tag) => (
                            <Tag key={tag}>{tag}</Tag>
                          ))}
                        </Space>
                      </Space>
                    </Space>
                  </Link>
                </List.Item>
              )}
            />

            {data?.meta && (
              <Pagination
                current={data.meta.page}
                pageSize={data.meta.page_size}
                total={data.meta.total}
                onChange={(nextPage) => setPage(nextPage)}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total) => `共 ${total} 条`}
                style={{ marginTop: 24, textAlign: 'center' }}
              />
            )}
          </>
        ) : (
          <Empty description="暂无专题文章" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </Space>
  );
}
