-- 0016_add_displacement_to_contracts.sql
-- Adiciona valor de deslocamento separado do sinal/reserva do contrato.
alter table public.contracts
  add column if not exists displacement_amount numeric(12,2) not null default 0
  check (displacement_amount >= 0);
