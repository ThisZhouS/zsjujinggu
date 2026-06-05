import { StarInvestorHoldingsPage } from '@/components/star-investor/StarInvestorHoldingsPage';

export default function BuffettHoldingsPage() {
  return (
    <StarInvestorHoldingsPage
      slug="buffett"
      eyebrow="Warren Buffett Portfolio"
      title="巴菲特持仓专题"
      fallbackDescription="每日抓取 TradingKey 巴菲特持仓，展示伯克希尔最新持仓、买入/卖出变化、组合占比和报告日市值。"
    />
  );
}
