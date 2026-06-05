'use client';

import { Empty, Result, Spin } from 'antd';

interface AsyncContentProps {
  loading?: boolean;
  error?: any;
  empty?: boolean;
  children: React.ReactNode;
  loadingContent?: React.ReactNode;
  errorContent?: React.ReactNode;
  emptyContent?: React.ReactNode;
}

export function AsyncContent({
  loading,
  error,
  empty,
  children,
  loadingContent,
  errorContent,
  emptyContent,
}: AsyncContentProps) {
  if (loading) {
    return loadingContent || (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (error) {
    return errorContent || (
      <Result
        status="error"
        title="加载失败"
        subTitle="数据加载失败，请稍后重试"
      />
    );
  }

  if (empty) {
    return emptyContent || <Empty description="暂无数据" />;
  }

  return <>{children}</>;
}
