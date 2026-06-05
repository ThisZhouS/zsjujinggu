'use client';

import { Card, List, Typography, Space, Tag, Pagination, Tabs, Skeleton, Button } from 'antd';
import { ClockCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useArticles } from '@/hooks/useArticles';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import dayjs from 'dayjs';
import { useAccount } from '@/hooks/useAccount';
import { getToken, subscribeAuthChange } from '@/lib/auth';

const { Title, Text } = Typography;

type ArticleCategory = 'all' | 'buffett' | 'arkk' | 'general';

export default function ArticlesPage() {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<ArticleCategory>('all');
  const [accountEnabled, setAccountEnabled] = useState(false);
  const { data: account } = useAccount({ enabled: accountEnabled, requireAuth: false });
  const canManageArticles = account?.role === 'ADMIN' || account?.canUploadArticles;

  useEffect(() => {
    const syncAuthState = () => {
      setAccountEnabled(Boolean(getToken()));
    };

    syncAuthState();
    return subscribeAuthChange(syncAuthState);
  }, []);

  const params: any = { page, page_size: 20 };
  params.topicType = 'general';
  if (category !== 'all') {
    params.category = category;
  }
  const { data, isLoading, mutate } = useArticles(params);

  const tabItems = [
    { key: 'all', label: '全部文章' },
    { key: 'buffett', label: '巴菲特' },
    { key: 'arkk', label: 'ARKK' },
    { key: 'general', label: '综合' },
  ];

  const renderArticleItem = (article: any) => (
    <List.Item>
      <Link href={`/articles/${article.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Title level={5} style={{ margin: 0 }}>
            {article.isPinned && <Tag color="red">置顶</Tag>}
            {article.title}
          </Title>
          {article.summary && (
            <Text type="secondary">{article.summary}</Text>
          )}
          <Space size="middle">
            <Text type="secondary">
              <ClockCircleOutlined /> {dayjs(article.publishDate).format('YYYY-MM-DD')}
            </Text>
            {article.author && (
              <Text type="secondary">作者：{article.author}</Text>
            )}
            {article.tags && article.tags.length > 0 && (
              <Space size="small">
                {article.tags.slice(0, 3).map((tag: string) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            )}
          </Space>
        </Space>
      </Link>
    </List.Item>
  );

  return (
    <Card
      title="文章中心"
      extra={accountEnabled ? (
        <Link href="/account/articles">
          <Button type="primary">{canManageArticles ? '发布文章' : '文章投稿'}</Button>
        </Link>
      ) : undefined}
    >
      <Tabs
        items={tabItems}
        activeKey={category}
        onChange={(key) => {
          setCategory(key as ArticleCategory);
          setPage(1);
        }}
      />

      {isLoading ? (
        <List
          itemLayout="vertical"
          dataSource={Array(10).fill({}).map((_, i) => ({ id: i }))}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </List.Item>
          )}
        />
      ) : (
        <>
          <List
            itemLayout="vertical"
            dataSource={data?.list || []}
            renderItem={renderArticleItem}
          />

          {data?.meta && (
            <Pagination
              current={data.meta.page}
              pageSize={data.meta.page_size}
              total={data.meta.total}
              onChange={(p) => setPage(p)}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total) => `共 ${total} 条`}
              style={{ marginTop: 24, textAlign: 'center' }}
            />
          )}
        </>
      )}
    </Card>
  );
}
