ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS displacement_amount numeric(12, 2) NOT NULL DEFAULT 0;
