'use client';

import {
  ArrowRightOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ReloadOutlined,
  UploadOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Typography,
  Upload,
  message,
} from 'antd';
import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import apiClient from '@/lib/api';
import { VideoAccessLevel } from '@/hooks/useVideos';

const { Text, Paragraph } = Typography;
const { TextArea } = Input;

type PaymentType = 'WECHAT' | 'ALIPAY';
type AdMediaType = 'VIDEO';

interface PaymentSetting {
  id: number | null;
  paymentType: PaymentType;
  qrCodeUrl: string | null;
  accountName: string | null;
  instructions: string | null;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

interface VideoFormValues {
  title: string;
  summary?: string;
  coverUrl?: string;
  videoUrl: string;
  durationSec?: number | null;
  accessLevel: VideoAccessLevel;
  isFeatured: boolean;
  sortOrder?: number;
}

interface VideoAdFormValues {
  title: string;
  content: string;
  videoUrl: string;
  linkUrl: string;
  priority?: number;
  isActive: boolean;
}

interface PaymentSettingFormValues {
  qrCodeUrl?: string;
  accountName?: string;
  instructions?: string;
  isActive: boolean;
}

const PAYMENT_LABELS: Record<PaymentType, string> = {
  WECHAT: '微信收款码',
  ALIPAY: '支付宝收款码',
};

const ACCESS_OPTIONS: Array<{ label: string; value: VideoAccessLevel }> = [
  { label: '游客可看', value: 'PUBLIC' },
  { label: '登录可看', value: 'USER' },
  { label: '视频专属', value: 'VIDEO' },
  { label: '登录可看（兼容旧VIP）', value: 'VIP' },
];

export default function AdminOperationsPage() {
  const [videoForm] = Form.useForm<VideoFormValues>();
  const [videoAdForm] = Form.useForm<VideoAdFormValues>();
  const [wechatPaymentForm] = Form.useForm<PaymentSettingFormValues>();
  const [alipayPaymentForm] = Form.useForm<PaymentSettingFormValues>();
  const [uploadingVideo, setUploadingVideo] = useState<'content' | 'ad' | null>(null);
  const [uploadingQr, setUploadingQr] = useState<PaymentType | null>(null);
  const [submittingVideo, setSubmittingVideo] = useState(false);
  const [submittingAd, setSubmittingAd] = useState(false);
  const [submittingPaymentType, setSubmittingPaymentType] = useState<PaymentType | null>(null);
  const paymentForms = {
    WECHAT: wechatPaymentForm,
    ALIPAY: alipayPaymentForm,
  };
  const watchedQrCodeUrls = {
    WECHAT: Form.useWatch('qrCodeUrl', wechatPaymentForm),
    ALIPAY: Form.useWatch('qrCodeUrl', alipayPaymentForm),
  };

  const fetcher = async (url: string) => apiClient.get<PaymentSetting[]>(url);
  const { data: settings, isLoading, mutate } = useSWR<PaymentSetting[]>(
    '/api/v1/payment/admin/settings',
    fetcher,
    {
      revalidateOnFocus: false,
      onSuccess: (items) => {
        items.forEach((item) => {
          paymentForms[item.paymentType].setFieldsValue({
            qrCodeUrl: item.qrCodeUrl ?? undefined,
            accountName: item.accountName ?? undefined,
            instructions: item.instructions ?? undefined,
            isActive: item.isActive,
          });
        });
      },
    },
  );

  const uploadVideo = async (file: File, target: 'content' | 'ad') => {
    const formData = new FormData();
    formData.append('file', file);

    setUploadingVideo(target);
    try {
      const result = await apiClient.post<{ url: string }>('/api/v1/videos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (target === 'content') {
        videoForm.setFieldValue('videoUrl', result.url);
      } else {
        videoAdForm.setFieldValue('videoUrl', result.url);
      }
      message.success('视频上传成功');
    } catch (error: any) {
      message.error(error.message || '视频上传失败');
    } finally {
      setUploadingVideo(null);
    }

    return false;
  };

  const uploadQrCode = async (file: File, paymentType: PaymentType) => {
    const formData = new FormData();
    formData.append('file', file);

    setUploadingQr(paymentType);
    try {
      const result = await apiClient.post<{ url: string }>(
        '/api/v1/payment/admin/qrcode/upload',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      paymentForms[paymentType].setFieldValue('qrCodeUrl', result.url);
      message.success('收款码上传成功');
    } catch (error: any) {
      message.error(error.message || '收款码上传失败');
    } finally {
      setUploadingQr(null);
    }

    return false;
  };

  const createVideo = async (values: VideoFormValues) => {
    setSubmittingVideo(true);
    try {
      await apiClient.post('/api/v1/videos', {
        title: values.title.trim(),
        summary: values.summary?.trim() || null,
        description: null,
        coverUrl: values.coverUrl?.trim() || null,
        videoUrl: values.videoUrl.trim(),
        durationSec: values.durationSec ?? null,
        accessLevel: values.accessLevel,
        isActive: true,
        isFeatured: values.isFeatured,
        sortOrder: values.sortOrder ?? 0,
      });
      videoForm.resetFields();
      videoForm.setFieldsValue({
        accessLevel: 'PUBLIC',
        isFeatured: false,
        sortOrder: 0,
      });
      message.success('视频已创建');
    } catch (error: any) {
      message.error(error.message || '创建视频失败');
    } finally {
      setSubmittingVideo(false);
    }
  };

  const createVideoAd = async (values: VideoAdFormValues) => {
    setSubmittingAd(true);
    try {
      await apiClient.post('/api/v1/ads', {
        position: 'HOME_VIDEO_HERO',
        mediaType: 'VIDEO' as AdMediaType,
        title: values.title.trim(),
        content: values.content.trim(),
        imageUrl: null,
        videoUrl: values.videoUrl.trim(),
        linkUrl: values.linkUrl.trim(),
        priority: values.priority ?? 0,
        isActive: values.isActive,
      });
      videoAdForm.resetFields();
      videoAdForm.setFieldsValue({
        linkUrl: '/videos',
        priority: 0,
        isActive: true,
      });
      message.success('首页视频广告已创建');
    } catch (error: any) {
      message.error(error.message || '创建视频广告失败');
    } finally {
      setSubmittingAd(false);
    }
  };

  const savePaymentSetting = async (paymentType: PaymentType, values: PaymentSettingFormValues) => {
    setSubmittingPaymentType(paymentType);
    try {
      await apiClient.put(`/api/v1/payment/admin/settings/${paymentType}`, {
        qrCodeUrl: values.qrCodeUrl?.trim() || null,
        accountName: values.accountName?.trim() || null,
        instructions: values.instructions?.trim() || null,
        isActive: values.isActive,
      });
      await mutate();
      message.success(`${PAYMENT_LABELS[paymentType]}已保存`);
    } catch (error: any) {
      message.error(error.message || '保存收款配置失败');
    } finally {
      setSubmittingPaymentType(null);
    }
  };

  const renderPaymentSettingForm = (paymentType: PaymentType) => {
    const setting = settings?.find((item) => item.paymentType === paymentType);
    const qrCodeUrl = watchedQrCodeUrls[paymentType] || setting?.qrCodeUrl;

    return (
      <Form
        layout="vertical"
        form={paymentForms[paymentType]}
        initialValues={{ isActive: setting?.isActive ?? false }}
        onFinish={(values) => savePaymentSetting(paymentType, values)}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={15}>
            <Form.Item name="accountName" label="收款账户名称">
              <Input placeholder="例如：掘金股" />
            </Form.Item>
            <Form.Item name="qrCodeUrl" label="收款码 URL">
              <Space.Compact style={{ width: '100%' }}>
                <Input placeholder="/uploads/payments/qrcode.png 或外部图片地址" />
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    void uploadQrCode(file, paymentType);
                    return Upload.LIST_IGNORE;
                  }}
                >
                  <Button icon={<UploadOutlined />} loading={uploadingQr === paymentType}>
                    上传收款码
                  </Button>
                </Upload>
              </Space.Compact>
            </Form.Item>
            <Form.Item name="instructions" label="支付说明">
              <TextArea rows={4} placeholder="例如：扫码后请备注订单号，管理员确认后处理历史订单。" />
            </Form.Item>
            <Form.Item name="isActive" label="启用状态" valuePropName="checked">
              <Switch checkedChildren="启用" unCheckedChildren="停用" />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<WalletOutlined />}
              loading={submittingPaymentType === paymentType}
            >
              保存{PAYMENT_LABELS[paymentType]}
            </Button>
          </Col>
          <Col xs={24} lg={9}>
            <Card size="small" title="当前预览">
              {qrCodeUrl ? (
                <Image src={qrCodeUrl} alt={PAYMENT_LABELS[paymentType]} width="100%" />
              ) : (
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  暂未配置收款码。
                </Paragraph>
              )}
            </Card>
          </Col>
        </Row>
      </Form>
    );
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div>
        <Typography.Title level={2} style={{ marginBottom: 8 }}>
          运营配置
        </Typography.Title>
        <Text type="secondary">集中处理视频上传、首页视频广告和历史收款码配置。</Text>
      </div>

      <Alert
        type="info"
        showIcon
        message="视频素材和广告位仍保留独立管理页；此页用于管理员高频上传与配置入口。"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card
            title="上传视频并入库"
            extra={
              <Link href="/admin/videos">
                视频管理 <ArrowRightOutlined />
              </Link>
            }
          >
            <Form
              layout="vertical"
              form={videoForm}
              initialValues={{
                accessLevel: 'PUBLIC',
                isFeatured: false,
                sortOrder: 0,
              }}
              onFinish={createVideo}
            >
              <Form.Item name="title" label="视频标题" rules={[{ required: true, message: '请输入视频标题' }]}>
                <Input placeholder="视频标题" />
              </Form.Item>
              <Form.Item name="summary" label="视频摘要">
                <Input placeholder="用于视频列表展示" />
              </Form.Item>
              <Form.Item name="coverUrl" label="封面 URL">
                <Input placeholder="可选，填写封面图片地址" />
              </Form.Item>
              <Form.Item name="videoUrl" label="视频 URL" rules={[{ required: true, message: '请上传或填写视频地址' }]}>
                <Space.Compact style={{ width: '100%' }}>
                  <Input placeholder="/uploads/videos/xxx.mp4 或外部视频地址" />
                  <Upload
                    accept="video/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      void uploadVideo(file, 'content');
                      return Upload.LIST_IGNORE;
                    }}
                  >
                    <Button icon={<UploadOutlined />} loading={uploadingVideo === 'content'}>
                      上传视频
                    </Button>
                  </Upload>
                </Space.Compact>
              </Form.Item>
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item name="accessLevel" label="访问权限">
                    <Select options={ACCESS_OPTIONS} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="durationSec" label="时长（秒）">
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="sortOrder" label="排序">
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="isFeatured" label="首页精选" valuePropName="checked">
                <Switch checkedChildren="精选" unCheckedChildren="普通" />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<PlusOutlined />}
                loading={submittingVideo}
              >
                创建视频
              </Button>
            </Form>
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card
            title="创建首页视频广告"
            extra={
              <Link href="/admin/ads">
                广告管理 <ArrowRightOutlined />
              </Link>
            }
          >
            <Form
              layout="vertical"
              form={videoAdForm}
              initialValues={{
                linkUrl: '/videos',
                priority: 0,
                isActive: true,
              }}
              onFinish={createVideoAd}
            >
              <Form.Item name="title" label="广告标题" rules={[{ required: true, message: '请输入广告标题' }]}>
                <Input placeholder="首页视频广告标题" />
              </Form.Item>
              <Form.Item name="content" label="广告文案" rules={[{ required: true, message: '请输入广告文案' }]}>
                <TextArea rows={3} placeholder="首页展示文案" />
              </Form.Item>
              <Form.Item name="videoUrl" label="广告视频 URL" rules={[{ required: true, message: '请上传或填写广告视频' }]}>
                <Space.Compact style={{ width: '100%' }}>
                  <Input placeholder="/uploads/videos/ad.mp4 或外部视频地址" />
                  <Upload
                    accept="video/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      void uploadVideo(file, 'ad');
                      return Upload.LIST_IGNORE;
                    }}
                  >
                    <Button icon={<UploadOutlined />} loading={uploadingVideo === 'ad'}>
                      上传广告视频
                    </Button>
                  </Upload>
                </Space.Compact>
              </Form.Item>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="linkUrl" label="点击跳转">
                    <Input placeholder="/videos" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="priority" label="优先级">
                    <InputNumber style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="isActive" label="启用状态" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="停用" />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<PlayCircleOutlined />}
                loading={submittingAd}
              >
                创建视频广告
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>

      <Card
        title="收款码配置"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => mutate()} loading={isLoading}>
            刷新
          </Button>
        }
      >
        <Tabs
          items={[
            {
              key: 'WECHAT',
              label: PAYMENT_LABELS.WECHAT,
              children: renderPaymentSettingForm('WECHAT'),
            },
            {
              key: 'ALIPAY',
              label: PAYMENT_LABELS.ALIPAY,
              children: renderPaymentSettingForm('ALIPAY'),
            },
          ]}
        />
      </Card>
    </Space>
  );
}
