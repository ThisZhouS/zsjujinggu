'use client';

import { Card, Row, Col, Tag, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useMarketOverview } from '@/hooks/useMarketOverview';

const { Text } = Typography;

function formatNumber(value: number | null | undefined, digits = 2) {
  if (value === null || value === undefined) {
    return '—';
  }

  return value.toFixed(digits);
}

function formatAmount(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return '—';
  }

  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(2)}亿`;
  }

  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}万`;
  }

  return value.toFixed(0);
}

export function MarketOverview() {
  const { data, isLoading } = useMarketOverview();
  const indices = data ? [data.shIndex, data.szIndex, data.bjIndex] : [];

  return (
    <Card title="市场概览" className="mb-6">
      <Row gutter={[16, 16]}>
        {indices.map((index) => (
          <Col key={index.code} xs={24} sm={8}>
            <Card size="small" loading={isLoading}>
              <div className="text-base font-semibold mb-2">{index.name}</div>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold">
                  {formatNumber(index.value)}
                </span>
                {index.changePercent !== null ? (
                  <Tag
                    color={index.changePercent >= 0 ? 'red' : 'green'}
                    icon={index.changePercent >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  >
                    {index.changePercent >= 0 ? '+' : ''}
                    {index.changePercent.toFixed(2)}%
                  </Tag>
                ) : (
                  <Tag>待同步</Tag>
                )}
              </div>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <div>
                  <span className="text-gray-500">涨跌:</span>
                  {index.change !== null ? (
                    <span className={index.change >= 0 ? 'text-red-500' : 'text-green-500'}>
                      {' '}{index.change >= 0 ? '+' : ''}{index.change.toFixed(2)}
                    </span>
                  ) : (
                    <span> —</span>
                  )}
                </div>
                <div>
                  <span className="text-gray-500">最高:</span>
                  {' '}{formatNumber(index.high)}
                </div>
                <div>
                  <span className="text-gray-500">最低:</span>
                  {' '}{formatNumber(index.low)}
                </div>
                <div>
                  <span className="text-gray-500">成交额:</span>
                  {' '}{formatAmount(index.turnover)}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <Text type="secondary">
                    {index.updatedAt
                      ? new Date(index.updatedAt).toLocaleString('zh-CN')
                      : '暂无快照'}
                  </Text>
                  <Tag color={index.source === 'live' ? 'gold' : index.source === 'database' ? 'blue' : 'default'}>
                    {index.source === 'live'
                      ? '实时补取'
                      : index.source === 'database'
                        ? '本地快照'
                        : '无数据'}
                  </Tag>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
}
