import { Prisma } from '@prisma/client';

export type InvestorCategory = 'personal' | 'institution';

const PERSONAL_NAME_PATTERN = /^[\u4e00-\u9fa5]{2,5}$/;

const INSTITUTION_KEYWORDS = [
  '公司',
  '有限',
  '集团',
  '投资',
  '金融',
  '资产',
  '基金',
  '信托',
  '合伙',
  '企业',
  '中心',
  '银行',
  '证券',
  '保险',
  '计划',
  '员工持股',
  '管理',
  '实业',
  '控股',
  '理财',
  '资管',
  '机构',
  '协会',
  '社保',
  '年金',
  'QFII',
  'HKSCC',
  'NOMINEES',
  'LIMITED',
  'GROUP',
  'FUND',
  'BANK',
  'CAPITAL',
  'ASSET',
  'TRUST',
  'SECURITIES',
  'HOLDINGS',
  'INSURANCE',
  'INVESTMENT',
  'CORP',
  'CORPORATION',
  'CO.',
  'PLC',
];

const SHORT_INSTITUTION_ALIASES = new Set([
  '财政部',
  '中广核',
  '中铁工',
  '淡马锡',
]);

function normalizeInvestorName(name: string): string {
  return name.trim();
}

function containsInstitutionKeyword(name: string): boolean {
  const normalized = normalizeInvestorName(name);
  if (!normalized) {
    return false;
  }

  const upperName = normalized.toUpperCase();
  return INSTITUTION_KEYWORDS.some((keyword) => {
    const isAsciiKeyword = /[A-Z]/.test(keyword);
    return isAsciiKeyword
      ? upperName.includes(keyword)
      : normalized.includes(keyword);
  });
}

export function buildNonPersonInvestorNameFilters(): Prisma.InvestorWhereInput[] {
  return INSTITUTION_KEYWORDS.map((keyword) => ({
    name: {
      contains: keyword,
      mode: 'insensitive',
    },
  }));
}

export function buildTrackedInvestorWhere(
  category?: InvestorCategory,
): Prisma.InvestorWhereInput {
  if (category) {
    return {
      isTracked: true,
      category,
    };
  }

  return {
    isTracked: true,
  };
}

export function buildTrackedPersonalInvestorWhere(): Prisma.InvestorWhereInput {
  return buildTrackedInvestorWhere('personal');
}

export function isLikelyPersonalInvestorName(name: string): boolean {
  const normalized = normalizeInvestorName(name);

  if (!normalized) {
    return false;
  }

  if (SHORT_INSTITUTION_ALIASES.has(normalized)) {
    return false;
  }

  if (containsInstitutionKeyword(normalized)) {
    return false;
  }

  return PERSONAL_NAME_PATTERN.test(normalized);
}

export function isInstitutionLikeInvestorName(name: string): boolean {
  const normalized = normalizeInvestorName(name);
  if (!normalized) {
    return false;
  }

  return !isLikelyPersonalInvestorName(normalized);
}

export function getInvestorCategory(name: string): InvestorCategory {
  return isLikelyPersonalInvestorName(name) ? 'personal' : 'institution';
}

export function matchesInvestorCategory(
  name: string,
  category: InvestorCategory,
): boolean {
  return category === 'personal'
    ? isLikelyPersonalInvestorName(name)
    : isInstitutionLikeInvestorName(name);
}
