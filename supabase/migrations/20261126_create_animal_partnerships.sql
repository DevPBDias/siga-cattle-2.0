-- Migration: criar tabela animal_partnerships para sócios dinâmicos
-- Inclui índice de updated_at, RLS, trigger de updated_at, publicação Realtime
-- e seed inicial com os 4 sócios padrão (Alex, Fátima, Jacir, Ricardo).

BEGIN;

CREATE TABLE IF NOT EXISTS public.animal_partnerships (
  id           TEXT    PRIMARY KEY,
  partner_name TEXT    NOT NULL,
  created_at   BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at   BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted     BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_animal_partnerships_updated_at
  ON public.animal_partnerships (updated_at);

ALTER TABLE public.animal_partnerships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "animal_partnerships_all" ON public.animal_partnerships;
CREATE POLICY "animal_partnerships_all"
  ON public.animal_partnerships
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_animal_partnerships_updated_at ON public.animal_partnerships;
CREATE TRIGGER trg_animal_partnerships_updated_at
  BEFORE UPDATE ON public.animal_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

INSERT INTO public.animal_partnerships (id, partner_name)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'Alex'),
  ('00000000-0000-4000-8000-000000000002', 'Fátima'),
  ('00000000-0000-4000-8000-000000000003', 'Jacir'),
  ('00000000-0000-4000-8000-000000000004', 'Ricardo')
ON CONFLICT (id) DO NOTHING;

COMMIT;

DO $$
BEGIN
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.animal_partnerships';
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;
