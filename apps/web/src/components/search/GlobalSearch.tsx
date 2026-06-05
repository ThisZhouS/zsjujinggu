'use client';

import { AutoComplete, Input, Tag, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import apiClient from '@/lib/api';

interface SearchResult {
  type: 'stock' | 'investor';
  id: number;
  code?: string;
  name: string;
}

interface SearchOption {
  value: string;
  label: ReactNode;
  route: string;
}

function buildRoute(item: SearchResult): string {
  if (item.type === 'stock' && item.code) {
    return `/stocks/${item.code}`;
  }

  return `/investors/${item.id}`;
}

function openInNewWindow(route: string) {
  window.open(route, '_blank', 'noopener,noreferrer');
}

export function GlobalSearch() {
  const [value, setValue] = useState('');
  const [options, setOptions] = useState<SearchOption[]>([]);
  const [loading, setLoading] = useState(false);
  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const fetchResults = async (keyword: string) => {
    const results = await apiClient.get<SearchResult[]>('/api/v1/search', {
      params: {
        keyword,
        limit: 10,
      },
    });

    return results.map((item) => ({
      value: item.type === 'stock' && item.code
        ? `${item.code} ${item.name}`
        : `${item.name}（牛散）`,
      route: buildRoute(item),
      label: (
        <div className="flex items-center justify-between gap-3">
          <div className="truncate">
            {item.type === 'stock' && item.code ? `${item.code} ${item.name}` : item.name}
          </div>
          <Tag color={item.type === 'stock' ? 'blue' : 'gold'} className="mr-0">
            {item.type === 'stock' ? '股票' : '牛散'}
          </Tag>
        </div>
      ),
    }));
  };

  const handleSearch = (keyword: string) => {
    setValue(keyword);

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (!keyword.trim()) {
      setOptions([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);

    debounceTimerRef.current = window.setTimeout(async () => {
      try {
        const nextOptions = await fetchResults(keyword.trim());
        if (requestId === requestIdRef.current) {
          setOptions(nextOptions);
        }
      } catch {
        if (requestId === requestIdRef.current) {
          setOptions([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, 250);
  };

  const handleSubmit = async (keyword?: string) => {
    const normalizedKeyword = (keyword ?? value).trim();
    if (!normalizedKeyword) {
      message.warning('请输入股东姓名、股票代码或股票名称');
      return;
    }

    const firstOption = options[0];
    if (firstOption) {
      openInNewWindow(firstOption.route);
      return;
    }

    setLoading(true);
    try {
      const nextOptions = await fetchResults(normalizedKeyword);
      setOptions(nextOptions);

      if (nextOptions[0]) {
        openInNewWindow(nextOptions[0].route);
        return;
      }

      message.info('未找到匹配结果');
    } catch {
      message.error('搜索失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AutoComplete
      value={value}
      options={options}
      onSearch={handleSearch}
      onSelect={(_value, option) => {
        const route = (option as SearchOption).route;
        openInNewWindow(route);
      }}
      notFoundContent={loading ? '搜索中...' : value ? '未找到匹配结果' : '输入股东姓名、股票代码或股票名称'}
      style={{ width: '100%' }}
    >
      <Input.Search
        size="large"
        placeholder="搜索股东姓名、股票代码或股票名称，回车后新窗口打开"
        enterButton={<SearchOutlined />}
        loading={loading}
        onSearch={handleSubmit}
      />
    </AutoComplete>
  );
}
