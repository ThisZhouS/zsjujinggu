'use client';

import { Modal, Button, Input, message } from 'antd';
import { useState } from 'react';

interface ShareModalProps {
  visible: boolean;
  title?: string;
  url?: string;
  onCancel: () => void;
}

export function ShareModal({
  visible,
  title,
  url,
  onCancel,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (url && typeof window !== 'undefined') {
      navigator.clipboard.writeText(url);
      setCopied(true);
      message.success('链接已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Modal
      title={title || '分享'}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          关闭
        </Button>,
        <Button key="copy" type="primary" onClick={handleCopy}>
          {copied ? '已复制' : '复制链接'}
        </Button>,
      ]}
    >
      <Input.TextArea
        value={shareUrl}
        readOnly
        rows={4}
        className="mt-4"
      />
      <div className="mt-4 text-sm text-gray-500">
        复制链接分享给好友
      </div>
    </Modal>
  );
}
