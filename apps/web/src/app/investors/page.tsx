import { ShareholderDirectoryPage } from '@/components/investor/ShareholderDirectoryPage';

export default function InvestorsPage() {
  return (
    <ShareholderDirectoryPage
      category="personal"
      entityName="牛散"
      basePath="/investors"
    />
  );
}
