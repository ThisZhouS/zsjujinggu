import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Market } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { CompanyBasicInfoClient } from '../src/infrastructure/mairui-api/company-basic-info.client';
import { PrismaService } from '../src/infrastructure/prisma/prisma.service';

interface CliOptions {
  codes?: string[];
  limit?: number;
  offset: number;
  concurrency: number;
  startDate?: string;
  endDate?: string;
  missingOnly: boolean;
}

interface SyncResult {
  stockCode: string;
  recordCount: number;
  insertedCount: number;
  success: boolean;
  error?: string;
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    offset: 0,
    concurrency: 4,
    missingOnly: false,
  };

  for (const arg of argv) {
    if (arg.startsWith('--codes=')) {
      const codes = arg.slice('--codes='.length)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      if (codes.length > 0) {
        options.codes = codes;
      }
      continue;
    }

    if (arg.startsWith('--limit=')) {
      options.limit = parsePositiveInteger(arg.slice('--limit='.length), 0) || undefined;
      continue;
    }

    if (arg.startsWith('--offset=')) {
      options.offset = Math.max(0, parsePositiveInteger(arg.slice('--offset='.length), 0) - 1 + 1);
      continue;
    }

    if (arg.startsWith('--concurrency=')) {
      options.concurrency = Math.max(1, parsePositiveInteger(arg.slice('--concurrency='.length), 4));
      continue;
    }

    if (arg.startsWith('--startDate=')) {
      options.startDate = arg.slice('--startDate='.length).trim() || undefined;
      continue;
    }

    if (arg.startsWith('--endDate=')) {
      options.endDate = arg.slice('--endDate='.length).trim() || undefined;
      continue;
    }

    if (arg === '--missing-only') {
      options.missingOnly = true;
    }
  }

  return options;
}

function normalizeStockCode(code: string): string {
  return code.trim().toUpperCase().split('.')[0];
}

function addExchangeSuffix(code: string): string {
  const normalized = normalizeStockCode(code);

  if (
    normalized.startsWith('43') ||
    normalized.startsWith('83') ||
    normalized.startsWith('87') ||
    normalized.startsWith('92')
  ) {
    return `${normalized}.BJ`;
  }

  if (normalized.startsWith('688') || normalized.startsWith('689')) {
    return `${normalized}.SH`;
  }

  if (normalized.startsWith('6') || normalized.startsWith('9')) {
    return `${normalized}.SH`;
  }

  return `${normalized}.SZ`;
}

function canonicalizeStockCode(code: string): string {
  const trimmed = code.trim().toUpperCase();
  return trimmed.includes('.') ? trimmed : addExchangeSuffix(trimmed);
}

function getStockCodeCandidates(code: string): string[] {
  const normalized = normalizeStockCode(code);
  return Array.from(new Set([normalized, addExchangeSuffix(normalized), canonicalizeStockCode(code)]));
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadTargetStockCodes(
  prisma: PrismaService,
  options: CliOptions,
): Promise<string[]> {
  let stockCodes: string[];
  if (options.codes?.length) {
    stockCodes = Array.from(new Set(options.codes.map((code) => canonicalizeStockCode(code))));
  } else {
    const rows = await prisma.stock.findMany({
      where: {
        market: Market.A,
      },
      select: {
        code: true,
      },
      orderBy: {
        code: 'asc',
      },
      skip: options.offset,
      ...(options.limit ? { take: options.limit } : {}),
    });

    stockCodes = rows.map((row) => canonicalizeStockCode(row.code));
  }

  if (!options.missingOnly) {
    return stockCodes;
  }

  const existingRows = await prisma.companyCapital.groupBy({
    by: ['stockCode'],
  });
  const existingCodes = new Set(
    existingRows.map((row) => canonicalizeStockCode(row.stockCode)),
  );

  return stockCodes.filter((stockCode) => !existingCodes.has(canonicalizeStockCode(stockCode)));
}

async function syncSingleStock(
  prisma: PrismaService,
  companyBasicInfoClient: CompanyBasicInfoClient,
  stockCode: string,
  options: CliOptions,
): Promise<SyncResult> {
  try {
    const records = await companyBasicInfoClient.fetchCompanyCapital(
      stockCode,
      options.startDate,
      options.endDate,
    );

    if (records.length === 0) {
      return {
        stockCode,
        recordCount: 0,
        insertedCount: 0,
        success: true,
      };
    }

    const stockCodeCandidates = getStockCodeCandidates(stockCode);
    const canonicalRecords = records.map((item) => ({
      stockCode: canonicalizeStockCode(item.dm || stockCode),
      zgb: item.zgb ?? null,
      ysltag: item.ysltag ?? null,
      xsltgf: item.xsltgf ?? null,
      bdrq: item.bdrq ?? null,
      plrq: item.plrq ?? null,
    }));

    if (options.startDate || options.endDate) {
      const dateValues = Array.from(
        new Set(
          canonicalRecords.flatMap((item) => [item.bdrq, item.plrq].filter(Boolean) as string[]),
        ),
      );

      if (dateValues.length > 0) {
        await prisma.companyCapital.deleteMany({
          where: {
            stockCode: {
              in: stockCodeCandidates,
            },
            OR: [
              {
                bdrq: {
                  in: dateValues,
                },
              },
              {
                plrq: {
                  in: dateValues,
                },
              },
            ],
          },
        });
      }
    } else {
      await prisma.companyCapital.deleteMany({
        where: {
          stockCode: {
            in: stockCodeCandidates,
          },
        },
      });
    }

    await prisma.companyCapital.createMany({
      data: canonicalRecords,
    });

    return {
      stockCode,
      recordCount: records.length,
      insertedCount: canonicalRecords.length,
      success: true,
    };
  } catch (error) {
    return {
      stockCode,
      recordCount: 0,
      insertedCount: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const prisma = app.get(PrismaService);
    const companyBasicInfoClient = app.get(CompanyBasicInfoClient);
    const stockCodes = await loadTargetStockCodes(prisma, options);

    console.log(
      `[company-capitals] start total=${stockCodes.length} concurrency=${options.concurrency} missingOnly=${options.missingOnly ? 'yes' : 'no'} startDate=${options.startDate ?? '-'} endDate=${options.endDate ?? '-'} offset=${options.offset}`,
    );

    let successStocks = 0;
    let failedStocks = 0;
    let fetchedRecords = 0;
    let insertedRecords = 0;
    const failedResults: SyncResult[] = [];

    for (const [batchIndex, batch] of chunkArray(stockCodes, options.concurrency).entries()) {
      const batchResults = await Promise.all(
        batch.map((stockCode) =>
          syncSingleStock(prisma, companyBasicInfoClient, stockCode, options),
        ),
      );

      for (const result of batchResults) {
        if (result.success) {
          successStocks += 1;
          fetchedRecords += result.recordCount;
          insertedRecords += result.insertedCount;
        } else {
          failedStocks += 1;
          failedResults.push(result);
          console.error(
            `[company-capitals] failed stock=${result.stockCode} error=${result.error}`,
          );
        }
      }

      if ((batchIndex + 1) % 20 === 0 || batchIndex === 0) {
        console.log(
          `[company-capitals] progress processed=${Math.min((batchIndex + 1) * options.concurrency, stockCodes.length)}/${stockCodes.length} success=${successStocks} failed=${failedStocks} fetched=${fetchedRecords} inserted=${insertedRecords}`,
        );
      }

      await sleep(120);
    }

    console.log(
      `[company-capitals] done success=${successStocks} failed=${failedStocks} fetched=${fetchedRecords} inserted=${insertedRecords}`,
    );

    if (failedResults.length > 0) {
      console.log('[company-capitals] failed samples:');
      failedResults.slice(0, 20).forEach((result) => {
        console.log(`- ${result.stockCode}: ${result.error}`);
      });
    }
  } finally {
    await app.close();
  }
}

void main().catch((error) => {
  console.error('[company-capitals] fatal', error);
  process.exit(1);
});
