'use client';

import { PlayCircleOutlined } from '@ant-design/icons';
import { Card, Carousel, Col, Empty, Row, Space, Table, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useInvestors } from '@/hooks/useInvestors';
import { useArticles } from '@/hooks/useArticles';
import { useAdsByPosition } from '@/hooks/useAds';
import { useVideos, VideoItem } from '@/hooks/useVideos';
import { MarketOverview } from '@/components/market/MarketOverview';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { PageHeader } from '@/components/common/PageChrome';
import { compareNumber } from '@/lib/table-sorters';
import apiClient from '@/lib/api';
import {
  HiddenShareholderRow,
  useHiddenShareholdersInGainers,
  useHiddenShareholdersInLimitUp,
} from '@/hooks/useNaturalPersonHolders';

const { Text } = Typography;

function formatMarketValue(value?: number | null) {
  if (!value) return '—';
  if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
  return `${(value / 10000).toFixed(2)}万`;
}

function formatDuration(value: number | null) {
  if (!value || value <= 0) {
    return '时长待补充';
  }

  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${minutes}分${seconds.toString().padStart(2, '0')}秒`;
}

function getVideoAccessLabel(level: VideoItem['accessLevel']) {
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

export default function HomePage() {
  const { data: investors, isLoading: investorsLoading } = useInvestors({
    sort: 'totalMarketValue',
    page: 1,
    page_size: 10,
  });
  const { data: hiddenInGainers, isLoading: hiddenInGainersLoading } = useHiddenShareholdersInGainers('1m', 5, 120);
  const { data: hiddenInLimitUp, isLoading: hiddenInLimitUpLoading } = useHiddenShareholdersInLimitUp('1m', 5, 120);
  const { data: homeVideoAds, isLoading: homeVideoAdsLoading } = useAdsByPosition('HOME_VIDEO_HERO');
  const { data: featuredVideos, isLoading: featuredVideosLoading } = useVideos({
    page: 1,
    page_size: 4,
    featured: true,
  });

  const { data: articles, isLoading: articlesLoading } = useArticles({
    page: 1,
    page_size: 10,
    topicType: 'general',
  });

  const modules = [
    { title: '牛散列表', path: '/investors', desc: '查看所有牛散的持仓和市值' },
    { title: '机构列表', path: '/institutions', desc: '查看机构持仓、历史与市值分布' },
    { title: '同姓牛散', path: '/same-surname-investors', desc: '发现同姓牛散分组与共同持仓' },
    { title: '涨幅榜', path: '/top-gainers', desc: '今日涨幅排行榜' },
    { title: '牛散增持', path: '/investor-increase', desc: '登录后查看牛散增持分析' },
    { title: '牛散减持', path: '/investor-decrease', desc: '登录后查看牛散减持分析' },
    { title: '共同持仓', path: '/common-holdings', desc: '登录后查看多牛散共同持仓分析' },
    { title: '巴菲特持仓', path: '/buffett-holdings', desc: 'TradingKey 伯克希尔持仓与买卖变化' },
    { title: '木头姐持仓', path: '/arkk-holdings', desc: 'TradingKey ARK 持仓与买卖变化' },
    { title: '视频专区', path: '/videos', desc: '视频内容、广告位与独立权限' },
    { title: '文章资讯', path: '/articles', desc: '最新财经资讯和分析文章' },
  ];

  const recordAdClick = (adId: number) => {
    void apiClient.post(`/api/v1/ads/${adId}/click`, null, {
      skipAuthRedirect: true,
    }).catch(() => undefined);
  };

  const investorColumns = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: '牛散名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <Link href={`/investors/${record.id}`}>
          {name}
        </Link>
      ),
    },
    {
      title: '持仓数量',
      dataIndex: 'stockCount',
      key: 'stockCount',
      sorter: (a: any, b: any) => compareNumber(a.stockCount, b.stockCount),
    },
    {
      title: '总市值',
      dataIndex: 'totalMarketValue',
      key: 'totalMarketValue',
      sorter: (a: any, b: any) => compareNumber(a.totalMarketValue, b.totalMarketValue),
      defaultSortOrder: 'descend' as const,
      render: (value: number) => formatMarketValue(value),
    },
  ];

  const discoveryColumns = [
    {
      title: '牛散',
      dataIndex: 'shareholderName',
      key: 'shareholderName',
      width: 180,
      render: (name: string, record: HiddenShareholderRow) => (
        <div className="flex flex-col">
          <Link href={`/investors/${record.investorId}`} className="font-medium hover:text-blue-600">
            {name}
          </Link>
          <Text type="secondary">命中 {record.matchedStockCount} 只，合计 {record.stockCount} 只</Text>
        </div>
      ),
    },
    {
      title: '覆盖股票',
      dataIndex: 'matchedStocks',
      key: 'matchedStocks',
      render: (stocks: HiddenShareholderRow['matchedStocks']) => (
        <Space wrap size={[4, 4]}>
          {stocks.slice(0, 3).map((stock) => (
            <Tag key={`${stock.stockCode}-${stock.reportDate}`} className="mr-0">
              {stock.stockName} {stock.sourceMetricLabel}
            </Tag>
          ))}
          {stocks.length > 3 && <Tag className="mr-0">+{stocks.length - 3}</Tag>}
        </Space>
      ),
    },
    {
      title: '命中持仓市值',
      dataIndex: 'matchedMarketValue',
      key: 'matchedMarketValue',
      width: 120,
      render: (value: number) => <span className="font-semibold text-red-600">{formatMarketValue(value)}</span>,
    },
    {
      title: '最新报告期',
      dataIndex: 'latestReportDate',
      key: 'latestReportDate',
      width: 120,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="掘金股"
        title="A 股股东与行情数据工作台"
        description="聚合牛散、机构、涨跌榜、分红股息、新闻与视频内容；前端布局已按业务模块重新分区。"
        extra={<Link href="/top-gainers" className="text-white underline underline-offset-4">查看市场榜单</Link>}
      />

      <MarketOverview />

      <Card
        title="全局搜索"
        extra={<Text type="secondary">支持股东姓名、股票代码与股票名称，结果将以新窗口打开</Text>}
      >
        <GlobalSearch />
      </Card>

      <Card
        title="首页视频广告"
        extra={<Link href="/videos">进入视频专区</Link>}
      >
        {homeVideoAds?.length ? (
          <Carousel autoplay dotPosition="bottom">
            {homeVideoAds.map((ad) => (
              <div key={ad.id}>
                <a
                  href={ad.linkUrl}
                  onClick={() => recordAdClick(ad.id)}
                  target={/^https?:\/\//.test(ad.linkUrl) ? '_blank' : undefined}
                  rel={/^https?:\/\//.test(ad.linkUrl) ? 'noreferrer' : undefined}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-slate-950">
                    {ad.mediaType === 'VIDEO' && ad.videoUrl ? (
                      <video
                        src={ad.videoUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        className="h-[240px] w-full object-cover md:h-[320px]"
                      />
                    ) : ad.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="h-[240px] w-full object-cover md:h-[320px]"
                      />
                    ) : (
                      <div className="flex h-[240px] items-center justify-center text-lg text-white md:h-[320px]">
                        视频广告素材待补充
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-5 text-white md:p-8">
                      <Space direction="vertical" size={8}>
                        <Space wrap>
                          <Tag color={ad.mediaType === 'VIDEO' ? 'cyan' : 'blue'}>
                            {ad.mediaType === 'VIDEO' ? '视频广告' : '图片广告'}
                          </Tag>
                          <Tag color="gold">首页曝光位</Tag>
                        </Space>
                        <Typography.Title level={3} style={{ color: '#fff', margin: 0 }}>
                          {ad.title}
                        </Typography.Title>
                        <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.88)', marginBottom: 0 }}>
                          {ad.content}
                        </Typography.Paragraph>
                      </Space>
                    </div>
                  </div>
                </a>
              </div>
            ))}
          </Carousel>
        ) : (
          <Empty description={homeVideoAdsLoading ? '视频广告加载中' : '暂未配置首页视频广告'} />
        )}
      </Card>

      <Card
        title="隐藏牛散发现"
        extra={<Text type="secondary">基于真实业务持仓快照，反查近 1 月强势股与涨停股中的已跟踪牛散</Text>}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card
              size="small"
              title="最近涨幅最大股票中隐藏的牛散"
              bordered={false}
              className="bg-slate-50"
              extra={<Link href="/investors">更多</Link>}
            >
              <Table
                columns={discoveryColumns}
                dataSource={hiddenInGainers?.list || []}
                loading={hiddenInGainersLoading}
                rowKey={(record) => `gainer-${record.investorId}`}
                pagination={false}
                size="small"
                scroll={{ x: 760 }}
              />
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card
              size="small"
              title="最近涨停板中隐藏的牛散"
              bordered={false}
              className="bg-orange-50"
              extra={<Link href="/investors">更多</Link>}
            >
              <Table
                columns={discoveryColumns}
                dataSource={hiddenInLimitUp?.list || []}
                loading={hiddenInLimitUpLoading}
                rowKey={(record) => `limit-${record.investorId}`}
                pagination={false}
                size="small"
                scroll={{ x: 760 }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card title="功能模块">
        <Row gutter={[16, 16]}>
          {modules.map((module) => (
            <Col key={module.path} xs={24} sm={12} md={8}>
              <Link href={module.path}>
                <Card
                  hoverable
                  className="h-full"
                  bodyStyle={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                >
                  <h3 className="text-lg font-semibold mb-2">{module.title}</h3>
                  <p className="text-gray-600 text-sm flex-1">{module.desc}</p>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="视频专区精选" extra={<Link href="/videos">查看全部</Link>}>
        {featuredVideos?.list?.length ? (
          <Row gutter={[16, 16]}>
            {featuredVideos.list.map((video) => {
              const access = getVideoAccessLabel(video.accessLevel);
              return (
                <Col key={video.id} xs={24} md={12} xl={6}>
                  <Link href={`/videos/${video.id}`}>
                    <Card
                      hoverable
                      className="h-full overflow-hidden"
                      cover={
                        video.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={video.coverUrl}
                            alt={video.title}
                            className="h-[220px] w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-[220px] items-center justify-center bg-slate-900 text-lg text-white">
                            <PlayCircleOutlined className="mr-2" />
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
                        <Typography.Title level={5} style={{ margin: 0 }}>
                          {video.title}
                        </Typography.Title>
                        <Typography.Paragraph ellipsis={{ rows: 3 }} type="secondary" style={{ marginBottom: 0 }}>
                          {video.summary || video.description || '暂无视频简介'}
                        </Typography.Paragraph>
                        <Text type="secondary">{formatDuration(video.durationSec)}</Text>
                      </Space>
                    </Card>
                  </Link>
                </Col>
              );
            })}
          </Row>
        ) : featuredVideosLoading ? (
          <Row gutter={[16, 16]}>
            {[0, 1, 2, 3].map((key) => (
              <Col key={key} xs={24} md={12} xl={6}>
                <Card loading className="h-full" />
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="暂无精选视频" />
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="牛散市值排行榜" extra={<Link href="/investors">查看全部</Link>}>
            <Table
              columns={investorColumns}
              dataSource={investors?.list || []}
              loading={investorsLoading}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="最新文章" extra={<Link href="/articles">查看全部</Link>}>
            <div className="space-y-4">
              {articlesLoading && <div>加载中...</div>}
              {articles?.list?.map((article: any) => (
                <div key={article.id} className="border-b pb-3 last:border-0">
                  <Link href={`/articles/${article.id}`} className="font-medium hover:text-blue-600">
                    {article.title}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(article.publishDate).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
