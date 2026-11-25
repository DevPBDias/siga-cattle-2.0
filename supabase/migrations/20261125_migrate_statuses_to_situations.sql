-- Migration: animal_statuses → animal_situations
-- Status ABCZ agora são constantes imutáveis no código.
-- Os dados existentes em animal_statuses são migrados para animal_situations
-- (caso ainda não existam lá), e a tabela animal_statuses é removida.

BEGIN;

-- Migrar registros existentes de animal_statuses para animal_situations
-- ON CONFLICT DO NOTHING evita duplicatas se a situação já foi criada manualmente.
INSERT INTO public.animal_situations (id, situation_name, created_at, updated_at, _deleted)
SELECT
  id,
  status_name AS situation_name,
  created_at,
  updated_at,
  COALESCE(_deleted, false) AS _deleted
FROM public.animal_statuses
ON CONFLICT (id) DO NOTHING;

-- Remover a tabela animal_statuses (dados já migrados acima)
DROP TABLE IF EXISTS public.animal_statuses CASCADE;

COMMIT;
