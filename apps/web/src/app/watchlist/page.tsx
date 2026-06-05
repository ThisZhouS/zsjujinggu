'use client';

import { BellOutlined, DeleteOutlined, PauseCircleOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Empty, Modal, Space, Table, Tag, Typography, message } from 'antd';
import { PriceAlertModal } from '@/components/stock/PriceAlertModal';
import { StockSearch, StockSearchSelection } from '@/components/stock/StockSearch';
import { PriceAlertItem, usePriceAlerts } from '@/hooks/usePriceAlerts';
import { WatchlistItem, useWatchlist } from '@/hooks/useWatchlist';
import { useState } from 'react';
import apiClient from '@/lib/api';

const { Text } = Typography;

export default function WatchlistPage() {
  const [page, setPage] = useState(1);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockSearchSelection | null>(null);
  const [adding, setAdding] = useState(false);
  const [alertTarget, setAlertTarget] = useState<WatchlistItem | null>(null);
  const { data, isLoading, mutate } = useWatchlist({ page, page_size: 20 });
  const { data: alerts, isLoading: alertsLoading, mutate: mutateAlerts } = usePriceAlerts();

  const closeAddModal = () => {
    setAddModalOpen(false);
    setSelectedStock(null);
    setAdding(false);
  };

  const handleAddStock = async () => {
    if (!selectedStock) {
      message.warning('请先从搜索结果中选择一只股票');
      return;
    }

    try {
      setAdding(true);
      await apiClient.post('/api/v1/watchlist', {
        stockCode: selectedStock.stockCode,
      });
      message.success(`${selectedStock.stockName} 已加入自选股`);
      closeAddModal();
      mutate();
    } catch (error: any) {
      message.error(error.message || '添加失败');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await apiClient.delete(`/api/v1/watchlist/${id}`);
      message.success('已删除');
      mutate();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const handleDeactivateAlert = async (id: number) => {
    try {
      await apiClient.post(`/api/v1/price-alerts/${id}/deactivate`);
      message.success('提醒已停用');
      mutateAlerts();
    } catch (error: any) {
      message.error(error.message || '停用失败');
    }
  };

  const handleDeleteAlert = async (id: number) => {
    try {
      await apiClient.delete(`/api/v1/price-alerts/${id}`);
      message.success('提醒已删除');
      mutateAlerts();
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const watchlistColumns = [
    {
      title: '股票代码',
      dataIndex: 'stockCode',
      key: 'stockCode',
      width: 120,
    },
    {
      title: '股票名称',
      dataIndex: 'stockName',
      key: 'stockName',
    },
    {
      title: '现价',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      render: (value: number | null) => value != null ? value.toFixed(2) : '—',
    },
    {
      title: '涨跌幅',
      dataIndex: 'changePercent',
      key: 'changePercent',
      render: (value: number | null) => {
        if (value == null) {
          return '—';
        }

        return (
          <span className={value >= 0 ? 'text-red-500' : 'text-green-500'}>
            {value >= 0 ? '+' : ''}{value.toFixed(2)}%
          </span>
        );
      },
    },
    {
      title: '添加时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => value ? new Date(value).toLocaleString('zh-CN') : '—',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: WatchlistItem) => (
        <Space size="small">
          <Button
            type="link"
            icon={<BellOutlined />}
            onClick={() => setAlertTarget(record)}
          >
            提醒
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleRemove(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const alertColumns = [
    {
      title: '股票',
      key: 'stock',
      render: (_: unknown, record: PriceAlertItem) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.stockName}</Text>
          <Text type="secondary">{record.stockCode}</Text>
        </Space>
      ),
    },
    {
      title: '提醒条件',
      key: 'condition',
      render: (_: unknown, record: PriceAlertItem) => (
        <Text>
          {record.alertType === 'ABOVE' ? '价格高于' : '价格低于'} {record.targetPrice.toFixed(2)}
        </Text>
      ),
    },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_: unknown, record: PriceAlertItem) => {
        if (record.triggeredAt) {
          return <Tag color="gold">已触发</Tag>;
        }
        return (
          <Tag color={record.isActive ? 'green' : 'default'}>
            {record.isActive ? '监控中' : '已停用'}
          </Tag>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => value ? new Date(value).toLocaleString('zh-CN') : '—',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: PriceAlertItem) => (
        <Space size="small">
          {record.isActive && !record.triggeredAt && (
            <Button
              type="link"
              icon={<PauseCircleOutlined />}
              onClick={() => handleDeactivateAlert(record.id)}
            >
              停用
            </Button>
          )}
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteAlert(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card
        title="自选股"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAddModalOpen(true)}
            >
              添加股票
            </Button>
          </Space>
        }
      >
        <Alert
          type="info"
          showIcon
          message="搜索股票后可加入自选股，并针对任意自选股设置价格高于/低于提醒。"
          style={{ marginBottom: 16 }}
        />

        <Table
          columns={watchlistColumns}
          dataSource={data?.list ?? []}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.meta?.total ?? 0,
            onChange: (nextPage) => setPage(nextPage),
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />

        {!data?.list?.length && !isLoading && (
          <Empty
            description="暂无自选股"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      <Card title="价格提醒">
        <Table
          columns={alertColumns}
          dataSource={alerts ?? []}
          loading={alertsLoading}
          rowKey="id"
          pagination={false}
        />

        {!alerts?.length && !alertsLoading && (
          <Empty
            description="暂无价格提醒"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      <Modal
        title="添加自选股"
        open={addModalOpen}
        onCancel={closeAddModal}
        onOk={handleAddStock}
        okText="添加"
        confirmLoading={adding}
        destroyOnClose
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text type="secondary">
            输入股票代码或名称，从实时搜索结果中选择后即可加入自选股。
          </Text>
          <StockSearch
            onSelect={(stock) => setSelectedStock(stock)}
            placeholder="搜索股票代码或名称"
          />
          {selectedStock && (
            <Alert
              type="success"
              showIcon
              message={`已选择：${selectedStock.stockCode} ${selectedStock.stockName}`}
            />
          )}
        </Space>
      </Modal>

      {alertTarget && (
        <PriceAlertModal
          visible={Boolean(alertTarget)}
          stockCode={alertTarget.stockCode}
          stockName={alertTarget.stockName}
          currentPrice={alertTarget.currentPrice ?? 0}
          onCancel={() => setAlertTarget(null)}
          onSuccess={() => {
            setAlertTarget(null);
            mutateAlerts();
          }}
        />
      )}
    </Space>
  );
}
