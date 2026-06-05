'use client';

import { AutoComplete, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import apiClient from '@/lib/api';

interface SearchResult {
  type: 'stock' | 'investor';
  id: number;
  code?: string;
  name: string;
}

interface StockSearchOption {
  value: string;
  label: string;
  stockCode: string;
  stockName: string;
}

export interface StockSearchSelection {
  stockCode: string;
  stockName: string;
}

interface StockSearchProps {
  onSearch?: (value: string) => void;
  onSelect?: (stock: StockSearchSelection) => void;
  placeholder?: string;
}

export function StockSearch({ onSearch, onSelect, placeholder = '搜索股票代码或名称' }: StockSearchProps) {
  const [options, setOptions] = useState<StockSearchOption[]>([]);
  const [value, setValue] = useState('');
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

  const handleSearch = (searchText: string) => {
    setValue(searchText);

    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (!searchText.trim()) {
      setOptions([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);

    debounceTimerRef.current = window.setTimeout(async () => {
      try {
        const results = await apiClient.get<SearchResult[]>('/api/v1/search', {
          params: {
            keyword: searchText.trim(),
            limit: 10,
          },
        });

        if (requestId !== requestIdRef.current) {
          return;
        }

        const stockOptions = results
          .filter((item) => item.type === 'stock' && item.code)
          .map((item) => ({
            value: item.code!,
            label: `${item.code} ${item.name}`,
            stockCode: item.code!,
            stockName: item.name,
          }));

        setOptions(stockOptions);
      } catch (error) {
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

  const handleSelect = (selectedCode: string) => {
    const selected = options.find((item) => item.stockCode === selectedCode);
    setValue(selectedCode);
    if (!selected) {
      return;
    }
    onSelect?.({
      stockCode: selected.stockCode,
      stockName: selected.stockName,
    });
  };

  const handleSubmit = (keyword?: string) => {
    onSearch?.((keyword ?? value).trim());
  };

  return (
    <AutoComplete
      value={value}
      options={options}
      onSearch={handleSearch}
      onSelect={handleSelect}
      notFoundContent={loading ? '搜索中...' : '未找到匹配股票'}
      style={{ width: '100%' }}
    >
      <Input.Search
        size="large"
        placeholder={placeholder}
        enterButton={<SearchOutlined />}
        loading={loading}
        onSearch={handleSubmit}
      />
    </AutoComplete>
  );
}
