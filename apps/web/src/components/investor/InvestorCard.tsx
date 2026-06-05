'use client';

import { Card, Avatar } from 'antd';
import Link from 'next/link';

interface InvestorCardProps {
  id: number;
  name: string;
  avatar?: string;
  totalMarketValue?: number;
  stockCount?: number;
  bio?: string;
}

export function InvestorCard({
  id,
  name,
  avatar,
  totalMarketValue,
  stockCount,
  bio,
}: InvestorCardProps) {
  return (
    <Link href={`/investors/${id}`}>
      <Card hoverable className="cursor-pointer h-full">
        <div className="flex items-start space-x-4">
          {avatar ? (
            <Avatar src={avatar} size={64} />
          ) : (
            <Avatar size={64}>{name[0]}</Avatar>
          )}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{name}</h3>
            <div className="space-y-1 text-sm text-gray-600">
              {totalMarketValue && (
                <div>
                  总市值:{' '}
                  <span className="font-medium">
                    {totalMarketValue >= 100000000
                      ? `${(totalMarketValue / 100000000).toFixed(2)}亿`
                      : `${(totalMarketValue / 10000).toFixed(2)}万`}
                  </span>
                </div>
              )}
              {stockCount && (
                <div>
                  持仓数量: <span className="font-medium">{stockCount} 只</span>
                </div>
              )}
            </div>
            {bio && (
              <div className="mt-2 text-xs text-gray-500 line-clamp-2">
                {bio}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
