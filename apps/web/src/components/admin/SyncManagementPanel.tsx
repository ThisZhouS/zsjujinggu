'use client';

import { Alert, Button, Card, Col, Row, Select, Space, Statistic, Table, Tag, Typography, message } from 'antd';
import { PlayCircleOutlined, ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import { useState } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api';

type SyncStatus = 'RUNNING' | 'SUCCESS' | 'FAILED';
type SyncTaskName =
  | 'stock-list'
  | 'realtime-quotes'
  | 'limit-up'
  | 'kline-daily'
  | 'gainers-recalc'
  | 'business-data'
  | 'dividend-metrics'
  | 'star_investor_holdings';

interface SyncLogItem {
  id: number;
  taskName: string;
  status: SyncStatus;
  message: string | null;
  startTime: string;
  endTime: string | null;
  recordCount: number | null;
  createdAt: string;
}

interface SyncLogsResponse {
  list: SyncLogItem[];
  meta: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
}

interface DividendCoverageSlot {
  dataSlot: 'PRIMARY' | 'SECONDARY';
  totalRecords: number;
  cashDividendRecords: number;
  recordsWithPrice: number;
  yieldReadyRecords: number;
  totalDividendReadyRecords: number;
  missingYieldRecords: number;
  missingTotalDividendRecords: number;
  isComplete: boolean;
}

interface DividendCoverageResponse {
  dataSlot: 'ALL';
  slots: DividendCoverageSlot[];
  totalRecords: number;
  cashDividendRecords: number;
  missingYieldRecords: number;
  missingTotalDividendRecords: number;
  isComplete: boolean;
}

interface SyncActionConfig {
  key: SyncTaskName;
  title: string;
  description: string;
  endpoint: string;
  body?: Record<string, unknown>;
}

const TASK_OPTIONS: SyncActionConfig[] = [
  {
    key: 'stock-list',
    title: '股票列表同步',
    description: '同步股票基础资料和上市信息。',
    endpoint: '/api/v1/admin/sync/stock-list',
  },
  {
    key: 'realtime-quotes',
    title: '实时行情同步',
    description: '刷新股票现价和总市值数据。',
    endpoint: '/api/v1/admin/sync/realtime-quotes',
  },
  {
    key: 'limit-up',
    title: '涨停池同步',
    description: '同步涨停池并刷新缓存数据。',
    endpoint: '/api/v1/admin/sync/limit-up',
  },
  {
    key: 'kline-daily',
    title: 'K 线同步',
    description: '更新日 K 数据并写入数据库。',
    endpoint: '/api/v1/admin/sync/kline',
  },
  {
    key: 'gainers-recalc',
    title: '历史涨幅预计算',
    description: '重新计算 1w/2w/1m/3m/6m/12m 涨幅榜缓存。',
    endpoint: '/api/v1/admin/sync/gainers',
  },
  {
    key: 'business-data',
    title: '业务数据同步',
    description: '刷新全 A 股原始数据，并物化为牛散、持仓、分红和高管交易业务数据。',
    endpoint: '/api/v1/admin/sync/business-data',
  },
  {
    key: 'dividend-metrics',
    title: '股息率数据补齐',
    description: '按最新价格和总股本补齐 PRIMARY/SECONDARY 双槽位的股息率与分红总额。',
    endpoint: '/api/v1/dividends/backfill-metrics',
    body: { dataSlot: 'ALL' },
  },
  {
    key: 'star_investor_holdings',
    title: '明星投资人持仓同步',
    description: '抓取 TradingKey 巴菲特和木头姐持仓，并更新买入/卖出/持仓变化。',
    endpoint: '/api/v1/admin/sync/star-investor-holdings',
  },
];

const TASK_LABELS: Record<string, string> = TASK_OPTIONS.reduce((acc, item) => {
  acc[item.key] = item.title;
  return acc;
}, {} as Record<string, string>);

export function SyncManagementPanel() {
  const [page, setPage] = useState(1);
  const [taskFilter, setTaskFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<SyncStatus | undefined>();
  const [triggeringTask, setTriggeringTask] = useState<SyncTaskName | null>(null);

  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('page_size', '20');
  if (taskFilter) {
    params.set('taskName', taskFilter);
  }
  if (statusFilter) {
    params.set('status', statusFilter);
  }
  const query = params.toString();

  const fetcher = async (url: string) => apiClient.get<SyncLogsResponse>(url);
  const { data, isLoading, mutate } = useSWR<SyncLogsResponse>(
    `/api/v1/admin/sync/logs?${query}`,
    fetcher,
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch sync logs:', error);
      },
    },
  );
  const {
    data: dividendCoverage,
    isLoading: isDividendCoverageLoading,
    mutate: mutateDividendCoverage,
  } = useSWR<DividendCoverageResponse>(
    '/api/v1/dividends/metrics/coverage?dataSlot=ALL',
    async (url: string) => apiClient.get<DividendCoverageResponse>(url),
    {
      revalidateOnFocus: false,
      onError: (error) => {
        console.error('Failed to fetch dividend coverage:', error);
      },
    },
  );

  const currentLogs = data?.list ?? [];
  const runningCount = currentLogs.filter((item) => item.status === 'RUNNING').length;
  const successCount = currentLogs.filter((item) => item.status === 'SUCCESS').length;
  const failedCount = currentLogs.filter((item) => item.status === 'FAILED').length;

  const handleTrigger = async (task: SyncActionConfig) => {
    try {
      setTriggeringTask(task.key);
      const result = await apiClient.post<{
        success?: boolean;
        recordCount?: number;
        message?: string;
        mirroredRecords?: number;
        updatedRecords?: number;
        totalRecords?: number;
      }>(task.endpoint, task.body);

      if (result.success === false) {
        message.error(result.message || `${task.title}执行失败`);
      } else {
        const count =
          result.recordCount ??
          ((result.mirroredRecords ?? 0) + (result.updatedRecords ?? 0) || undefined) ??
          result.totalRecords;
        message.success(`${task.title}执行成功${count != null ? `，处理 ${count} 条记录` : ''}`);
      }

      mutate();
      if (task.key === 'business-data' || task.key === 'dividend-metrics') {
        mutateDividendCoverage();
      }
    } catch (error: any) {
      message.error(error.message || `${task.title}执行失败`);
    } finally {
      setTriggeringTask(null);
    }
  };

  const columns = [
    {
      title: '任务',
      dataIndex: 'taskName',
      key: 'taskName',
      render: (value: string) => TASK_LABELS[value] || value,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: SyncStatus) => {
        const colorMap: Record<SyncStatus, string> = {
          RUNNING: 'processing',
          SUCCESS: 'success',
          FAILED: 'error',
        };
        const labelMap: Record<SyncStatus, string> = {
          RUNNING: '运行中',
          SUCCESS: '成功',
          FAILED: '失败',
        };
        return <Tag color={colorMap[value]}>{labelMap[value]}</Tag>;
      },
    },
    {
      title: '记录数',
      dataIndex: 'recordCount',
      key: 'recordCount',
      width: 100,
      render: (value: number | null) => value ?? '—',
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString('zh-CN'),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 180,
      render: (value: string | null) => value ? new Date(value).toLocaleString('zh-CN') : '—',
    },
    {
      title: '耗时',
      key: 'duration',
      width: 120,
      render: (_: unknown, record: SyncLogItem) => {
        if (!record.endTime) {
          return '—';
        }

        const durationMs = new Date(record.endTime).getTime() - new Date(record.startTime).getTime();
        if (durationMs < 1000) {
          return `${durationMs} ms`;
        }

        return `${(durationMs / 1000).toFixed(1)} s`;
      },
    },
    {
      title: '备注',
      dataIndex: 'message',
      key: 'message',
      render: (value: string | null) => value || '—',
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message="可在后台手动触发关键同步任务，并查看最近执行日志。同步失败时会保留错误信息，便于排查。"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="日志总数" value={data?.meta.total ?? 0} prefix={<SyncOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="本页成功" value={successCount} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="本页失败" value={failedCount} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card>
            <Statistic title="本页运行中" value={runningCount} />
          </Card>
        </Col>
      </Row>

      <Card
        title="股息率数据覆盖率"
        loading={isDividendCoverageLoading}
        extra={
          <Button size="small" icon={<ReloadOutlined />} onClick={() => mutateDividendCoverage()}>
            刷新
          </Button>
        }
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Statistic title="现金分红记录" value={dividendCoverage?.cashDividendRecords ?? 0} />
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title="缺股息率"
              value={dividendCoverage?.missingYieldRecords ?? 0}
              valueStyle={{
                color: dividendCoverage?.missingYieldRecords ? '#cf1322' : '#3f8600',
              }}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title="缺分红总额"
              value={dividendCoverage?.missingTotalDividendRecords ?? 0}
              valueStyle={{
                color: dividendCoverage?.missingTotalDividendRecords ? '#cf1322' : '#3f8600',
              }}
            />
          </Col>
        </Row>
        <Table
          size="small"
          style={{ marginTop: 16 }}
          rowKey="dataSlot"
          pagination={false}
          dataSource={dividendCoverage?.slots ?? []}
          columns={[
            {
              title: '槽位',
              dataIndex: 'dataSlot',
              key: 'dataSlot',
            },
            {
              title: '总记录',
              dataIndex: 'totalRecords',
              key: 'totalRecords',
            },
            {
              title: '现金分红',
              dataIndex: 'cashDividendRecords',
              key: 'cashDividendRecords',
            },
            {
              title: '有价格',
              dataIndex: 'recordsWithPrice',
              key: 'recordsWithPrice',
            },
            {
              title: '股息率完整',
              dataIndex: 'yieldReadyRecords',
              key: 'yieldReadyRecords',
            },
            {
              title: '分红总额完整',
              dataIndex: 'totalDividendReadyRecords',
              key: 'totalDividendReadyRecords',
            },
            {
              title: '状态',
              dataIndex: 'isComplete',
              key: 'isComplete',
              render: (value: boolean) => (
                <Tag color={value ? 'success' : 'error'}>{value ? '完整' : '需补齐'}</Tag>
              ),
            },
          ]}
        />
      </Card>

      <Card title="手动同步">
        <Row gutter={[16, 16]}>
          {TASK_OPTIONS.map((task) => (
            <Col xs={24} md={12} xl={8} key={task.key}>
              <Card size="small">
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <Typography.Text strong>{task.title}</Typography.Text>
                  <Typography.Text type="secondary">{task.description}</Typography.Text>
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    loading={triggeringTask === task.key}
                    onClick={() => handleTrigger(task)}
                  >
                    立即执行
                  </Button>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card
        title="同步日志"
        extra={
          <Space>
            <Select
              allowClear
              placeholder="任务筛选"
              style={{ width: 180 }}
              value={taskFilter}
              onChange={(value) => {
                setTaskFilter(value);
                setPage(1);
              }}
              options={TASK_OPTIONS.map((task) => ({
                label: task.title,
                value: task.key,
              }))}
            />
            <Select
              allowClear
              placeholder="状态筛选"
              style={{ width: 140 }}
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              options={[
                { label: '运行中', value: 'RUNNING' },
                { label: '成功', value: 'SUCCESS' },
                { label: '失败', value: 'FAILED' },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={() => mutate()}>
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={currentLogs}
          loading={isLoading}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: 20,
            total: data?.meta.total ?? 0,
            onChange: (nextPage) => setPage(nextPage),
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
          }}
        />
      </Card>
    </Space>
  );
}
