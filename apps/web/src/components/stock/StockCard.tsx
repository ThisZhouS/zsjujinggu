'use client';

import { Card, Tag, Space } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';
import Link from 'next/link';

interface StockCardProps {
  code: string;
  name: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  marketCap?: number;
  industry?: string;
}

export function StockCard({
  code,
  name,
  currentPrice,
  change,
  changePercent,
  marketCap,
  industry,
}: StockCardProps) {
  return (
    <Link href={`/stocks/${code}`}>
      <Card hoverable size="small" className="cursor-pointer">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-semibold">{name}</div>
            <div className="text-xs text-gray-500">{code}</div>
          </div>
          {changePercent !== undefined && (
            <Tag
              color={changePercent >= 0 ? 'red' : 'green'}
              icon={changePercent >= 0 ? <ArrowUpOutlined /> : null}
            >
              {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
            </Tag>
          )}
        </div>

        {currentPrice !== undefined && (
          <div className="space-y-1">
            <div className="text-lg font-semibold">
              {currentPrice.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              涨跌: {change !== undefined && (change >= 0 ? '+' : '')}{change?.toFixed(2) || '—'}
            </div>
          </div>
        )}

        {marketCap !== undefined && (
          <div className="text-xs text-gray-500 mt-2">
            市值: {(marketCap / 100000000).toFixed(2)}亿
          </div>
        )}

        {industry && (
          <div className="text-xs text-blue-600 mt-1">
            {industry}
          </div>
        )}
      </Card>
    </Link>
  );
}
