'use client';

import { Switch } from 'antd';
import { useState, useEffect } from 'react';

export function ThemeSwitcher() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference or saved preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(savedTheme === 'dark' || (!savedTheme && prefersDark));
  }, []);

  const handleChange = (checked: boolean) => {
    setIsDark(checked);
    localStorage.setItem('theme', checked ? 'dark' : 'light');
    // Apply theme to document
    if (checked) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={isDark}
        onChange={handleChange}
        checkedChildren="暗色"
        unCheckedChildren="亮色"
      />
    </div>
  );
}
