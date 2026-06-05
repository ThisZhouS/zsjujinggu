import { StarInvestorHoldingsPage } from '@/components/star-investor/StarInvestorHoldingsPage';

export default function ArkkHoldingsPage() {
  return (
    <StarInvestorHoldingsPage
      slug="catherine-wood"
      eyebrow="Catherine Wood Portfolio"
      title="ARKK 持仓专题"
      fallbackDescription="每日抓取 TradingKey 木头姐持仓，展示 ARK 体系最新持仓、买入/卖出变化、组合占比和报告日市值。"
    />
  );
}
