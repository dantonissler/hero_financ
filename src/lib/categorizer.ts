import type { Category, TransactionType } from '../types';

const INTERNAL_PATTERNS = [
  /^aplicação rdb$/i,
  /^resgate rdb$/i,
  /^dinheiro guardado com resgate planejado$/i,
  /^pagamento de fatura$/i,
];

const CATEGORY_RULES: Array<{ category: Category; patterns: RegExp[] }> = [
  {
    category: 'Salário e receitas',
    patterns: [/transferência recebida/i, /salário/i, /pagamento recebido/i, /depósito/i],
  },
  {
    category: 'Assinaturas',
    patterns: [/netflix/i, /spotify/i, /amazon prime/i, /disney/i, /youtube/i, /claro/i, /vivo/i, /tim\b/i],
  },
  {
    category: 'Moradia',
    patterns: [/condomínio/i, /condominio/i, /aluguel/i, /leroy merlin/i, /multilux/i],
  },
  {
    category: 'Contas e serviços',
    patterns: [/energisa/i, /sonora energia/i, /netmaxxi/i, /contabilizei/i, /pref mun/i, /boleto/i, /bradesco est unif/i],
  },
  {
    category: 'Mercado',
    patterns: [/mercado/i, /atacadão/i, /atacadao/i, /comper/i, /full foods/i, /buyathome/i, /meu mercado/i, /bonatto/i],
  },
  {
    category: 'Alimentação',
    patterns: [/burger king/i, /pastelaria/i, /chalehamburgueria/i, /donachipa/i, /dolceamore/i, /vic chocolates/i, /chiquinho/i, /banca do indio/i, /mafia do doce/i],
  },
  {
    category: 'Transporte',
    patterns: [/posto/i, /parking/i, /borracharia/i, /uber/i, /99\b/i],
  },
  {
    category: 'Compras',
    patterns: [/cea\b/i, /lojas g/i, /estilopet/i, /alemao conveniencia/i],
  },
  {
    category: 'Lazer',
    patterns: [/tuna pagamentos/i],
  },
  {
    category: 'Investimentos',
    patterns: [/aplicação rdb/i, /resgate rdb/i],
  },
  {
    category: 'Transferências',
    patterns: [/transferência enviada/i, /transferência recebida/i, /pix - danton/i],
  },
  {
    category: 'Cartão de crédito',
    patterns: [/pagamento de fatura/i],
  },
];

export function isInternalMovement(memo: string): boolean {
  return INTERNAL_PATTERNS.some((pattern) => pattern.test(memo.trim()));
}

export function extractDescription(memo: string): string {
  const debitMatch = memo.match(/compra no débito\s*-\s*(.+)/i);
  if (debitMatch) return debitMatch[1].trim();

  const pixSent = memo.match(/transferência enviada pelo pix\s*-\s*([^-]+)/i);
  if (pixSent) return pixSent[1].trim();

  const pixReceived = memo.match(/transferência recebida pelo pix\s*-\s*([^-]+)/i);
  if (pixReceived) return pixReceived[1].trim();

  const boleto = memo.match(/pagamento de boleto[^-]*-\s*(.+)/i);
  if (boleto) return boleto[1].trim();

  return memo.trim();
}

export function categorizeTransaction(memo: string, type: TransactionType): Category {
  const normalized = memo.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) {
      return rule.category;
    }
  }

  if (type === 'CREDIT') return 'Salário e receitas';
  if (/compra no débito/i.test(memo)) return 'Outros';
  return 'Transferências';
}
