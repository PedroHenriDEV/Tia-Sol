-- Permite cadastrar múltiplos eventos na mesma data e em horários sobrepostos.
-- A validação de ordem dos horários (end_time > start_time) permanece ativa.
drop trigger if exists events_overlap_guard on public.events;

drop function if exists public.prevent_event_overlap();
