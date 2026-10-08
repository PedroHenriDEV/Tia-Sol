export type Company = {
  id: string;
  legal_name: string;
  trade_name: string | null;
  tax_id: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  logo_path: string | null;
  description: string | null;
  contract_details: string | null;
  bank_details: string | null;
  pix_key: string | null;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  company_id: string;
  name: string;
  document: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Package = {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  activities: string[];
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};
