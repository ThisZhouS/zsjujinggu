'use client';

import { Card, Space, Typography } from 'antd';
import type { ReactNode } from 'react';

const { Paragraph, Title } = Typography;

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  extra?: ReactNode;
}

interface FilterBarProps {
  children: ReactNode;
  extra?: ReactNode;
}

export function PageHeader({ title, description, eyebrow, extra }: PageHeaderProps) {
  return (
    <div className="page-hero">
      <div>
        {eyebrow ? <div className="page-hero__eyebrow">{eyebrow}</div> : null}
        <Title level={2} className="page-hero__title">
          {title}
        </Title>
        {description ? (
          <Paragraph className="page-hero__description">
            {description}
          </Paragraph>
        ) : null}
      </div>
      {extra ? <div className="page-hero__extra">{extra}</div> : null}
    </div>
  );
}

export function FilterBar({ children, extra }: FilterBarProps) {
  return (
    <Card size="small" className="filter-bar">
      <div className="filter-bar__inner">
        <Space wrap size={[12, 12]}>
          {children}
        </Space>
        {extra ? <div className="filter-bar__extra">{extra}</div> : null}
      </div>
    </Card>
  );
}
