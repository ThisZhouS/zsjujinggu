'use client';

import { Card, Row, Col, Tabs } from 'antd';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { PieChart } from '@/components/charts/PieChart';
import { HoldingTable } from '@/components/investor/HoldingTable';
import { HoldingsHistoryTable } from '@/components/investor/HoldingsHistoryTable';
import { TopFlowTrackingTable } from '@/components/investor/TopFlowTrackingTable';
import { RelatedNewsPanel } from '@/components/articles/RelatedNewsPanel';
import {
  useInvestorDetail,
  useInvestorHoldingsHistory,
  useInvestorTopFlowTracking,
} from '@/hooks/useInvestors';
import { useInvestorNews } from '@/hooks/useArticles';

interface ShareholderDetailPageProps {
  entityName: string;
  enablePersonalSections?: boolean;
}

export function ShareholderDetailPage({
  entityName,
  enablePersonalSections = false,
}: ShareholderDetailPageProps) {
  const params = useParams();
  const id = params?.id ? parseInt(params.id as string, 10) : 0;

  const { data, isLoading, error } = useInvestorDetail(id);
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
  } = useInvestorHoldingsHistory(id);
  const {
    data: topFlowTracking,
    isLoading: topFlowTrackingLoading,
    error: topFlowTrackingError,
  } = useInvestorTopFlowTracking(enablePersonalSections ? id : 0);
  const {
    data: newsData,
    isLoading: newsLoading,
  } = useInvestorNews(enablePersonalSections ? id : 0, 6);

  if (isLoading) {
    return <Card loading />;
  }

  if (error || !data) {
    return <Card>{entityName}不存在或加载失败</Card>;
  }

  const pieData = data.pieData?.filter((item) => item.value > 0) ?? [];
  const holdings = (data.holdings ?? []).map((holding) => ({
    stockCode: holding.stockCode,
    stockName: holding.stockName,
    holdCount: holding.holdCount,
    holdChange: holding.holdChange,
    returnRate: holding.returnRate,
    holdRatio: holding.proportion,
    currentPrice: holding.currentPrice,
    totalMarketCap: null,
    reportDate: holding.reportDate || '—',
    avgCost: null,
    holdMarketValue: holding.marketValue,
    actualCost: null,
    sellProfit: null,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <Row gutter={[24, 16]} align="middle">
          <Col span={4}>
            {data.avatar ? (
              <Image
                src={data.avatar}
                alt={data.name}
                width={96}
                height={96}
                unoptimized
                className="w-24 h-24 rounded-full mx-auto object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 mx-auto flex items-center justify-center text-4xl text-white">
                {data.name[0]}
              </div>
            )}
          </Col>
          <Col span={20}>
            <h1 className="text-2xl font-bold mb-2">{data.name}</h1>
            <Row gutter={[32, 16]}>
              <Col>
                <div className="text-gray-400 text-sm">总市值</div>
                <div className="text-xl font-semibold text-red-500">
                  {data.totalMarketValue
                    ? `${(data.totalMarketValue / 100000000).toFixed(2)}亿`
                    : '—'}
                </div>
              </Col>
              <Col>
                <div className="text-gray-400 text-sm">持仓数量</div>
                <div className="text-xl font-semibold">{data.stockCount || 0} 只</div>
              </Col>
              <Col>
                <div className="text-gray-400 text-sm">更新时间</div>
                <div className="text-sm">
                  {data.updatedAt
                    ? new Date(data.updatedAt).toLocaleDateString('zh-CN')
                    : '—'}
                </div>
              </Col>
            </Row>
            {data.bio && (
              <div className="mt-3 text-sm text-gray-500">{data.bio}</div>
            )}
          </Col>
        </Row>
      </Card>

      <Card>
        <Tabs
          defaultActiveKey="holdings"
          items={[
            {
              key: 'holdings',
              label: '最新持仓',
              children: (
                <div className="space-y-4">
                  {pieData.length > 0 && (
                    <Row gutter={[16, 16]}>
                      <Col xs={24} lg={12}>
                        <Card title="持仓分布" size="small">
                          <PieChart data={pieData} />
                        </Card>
                      </Col>
                      <Col xs={24} lg={12}>
                        <Card title="持仓统计" size="small">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-500">持仓股票数</span>
                              <span className="font-semibold">{data.stockCount || 0} 只</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">总市值</span>
                              <span className="font-semibold">
                                {data.totalMarketValue
                                  ? `${(data.totalMarketValue / 100000000).toFixed(2)}亿`
                                  : '—'}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </Col>
                    </Row>
                  )}
                  <HoldingTable data={holdings} />
                </div>
              ),
            },
            {
              key: 'history',
              label: '持股历史',
              children: (
                <div>
                  {historyError ? (
                    <Card>
                      <div className="text-center text-gray-400 py-8">
                        加载持股历史失败，请稍后重试
                      </div>
                    </Card>
                  ) : (
                    <HoldingsHistoryTable data={historyData ?? []} loading={historyLoading} />
                  )}
                </div>
              ),
            },
            ...(enablePersonalSections
              ? [
                  {
                    key: 'top-flow-tracking',
                    label: '十大流通股东追踪',
                    children: (
                      <div>
                        {topFlowTrackingError ? (
                          <Card>
                            <div className="text-center text-gray-400 py-8">
                              加载十大流通股东追踪失败，请稍后重试
                            </div>
                          </Card>
                        ) : (
                          <TopFlowTrackingTable
                            data={topFlowTracking ?? []}
                            loading={topFlowTrackingLoading}
                          />
                        )}
                      </div>
                    ),
                  },
                  {
                    key: 'news',
                    label: '相关新闻',
                    children: (
                      <RelatedNewsPanel
                        title={`${entityName}相关新闻`}
                        description="已预留手工录入与自动化上传接口，后续可接入 OpenClaw / Harness。"
                        articles={newsData?.list ?? []}
                        loading={newsLoading}
                        emptyText="暂无相关新闻，后续可通过自动化接口补充。"
                      />
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Card>
    </div>
  );
}
