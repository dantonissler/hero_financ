import type { Transaction, TransactionType } from '../types';
import { categorizeTransaction, extractDescription, isInternalMovement } from './categorizer';
import { isCaixinhaTransaction } from './caixinha';

interface RawOfxTransaction {
  trnType: string;
  dtPosted: string;
  trnAmt: string;
  fitId: string;
  memo: string;
}

function parseOfxDate(value: string): Date {
  const match = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!match) return new Date();
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function extractTag(block: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([^<\\r\\n]+)`, 'i');
  const match = block.match(regex);
  return match?.[1]?.trim() ?? '';
}

function parseTransactions(content: string): RawOfxTransaction[] {
  const normalized = content.replace(/\r\n/g, '\n');
  const blocks = normalized.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) ?? [];

  return blocks.map((block) => ({
    trnType: extractTag(block, 'TRNTYPE'),
    dtPosted: extractTag(block, 'DTPOSTED'),
    trnAmt: extractTag(block, 'TRNAMT'),
    fitId: extractTag(block, 'FITID'),
    memo: extractTag(block, 'MEMO'),
  }));
}

export function parseOfx(content: string): Transaction[] {
  const raw = parseTransactions(content);

  return raw
    .map((item) => {
      const amount = Number.parseFloat(item.trnAmt);
      const type: TransactionType = amount >= 0 ? 'CREDIT' : 'DEBIT';
      const memo = item.memo;
      const description = extractDescription(memo);
      const internal = isInternalMovement(memo) || isCaixinhaTransaction(memo, type);

      return {
        id: item.fitId || `${item.dtPosted}-${item.trnAmt}-${memo}`,
        date: parseOfxDate(item.dtPosted),
        amount: Math.abs(amount),
        type,
        memo,
        description,
        category: categorizeTransaction(memo, type, description),
        isInternal: internal,
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function loadOfxFromUrls(urls: string[]): Promise<Transaction[]> {
  const results = await Promise.all(
    urls.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Falha ao carregar ${url}`);
      const content = await response.text();
      return parseOfx(content);
    }),
  );

  const merged = results.flat();
  const unique = new Map<string, Transaction>();

  for (const transaction of merged) {
    unique.set(transaction.id, transaction);
  }

  return [...unique.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function loadDefaultStatements(): Promise<Transaction[]> {
  let files: string[] = [];

  try {
    const manifestResponse = await fetch('/contas/manifest.json');
    if (manifestResponse.ok) {
      const manifest = (await manifestResponse.json()) as { files?: string[] };
      files = manifest.files ?? [];
    }
  } catch {
    // fallback below
  }

  if (files.length === 0) {
    files = [
      'NU_453034150_01MAI2026_31MAI2026.ofx',
      'NU_453034150_01JUN2026_26JUN2026.ofx',
    ];
  }

  const urls = files.map((file) => `/contas/${file}`);
  return loadOfxFromUrls(urls);
}
