import type { Category, TransactionType } from '../types';

const INTERNAL_PATTERNS = [
  /^aplicação rdb$/i,
  /^resgate rdb$/i,
  /^dinheiro guardado com resgate planejado$/i,
  /^pagamento de fatura$/i,
];

const CATEGORY_RULES: Array<{ category: Category; patterns: RegExp[] }> = [
  {
    category: 'Imposto',
    patterns: [/receita federal/i, /\bdarf\b/i, /\bdas\b.*simples/i, /\bfgts\b/i, /\binss\b/i],
  },
  {
    category: 'Salário e receitas',
    patterns: [/transferência recebida/i, /salário/i, /salario/i, /pagamento recebido/i, /depósito de salário/i],
  },
  {
    category: 'Assinaturas',
    patterns: [
      /netflix/i, /spotify/i, /amazon prime/i, /disney/i, /youtube/i, /claro/i, /vivo/i, /tim\b/i,
      /globoplay/i, /hbo/i, /deezer/i, /apple\.com\/bill/i, /google storage/i, /microsoft/i,
      /adobe/i, /canva/i, /notion/i, /github/i, /openai/i, /chatgpt/i,
    ],
  },
  {
    category: 'Moradia',
    patterns: [
      /condomínio/i, /condominio/i, /aluguel/i, /leroy merlin/i, /multilux/i, /material de construção/i,
      /telhanorte/i, /\biptu\b/i, /sabesp/i, /copasa/i, /água e esgoto/i,
    ],
  },
  {
    category: 'Contas e serviços',
    patterns: [
      /energisa/i, /sonora energia/i, /netmaxxi/i, /contabilizei/i, /pref mun/i, /bradesco est unif/i,
      /enel/i, /cemig/i, /cpfl/i, /light\b/i, /oi fibra/i, /sky\b/i, /internet/i, /telefonia/i,
    ],
  },
  {
    category: 'Mercado',
    patterns: [
      /mercado/i, /atacadão/i, /atacadao/i, /comper/i, /full foods/i, /buyathome/i, /meu mercado/i,
      /bonatto/i, /supermercado/i, /hortifruti/i, /açougue/i, /acougue/i, /assai/i, /carrefour/i,
      /pão de açúcar/i, /pao de acucar/i, /extra hiper/i, /savegnago/i, /dia supermercado/i,
    ],
  },
  {
    category: 'Alimentação',
    patterns: [
      /burger king/i, /pastelaria/i, /chalehamburgueria/i, /donachipa/i, /dolceamore/i, /vic chocolates/i,
      /chiquinho/i, /banca do indio/i, /mafia do doce/i, /delicias/i, /salgados/i, /lanchonete/i,
      /restaurante/i, /pizzaria/i, /ifood/i, /rappi/i, /acai/i, /açaí/i, /sorvete/i, /padaria/i,
      /confeitaria/i, /cafeteria/i, /café/i, /cafe\b/i, /bar\b/i, /boteco/i, /grill/i, /hamburguer/i,
      /hambúrguer/i, /mc donald/i, /mcdonald/i, /subway/i, /kfc/i, /outback/i, /giraffas/i,
      /china in box/i, /spoleto/i, /habib/i, /sushi/i, /temaki/i, /food/i, /refeição/i, /refeicao/i,
      /doceria/i, /chocolat/i, /nsfogoes/i, /sertao/i,
    ],
  },
  {
    category: 'Transporte',
    patterns: [
      /posto/i, /parking/i, /estacionamento/i, /borracharia/i, /uber/i, /99\b/i, /99pop/i,
      /shell\b/i, /ipiranga/i, /br distribuidora/i, /auto posto/i, /pedágio/i, /pedagio/i,
      /sem parar/i, /veloe/i, /conectcar/i, /metro\b/i, /metrô/i, /cptm/i, /ônibus/i, /onibus/i,
    ],
  },
  {
    category: 'Saúde',
    patterns: [
      /farmacia/i, /farmácia/i, /drogaria/i, /drogasil/i, /raia droga/i, /pacheco/i, /panvel/i,
      /ultrafarma/i, /são joão/i, /sao joao/i, /hospital/i, /clínica/i, /clinica/i, /laboratório/i,
      /laboratorio/i, /dentista/i, /odonto/i, /plano de saúde/i, /plano de saude/i, /unimed/i,
    ],
  },
  {
    category: 'Compras',
    patterns: [
      /cea\b/i, /lojas g/i, /estilopet/i, /alemao conveniencia/i, /havan/i, /magalu/i, /magazine luiza/i,
      /americanas/i, /shopee/i, /mercado livre/i, /mercadolivre/i, /amazon/i, /shein/i, /renner/i,
      /riachuelo/i, /marisa/i, /centauro/i, /decathlon/i, /petz/i, /cobasi/i, /kalunga/i,
    ],
  },
  {
    category: 'Lazer',
    patterns: [
      /tuna pagamentos/i, /cinema/i, /ingresso/i, /steam/i, /playstation/i, /xbox/i, /nintendo/i,
      /evento/i, /show\b/i, /teatro/i, /parque/i,
    ],
  },
  {
    category: 'Investimentos',
    patterns: [/aplicação rdb/i, /resgate rdb/i, /tesouro direto/i, /corretora/i, /xp invest/i, /btg pactual/i],
  },
  {
    category: 'Cartão de crédito',
    patterns: [/pagamento de fatura/i, /fatura do cartão/i, /fatura cartao/i],
  },
  {
    category: 'Transferências',
    patterns: [/transferência enviada/i, /pix enviado/i, /pix - danton/i, /ted enviada/i],
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

function collectSearchTexts(memo: string, description?: string): string[] {
  const extracted = description ?? extractDescription(memo);
  return [memo, extracted]
    .map((text) => text.trim().toLowerCase())
    .filter((text, index, list) => text.length > 0 && list.indexOf(text) === index);
}

export function categorizeTransaction(
  memo: string,
  type: TransactionType,
  description?: string,
): Category {
  const texts = collectSearchTexts(memo, description);

  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((pattern) => texts.some((text) => pattern.test(text)))) {
      return rule.category;
    }
  }

  if (type === 'CREDIT') {
    if (texts.some((text) => /transferência|pix recebido|estorno|reembolso|cashback/i.test(text))) {
      return 'Transferências';
    }
    return 'Salário e receitas';
  }

  if (texts.some((text) => /compra no débito|compra debito/i.test(text))) {
    return 'Outros';
  }

  if (texts.some((text) => /transferência|pix|ted\b/i.test(text))) {
    return 'Transferências';
  }

  return 'Outros';
}
