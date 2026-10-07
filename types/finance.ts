export const FINANCIAL_TYPES = ['receita', 'despesa'] as const;
export type FinancialType = (typeof FINANCIAL_TYPES)[number];

export const FINANCIAL_STATUSES = ['pendente', 'pago', 'cancelado'] as const;
export type FinancialStatus = (typeof FINANCIAL_STATUSES)[number];

export type FinancialTransaction = {
  id: string;
  company_id: string;
  event_id: string | null;
  type: FinancialType;
  description: string;
  category: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: FinancialStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
