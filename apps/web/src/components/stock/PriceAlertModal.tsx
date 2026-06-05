'use client';

import { Modal, Form, Select, InputNumber, Button, message } from 'antd';
import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';

interface PriceAlertModalProps {
  visible: boolean;
  stockCode: string;
  stockName: string;
  currentPrice: number;
  onCancel: () => void;
  onSuccess: () => void;
}

export function PriceAlertModal({
  visible,
  stockCode,
  stockName,
  currentPrice,
  onCancel,
  onSuccess,
}: PriceAlertModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) {
      return;
    }

    form.setFieldsValue({
      alertType: 'ABOVE',
      targetPrice: currentPrice,
    });
  }, [currentPrice, form, visible]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setLoading(true);

      await apiClient.post('/api/v1/price-alerts', {
        stockCode,
        alertType: values.alertType,
        targetPrice: values.targetPrice,
      });

      message.success('价格提醒设置成功');
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error.message || '设置失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`设置价格提醒 - ${stockName} (${stockCode})`}
      open={visible}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          取消
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          确认
        </Button>,
      ]}
    >
      <div className="mb-4 text-sm text-gray-500">
        当前价格: <span className="font-semibold">{currentPrice.toFixed(2)}</span>
      </div>

      <Form form={form} layout="vertical">
        <Form.Item
          name="alertType"
          label="提醒类型"
          rules={[{ required: true, message: '请选择提醒类型' }]}
        >
          <Select placeholder="请选择提醒类型">
            <Select.Option value="ABOVE">价格高于</Select.Option>
            <Select.Option value="BELOW">价格低于</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="targetPrice"
          label="目标价格"
          rules={[
            { required: true, message: '请输入目标价格' },
            { type: 'number', min: 0.01, message: '价格必须大于0' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder="请输入目标价格"
            precision={2}
            min={0.01}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
