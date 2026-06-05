'use client';

import { Card, Row, Col, Tag, Space, Button } from 'antd';
import { ArrowUpOutlined, RedoOutlined } from '@ant-design/icons';
import { useStockPrice } from '@/hooks/useStockPrice';
import Link from 'next/link';

interface WatchlistItem {
  id: number;
  stockCode: string;
  stockName: string;
  sortOrder: number;
  createdAt: string;
}

interface WatchlistCardProps {
  items: WatchlistItem[];
  loading?: boolean;
  onRefresh?: () => void;
}

export function WatchlistCard({ items, loading, onRefresh }: WatchlistCardProps) {
  return (
    <Card
      title="自选股"
      extra={
        <Button icon={<RedoOutlined />} size="small" onClick={onRefresh}>
          刷新
        </Button>
      }
      loading={loading}
    >
      <Row gutter={[16, 16]}>
        {items.map((item) => (
          <WatchlistItemCard key={item.id} item={item} />
        ))}
      </Row>
    </Card>
  );
}

interface WatchlistItemCardProps {
  item: WatchlistItem;
}

function WatchlistItemCard({ item }: WatchlistItemCardProps) {
  const { data: stockPrice, isLoading } = useStockPrice(item.stockCode);

  return (
    <Col xs={24} sm={12} md={8} lg={6}>
      <Link href={`/stocks/${item.stockCode}`}>
        <Card
          hoverable
          size="small"
          className="h-full"
          bodyStyle={{ padding: '12px' }}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-semibold">{item.stockName}</div>
              <div className="text-xs text-gray-500">{item.stockCode}</div>
            </div>
            {stockPrice?.data && (
              <Tag
                color={stockPrice.data.changePercent >= 0 ? 'red' : 'green'}
                icon={stockPrice.data.changePercent >= 0 ? <ArrowUpOutlined /> : null}
              >
                {stockPrice.data.changePercent >= 0 ? '+' : ''}
                {stockPrice.data.changePercent.toFixed(2)}%
              </Tag>
            )}
          </div>

          {isLoading ? (
            <div className="text-gray-400">加载中...</div>
          ) : stockPrice?.data ? (
            <div className="space-y-1">
              <div className="text-lg font-semibold">
                {stockPrice.data.currentPrice.toFixed(2)}
              </div>
              <div className="text-xs text-gray-500">
                涨跌: {stockPrice.data.change >= 0 ? '+' : ''}
                {stockPrice.data.change.toFixed(2)}
              </div>
            </div>
          ) : (
            <div className="text-gray-400">暂无行情</div>
          )}
        </Card>
      </Link>
    </Col>
  );
}
