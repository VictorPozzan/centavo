/**
 * Default categorization rules used as a fallback when the user's
 * own history doesn't provide a strong enough match.
 *
 * Each rule maps keywords to a list of category name candidates.
 * The engine looks for a user category whose name matches any candidate.
 */
export interface DefaultRule {
    /** Keywords to look for in the transaction description (uppercase, no accents) */
    keywords: string[];
    /** Candidate category names — the engine matches against the user's categories */
    categoryNames: string[];
  }
  
  export const DEFAULT_RULES: DefaultRule[] = [
    {
      keywords: ['UBER', 'LYFT', 'CABIFY', '99', 'TAXI', 'BLABLACAR'],
      categoryNames: ['Transport', 'Transportation', 'Transporte'],
    },
    {
      keywords: ['IFOOD', 'RAPPI', 'UBEREATS', 'DOORDASH', 'GRUBHUB', 'DELIVERY'],
      categoryNames: ['Food', 'Food & Dining', 'Alimentação', 'Delivery'],
    },
    {
      keywords: [
        'RESTAURANT', 'RESTAURANTE', 'CAFE', 'COFFEE', 'STARBUCKS',
        'MCDONALD', 'BURGER', 'PIZZA', 'BAR',
      ],
      categoryNames: ['Food', 'Food & Dining', 'Alimentação', 'Dining'],
    },
    {
      keywords: [
        'SUPERMARKET', 'SUPERMERCADO', 'GROCERY', 'MARKET', 'MERCADO',
        'CARREFOUR', 'WALMART', 'PAODEACUCAR',
      ],
      categoryNames: ['Groceries', 'Supermarket', 'Mercado', 'Supermercado'],
    },
    {
      keywords: [
        'NETFLIX', 'SPOTIFY', 'DISNEY', 'HBO', 'PRIMEVIDEO', 'YOUTUBE',
        'CINEMA', 'MOVIE', 'STEAM', 'PLAYSTATION', 'XBOX',
      ],
      categoryNames: ['Entertainment', 'Streaming', 'Entretenimento', 'Lazer'],
    },
    {
      keywords: [
        'PHARMACY', 'FARMACIA', 'DROGARIA', 'HOSPITAL', 'CLINIC',
        'CLINICA', 'DOCTOR', 'MEDIC',
      ],
      categoryNames: ['Health', 'Healthcare', 'Saúde', 'Medical'],
    },
    {
      keywords: [
        'ELECTRICITY', 'ENERGIA', 'WATER', 'AGUA', 'GAS', 'INTERNET',
        'PHONE', 'TELEFONE', 'VIVO', 'CLARO', 'TIM', 'ENEL',
      ],
      categoryNames: ['Utilities', 'Bills', 'Contas', 'Serviços'],
    },
    {
      keywords: ['SALARY', 'SALARIO', 'PAYROLL', 'PAYMENT RECEIVED', 'DEPOSIT'],
      categoryNames: ['Salary', 'Income', 'Salário', 'Renda'],
    },
    {
      keywords: ['GYM', 'ACADEMIA', 'FITNESS', 'SMARTFIT', 'CROSSFIT'],
      categoryNames: ['Health', 'Fitness', 'Saúde', 'Academia'],
    },
    {
      keywords: ['AMAZON', 'MERCADOLIVRE', 'ALIEXPRESS', 'SHEIN', 'SHOPEE'],
      categoryNames: ['Shopping', 'Compras'],
    },
  ];