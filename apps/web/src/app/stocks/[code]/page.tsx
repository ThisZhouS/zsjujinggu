'use client';

import { Alert, Card, Col, Descriptions, Empty, List, Row, Space, Table, Tag, Typography } from 'antd';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dayjs from 'dayjs';
import { KLineChart } from '@/components/charts/KLineChart';
import { useArticles } from '@/hooks/useArticles';
import {
  StockLimitHistoryItem,
  StockPerformanceItem,
  StockTrackedHolder,
  useStockDetail,
  useStockKline,
  useStockLimitHistory,
  useStockPerformance,
  useStockRealtime,
  useStockTrackedHolders,
} from '@/hooks/useStocks';

const { Text } = Typography;

function formatMoney(value?: number | null) {
  if (value == null) return '—';
  if (value >= 100000000) return `¥${(value / 100000000).toFixed(2)}亿`;
  if (value >= 10000) return `¥${(value / 10000).toFixed(2)}万`;
  return `¥${value.toFixed(2)}`;
}

function formatShares(value: number) {
  if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿股`;
  if (value >= 10000) return `${(value / 10000).toFixed(2)}万股`;
  return `${value.toLocaleString()}股`;
}

function formatPercent(value?: number | null) {
  if (value == null) return '—';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export default function StockDetailPage() {
  const params = useParams();
  const code = typeof params?.code === 'string' ? decodeURIComponent(params.code) : '';

  const { data: stock, isLoading, error } = useStockDetail(code);
  const { data: klineData, isLoading: klineLoading } = useStockKline(code);
  const { data: performanceData, isLoading: performanceLoading } = useStockPerformance(code);
  const { data: limitHistory, isLoading: limitHistoryLoading } = useStockLimitHistory(code);
  const { data: realtimePayload, isLoading: realtimeLoading } = useStockRealtime(code);
  const { data: holders, isLoading: holdersLoading } = useStockTrackedHolders(code);
  const { data: stockNews, isLoading: stockNewsLoading } = useArticles({
    page: 1,
    page_size: 6,
    topicType: 'general',
    relatedStockCode: code,
  });

  if (isLoading && !stock) {
    return <Card loading />;
  }

  if (error || !stock) {
    return <Card>股票不存在或加载失败</Card>;
  }

  const performanceCards = performanceData || [];
  const newsList = stockNews?.list || [];

  const holderColumns = [
    {
      title: '牛散',
      dataIndex: 'investorName',
      key: 'investorName',
      width: 180,
      render: (value: string, record: StockTrackedHolder) => (
        <Link href={`/investors/${record.investorId}`} className="font-medium hover:text-blue-600">
          {value}
        </Link>
      ),
    },
    {
      title: '持股数量',
      dataIndex: 'holdCount',
      key: 'holdCount',
      width: 140,
      render: (value: number) => formatShares(value),
    },
    {
      title: '持股比例',
      dataIndex: 'holdRatio',
      key: 'holdRatio',
      width: 120,
      render: (value: number | null) => value != null ? `${value.toFixed(2)}%` : '—',
    },
    {
      title: '持仓市值',
      dataIndex: 'marketValue',
      key: 'marketValue',
      width: 140,
      render: (value: number) => formatMoney(value),
    },
    {
      title: '报告期',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 120,
      render: (value: string) => value || '—',
    },
  ];

  const performanceColumns = [
    {
      title: '区间',
      dataIndex: 'label',
      key: 'label',
      width: 100,
    },
    {
      title: '起始日',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (value: string | null) => value || '—',
    },
    {
      title: '起始价',
      dataIndex: 'startPrice',
      key: 'startPrice',
      width: 110,
      render: (value: number | null) => value != null ? `¥${value.toFixed(2)}` : '—',
    },
    {
      title: '最新价',
      dataIndex: 'endPrice',
      key: 'endPrice',
      width: 110,
      render: (value: number | null) => value != null ? `¥${value.toFixed(2)}` : '—',
    },
    {
      title: '区间涨幅',
      dataIndex: 'changePercent',
      key: 'changePercent',
      width: 120,
      render: (value: number | null) => (
        <Text
          strong
          style={{
            color:
              value == null ? undefined : value > 0 ? '#cf1322' : value < 0 ? '#1677ff' : undefined,
          }}
        >
          {formatPercent(value)}
        </Text>
      ),
    },
  ];

  const limitHistoryColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (value: StockLimitHistoryItem['type']) => (
        <Tag color={value === 'UP' ? 'red' : 'blue'}>
          {value === 'UP' ? '涨停' : '跌停'}
        </Tag>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 110,
      render: (value: number | null) => value != null ? `¥${value.toFixed(2)}` : '—',
    },
    {
      title: '涨跌幅',
      dataIndex: 'changePercent',
      key: 'changePercent',
      width: 110,
      render: (value: number | null) => formatPercent(value),
    },
    {
      title: '换手率',
      dataIndex: 'turnover',
      key: 'turnover',
      width: 110,
      render: (value: number | null) => value != null ? `${value.toFixed(2)}%` : '—',
    },
    {
      title: '封单金额',
      dataIndex: 'sealAmount',
      key: 'sealAmount',
      width: 140,
      render: (value: number | null) => formatMoney(value),
    },
    {
      title: '状态说明',
      dataIndex: 'statusText',
      key: 'statusText',
      ellipsis: true,
      render: (value: string | null) => value || '—',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <Row gutter={[24, 16]}>
          <Col xs={24} xl={16}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space wrap>
                <h1 className="text-3xl font-bold mb-0">{stock.name}</h1>
                <Tag color="blue">{stock.code}</Tag>
                {stock.industry && <Tag>{stock.industry}</Tag>}
              </Space>
              <Space wrap size={[24, 8]}>
                <div>
                  <div className="text-gray-400 text-sm">现价</div>
                  <div className="text-2xl font-semibold text-red-500">
                    {stock.currentPrice != null ? `¥${stock.currentPrice.toFixed(2)}` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">总市值</div>
                  <div className="text-lg font-semibold">{formatMoney(stock.totalMarketCap)}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">最新股息率</div>
                  <div className="text-lg font-semibold text-red-500">
                    {stock.latestDividendYield != null ? `${stock.latestDividendYield.toFixed(2)}%` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">每股分红</div>
                  <div className="text-lg font-semibold">
                    {stock.latestCashDividend != null ? `¥${stock.latestCashDividend.toFixed(4)}` : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">上市日期</div>
                  <div className="text-lg font-semibold">
                    {stock.listingDate ? dayjs(stock.listingDate).format('YYYY-MM-DD') : '—'}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">行情更新时间</div>
                  <div className="text-lg font-semibold">
                    {stock.priceUpdatedAt ? dayjs(stock.priceUpdatedAt).format('YYYY-MM-DD HH:mm') : '—'}
                  </div>
                </div>
              </Space>
            </Space>
          </Col>
          <Col xs={24} xl={8}>
            <Card size="small" title="分红股息摘要" className="mb-4">
              <div className="space-y-2">
                <div className="flex justify-between gap-4">
                  <Text type="secondary">分红年度</Text>
                  <Text strong>{stock.latestDividendYear ? `${stock.latestDividendYear}年` : '—'}</Text>
                </div>
                <div className="flex justify-between gap-4">
                  <Text type="secondary">除权除息日</Text>
                  <Text strong>
                    {stock.latestDividendDate ? dayjs(stock.latestDividendDate).format('YYYY-MM-DD') : '—'}
                  </Text>
                </div>
                <div className="flex justify-between gap-4">
                  <Text type="secondary">分红总额</Text>
                  <Text strong>{formatMoney(stock.latestTotalDividend)}</Text>
                </div>
                <div className="flex justify-between gap-4">
                  <Text type="secondary">计算价格</Text>
                  <Text strong>{stock.dividendPrice != null ? `¥${stock.dividendPrice.toFixed(2)}` : '—'}</Text>
                </div>
              </div>
            </Card>

            <Card size="small" title="公司收入摘要">
              <div className="space-y-2">
                <div className="flex justify-between gap-4">
                  <Text type="secondary">最新主营收入</Text>
                  <Text strong>{formatMoney(stock.mainRevenue)}</Text>
                </div>
                <div className="flex justify-between gap-4">
                  <Text type="secondary">收入报告期</Text>
                  <Text strong>{stock.revenueReportDate || '—'}</Text>
                </div>
                <div className="flex justify-between gap-4">
                  <Text type="secondary">所属市场</Text>
                  <Text strong>{stock.market}</Text>
                </div>
                <div className="flex justify-between gap-4">
                  <Text type="secondary">法人代表</Text>
                  <Text strong>{stock.principal || '—'}</Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card title="公司基础信息">
        <Descriptions
          column={{ xs: 1, sm: 1, md: 2 }}
          items={[
            {
              key: 'industry',
              label: '所属行业',
              children: stock.industry || '—',
            },
            {
              key: 'address',
              label: '注册地址',
              children: stock.address || '—',
            },
            {
              key: 'website',
              label: '公司网站',
              children: stock.companySite ? (
                <a href={stock.companySite} target="_blank" rel="noreferrer">
                  {stock.companySite}
                </a>
              ) : '—',
            },
            {
              key: 'principal',
              label: '法人代表',
              children: stock.principal || '—',
            },
            {
              key: 'description',
              label: '公司简介',
              span: 2,
              children: stock.companyDescription || '—',
            },
          ]}
        />
      </Card>

      <Card title="历史涨幅摘要">
        {performanceCards.length ? (
          <Row gutter={[16, 16]}>
            {performanceCards.map((item: StockPerformanceItem) => (
              <Col key={item.label} xs={12} md={8} xl={4}>
                <Card size="small">
                  <Space direction="vertical" size={4}>
                    <Text type="secondary">{item.label}</Text>
                    <Text
                      strong
                      style={{
                        fontSize: 20,
                        color:
                          item.changePercent == null
                            ? undefined
                            : item.changePercent > 0
                              ? '#cf1322'
                              : item.changePercent < 0
                                ? '#1677ff'
                                : undefined,
                      }}
                    >
                      {formatPercent(item.changePercent)}
                    </Text>
                    <Text type="secondary">
                      {item.startDate || '—'} 至 {item.endDate || '—'}
                    </Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        ) : performanceLoading ? (
          <Card loading />
        ) : (
          <Empty description="暂无历史涨幅数据" />
        )}

        {performanceCards.length ? (
          <Table
            style={{ marginTop: 16 }}
            columns={performanceColumns}
            dataSource={performanceCards}
            rowKey={(record) => record.label}
            pagination={false}
            scroll={{ x: 640 }}
          />
        ) : null}
      </Card>

      <Card title="K 线走势">
        {klineData?.length ? (
          <KLineChart
            data={klineData.map((item) => ({
              date: item.tradeDate,
              open: item.open,
              close: item.close,
              high: item.high,
              low: item.low,
              volume: item.volume,
            }))}
            height={460}
          />
        ) : klineLoading ? (
          <Card loading />
        ) : (
          <Empty description="暂无 K 线数据" />
        )}
      </Card>

      <Card title="历史涨跌停">
        <Table
          columns={limitHistoryColumns}
          dataSource={limitHistory || []}
          loading={limitHistoryLoading}
          rowKey={(record) => `${record.date}-${record.type}`}
          pagination={false}
          locale={{ emptyText: '暂无涨跌停记录' }}
          scroll={{ x: 920 }}
        />
      </Card>

      <Card
        title="关联牛散持仓"
        extra={<Text type="secondary">展示当前系统已跟踪牛散对该股的最新持仓</Text>}
      >
        <Table
          columns={holderColumns}
          dataSource={holders || []}
          loading={holdersLoading}
          rowKey={(record) => `${record.investorId}-${record.reportDate}`}
          pagination={false}
          locale={{ emptyText: '暂无关联牛散持仓' }}
          scroll={{ x: 860 }}
        />
      </Card>

      <Card title="股票新闻">
        {stockNewsLoading ? (
          <Card loading />
        ) : newsList.length ? (
          <List
            itemLayout="vertical"
            dataSource={newsList}
            renderItem={(article) => (
              <List.Item key={article.id}>
                <Link href={`/articles/${article.id}`} style={{ color: 'inherit' }}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space wrap>
                      <Text strong>{article.title}</Text>
                      <Tag>{dayjs(article.publishDate).format('YYYY-MM-DD')}</Tag>
                    </Space>
                    {article.summary ? <Text type="secondary">{article.summary}</Text> : null}
                  </Space>
                </Link>
              </List.Item>
            )}
          />
        ) : (
          <Empty description="暂无关联新闻" />
        )}
      </Card>

      <Card title="实时数据接口">
        {realtimeLoading ? (
          <Card loading />
        ) : realtimePayload ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type={realtimePayload.available ? 'success' : 'info'}
              message={realtimePayload.message}
              showIcon
            />
            <Descriptions
              column={{ xs: 1, sm: 1, md: 2 }}
              items={[
                {
                  key: 'realtimeCode',
                  label: '股票代码',
                  children: realtimePayload.data.code,
                },
                {
                  key: 'realtimeName',
                  label: '股票名称',
                  children: realtimePayload.data.name,
                },
                {
                  key: 'realtimePrice',
                  label: '当前价格',
                  children:
                    realtimePayload.data.currentPrice != null
                      ? `¥${realtimePayload.data.currentPrice.toFixed(2)}`
                      : '—',
                },
                {
                  key: 'realtimeMarketCap',
                  label: '当前市值',
                  children: formatMoney(realtimePayload.data.totalMarketCap),
                },
                {
                  key: 'realtimeUpdatedAt',
                  label: '更新时间',
                  span: 2,
                  children: realtimePayload.data.updatedAt
                    ? dayjs(realtimePayload.data.updatedAt).format('YYYY-MM-DD HH:mm:ss')
                    : '—',
                },
              ]}
            />
          </Space>
        ) : (
          <Empty description="暂无实时接口数据" />
        )}
      </Card>
    </div>
  );
}
