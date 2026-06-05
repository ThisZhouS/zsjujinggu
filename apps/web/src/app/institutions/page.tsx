import { ShareholderDirectoryPage } from '@/components/investor/ShareholderDirectoryPage';

export default function InstitutionsPage() {
  return (
    <ShareholderDirectoryPage
      category="institution"
      entityName="机构"
      basePath="/institutions"
    />
  );
}
