-- Adiciona funcao da femea no evento reprodutivo (Matriz | Doadora | Receptora)
-- e nome/RGN da mae doadora para eventos de FIV.
BEGIN;

ALTER TABLE public.reproduction_events
  ADD COLUMN IF NOT EXISTS reproduction_role text,
  ADD COLUMN IF NOT EXISTS donor_name text;

COMMIT;
