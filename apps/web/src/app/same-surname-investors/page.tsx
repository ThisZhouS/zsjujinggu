'use client';

import { Button, Card, Col, Input, Row, Select, Space, Table, Tag, Typography } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useState } from 'react';
import {
  SameSurnameGroup,
  useSameSurnameGroups,
} from '@/hooks/useInvestors';

const { Text } = Typography;

function formatMarketValue(value?: number | null) {
  if (!value) return '—';
  if (value >= 100000000) return `${(value / 100000000).toFixed(2)}亿`;
  return `${(value / 10000).toFixed(2)}万`;
}

export default function SameSurnameInvestorsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<'surname' | 'memberCount' | 'totalMarketValue'>('surname');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');

  const { data, isLoading, mutate } = useSameSurnameGroups({
    page,
    page_size: pageSize,
    keyword,
    sort,
    order,
  });

  const columns = [
    {
      title: '排名',
      key: 'index',
      width: 80,
      render: (_: unknown, __: SameSurnameGroup, index: number) => (page - 1) * pageSize + index + 1,
    },
    {
      title: '姓氏',
      dataIndex: 'surname',
      key: 'surname',
      width: 100,
      render: (value: string, record: SameSurnameGroup) => (
        <div className="flex flex-col">
          <span className="text-lg font-semibold">{value}</span>
          <Text type="secondary">{record.memberCount} 人</Text>
        </div>
      ),
    },
    {
      title: '同姓成员',
      dataIndex: 'investors',
      key: 'investors',
      render: (investors: SameSurnameGroup['investors']) => (
        <Space wrap size={[4, 4]}>
          {investors.slice(0, 6).map((investor) => (
            <Tag key={investor.investorId} className="mr-0">
              <Link href={`/investors/${investor.investorId}`}>{investor.name}</Link>
            </Tag>
          ))}
          {investors.length > 6 && <Tag className="mr-0">+{investors.length - 6}</Tag>}
        </Space>
      ),
    },
    {
      title: '共同持仓',
      key: 'shared',
      width: 120,
      render: (_: unknown, record: SameSurnameGroup) => (
        <div className="flex flex-col">
          <span className="font-medium">{record.sharedStockCount} 只</span>
          <Text type="secondary">总覆盖 {record.uniqueStockCount} 只</Text>
        </div>
      ),
    },
    {
      title: '共同持仓预览',
      dataIndex: 'sharedStocks',
      key: 'sharedStocks',
      render: (sharedStocks: SameSurnameGroup['sharedStocks']) => (
        <Space wrap size={[4, 4]}>
          {sharedStocks.slice(0, 4).map((stock) => (
            <Tag key={stock.stockCode} className="mr-0">
              {stock.stockName} {stock.investorCount}人
            </Tag>
          ))}
          {sharedStocks.length > 4 && <Tag className="mr-0">+{sharedStocks.length - 4}</Tag>}
        </Space>
      ),
    },
    {
      title: '组合总市值',
      dataIndex: 'totalMarketValue',
      key: 'totalMarketValue',
      width: 140,
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
    <Card
      title="同姓牛散"
      extra={<Text type="secondary">默认按姓氏排序，聚焦总市值 5 亿以上的已跟踪牛散，并计算组内共同持仓</Text>}
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Space>
          <Input
            placeholder="搜索姓氏或牛散姓名"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value);
              setPage(1);
            }}
            style={{ width: 260 }}
            allowClear
          />
          <Select
            value={sort}
            style={{ width: 140 }}
            options={[
              { value: 'surname', label: '按姓氏' },
              { value: 'memberCount', label: '按人数' },
              { value: 'totalMarketValue', label: '按市值' },
            ]}
            onChange={(value: 'surname' | 'memberCount' | 'totalMarketValue') => {
              setSort(value);
              setOrder(value === 'surname' ? 'asc' : 'desc');
              setPage(1);
            }}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setPage(1);
              mutate();
            }}
          >
            刷新
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={data?.list || []}
          loading={isLoading}
          rowKey={(record) => record.surname}
          expandable={{
            expandedRowRender: (record) => (
              <Row gutter={[16, 16]}>
                <Col xs={24} xl={10}>
                  <Card size="small" title="同姓成员明细">
                    <div className="space-y-3">
                      {record.investors.map((investor) => (
                        <div key={investor.investorId} className="flex items-center justify-between gap-4">
                          <div className="flex flex-col">
                            <Link href={`/investors/${investor.investorId}`} className="font-medium hover:text-blue-600">
                              {investor.name}
                            </Link>
                            <Text type="secondary">
                              {investor.stockCount} 只持仓 · {investor.latestReportDate}
                            </Text>
                          </div>
                          <span className="font-medium text-red-600">
                            {formatMarketValue(investor.totalMarketValue)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </Col>
                <Col xs={24} xl={14}>
                  <Card size="small" title="组内共同持仓">
                    {record.sharedStocks.length > 0 ? (
                      <div className="space-y-3">
                        {record.sharedStocks.map((stock) => (
                          <div key={stock.stockCode} className="flex items-start justify-between gap-4">
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {stock.stockName} ({stock.stockCode})
                              </span>
                              <Text type="secondary">
                                {stock.investorNames.join('、')}
                              </Text>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{stock.investorCount} 人持有</div>
                              <Text type="secondary">{formatMarketValue(stock.totalMarketValue)}</Text>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Text type="secondary">当前同姓分组暂无共同持仓</Text>
                    )}
                  </Card>
                </Col>
              </Row>
            ),
          }}
          pagination={{
            current: page,
            pageSize,
            total: data?.meta?.total || 0,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage);
              setPageSize(nextPageSize);
            },
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 个同姓分组`,
          }}
          scroll={{ x: 1200 }}
        />
      </Space>
    </Card>
  );
}
