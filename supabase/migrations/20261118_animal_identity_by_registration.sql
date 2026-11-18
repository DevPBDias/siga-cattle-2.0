-- Animal identity is the registered pair (serie_rgd, rgn). The existing UUID
-- id remains unchanged for compatibility, while animal_key becomes the sync
-- and local primary key.
BEGIN;

ALTER TABLE public.animals
  ADD COLUMN IF NOT EXISTS animal_key text;

UPDATE public.animals
SET animal_key = upper(btrim(serie_rgd)) || '::' || upper(btrim(rgn));

DO $$
DECLARE
  duplicate_registration record;
  primary_key_name text;
BEGIN
  SELECT upper(btrim(serie_rgd)) AS serie_rgd, upper(btrim(rgn)) AS rgn, count(*) AS total
  INTO duplicate_registration
  FROM public.animals
  GROUP BY upper(btrim(serie_rgd)), upper(btrim(rgn))
  HAVING count(*) > 1
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION
      'Duplicate animal registration found: serie_rgd %, rgn %, count %',
      duplicate_registration.serie_rgd,
      duplicate_registration.rgn,
      duplicate_registration.total;
  END IF;

  SELECT conname
  INTO primary_key_name
  FROM pg_constraint
  WHERE conrelid = 'public.animals'::regclass
    AND contype = 'p';

  IF primary_key_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.animals DROP CONSTRAINT %I', primary_key_name);
  END IF;
END $$;

ALTER TABLE public.animals
  ALTER COLUMN animal_key SET NOT NULL,
  ADD CONSTRAINT animals_pkey PRIMARY KEY (animal_key);

CREATE UNIQUE INDEX IF NOT EXISTS animals_registration_unique_idx
  ON public.animals (upper(btrim(serie_rgd)), upper(btrim(rgn)));
CREATE INDEX IF NOT EXISTS animals_rgn_idx ON public.animals (rgn);

ALTER TABLE public.animal_metrics_weight ADD COLUMN IF NOT EXISTS animal_key text;
ALTER TABLE public.animal_metrics_ce ADD COLUMN IF NOT EXISTS animal_key text;
ALTER TABLE public.animal_vaccines ADD COLUMN IF NOT EXISTS animal_key text;
ALTER TABLE public.reproduction_events ADD COLUMN IF NOT EXISTS animal_key text;
ALTER TABLE public.deaths ADD COLUMN IF NOT EXISTS animal_key text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS animal_key text;
ALTER TABLE public.exchanges
  ADD COLUMN IF NOT EXISTS animal_key text,
  ADD COLUMN IF NOT EXISTS traded_animal_key text,
  ADD COLUMN IF NOT EXISTS substitute_animal_key text;
ALTER TABLE public.movements ADD COLUMN IF NOT EXISTS animal_key text;
ALTER TABLE public.agenda_reminders ADD COLUMN IF NOT EXISTS animal_key text;
ALTER TABLE public.retreats ADD COLUMN IF NOT EXISTS animal_key text;

WITH unique_rgn AS (
  SELECT rgn, min(animal_key) AS animal_key
  FROM public.animals
  GROUP BY rgn
  HAVING count(*) = 1
    AND (
      SELECT count(*)
      FROM public.animals AS same_rgn
      WHERE upper(btrim(same_rgn.rgn)) = upper(btrim(animals.rgn))
    ) = 1
)
UPDATE public.animal_metrics_weight AS related
SET animal_key = animal.animal_key
FROM unique_rgn AS animal
WHERE related.animal_key IS NULL AND related.rgn = animal.rgn;

WITH unique_rgn AS (
  SELECT rgn, min(animal_key) AS animal_key
  FROM public.animals
  GROUP BY rgn
  HAVING count(*) = 1
    AND (
      SELECT count(*)
      FROM public.animals AS same_rgn
      WHERE upper(btrim(same_rgn.rgn)) = upper(btrim(animals.rgn))
    ) = 1
)
UPDATE public.animal_metrics_ce AS related
SET animal_key = animal.animal_key
FROM unique_rgn AS animal
WHERE related.animal_key IS NULL AND related.rgn = animal.rgn;

WITH unique_rgn AS (
  SELECT rgn, min(animal_key) AS animal_key
  FROM public.animals
  GROUP BY rgn
  HAVING count(*) = 1
    AND (
      SELECT count(*)
      FROM public.animals AS same_rgn
      WHERE upper(btrim(same_rgn.rgn)) = upper(btrim(animals.rgn))
    ) = 1
)
UPDATE public.animal_vaccines AS related
SET animal_key = animal.animal_key
FROM unique_rgn AS animal
WHERE related.animal_key IS NULL AND related.rgn = animal.rgn;

WITH unique_rgn AS (
  SELECT rgn, min(animal_key) AS animal_key
  FROM public.animals
  GROUP BY rgn
  HAVING count(*) = 1
    AND (
      SELECT count(*)
      FROM public.animals AS same_rgn
      WHERE upper(btrim(same_rgn.rgn)) = upper(btrim(animals.rgn))
    ) = 1
)
UPDATE public.reproduction_events AS related
SET animal_key = animal.animal_key
FROM unique_rgn AS animal
WHERE related.animal_key IS NULL AND related.rgn = animal.rgn;

WITH unique_rgn AS (
  SELECT rgn, min(animal_key) AS animal_key
  FROM public.animals
  GROUP BY rgn
  HAVING count(*) = 1
    AND (
      SELECT count(*)
      FROM public.animals AS same_rgn
      WHERE upper(btrim(same_rgn.rgn)) = upper(btrim(animals.rgn))
    ) = 1
)
UPDATE public.deaths AS related
SET animal_key = animal.animal_key
FROM unique_rgn AS animal
WHERE related.animal_key IS NULL AND related.animal_rgn = animal.rgn;

WITH unique_rgn AS (
  SELECT rgn, min(animal_key) AS animal_key
  FROM public.animals
  GROUP BY rgn
  HAVING count(*) = 1
    AND (
      SELECT count(*)
      FROM public.animals AS same_rgn
      WHERE upper(btrim(same_rgn.rgn)) = upper(btrim(animals.rgn))
    ) = 1
)
UPDATE public.sales AS related
SET animal_key = animal.animal_key
FROM unique_rgn AS animal
WHERE related.animal_key IS NULL AND related.animal_rgn = animal.rgn;

WITH unique_rgn AS (
  SELECT rgn, min(animal_key) AS animal_key
  FROM public.animals
  GROUP BY rgn
  HAVING count(*) = 1
    AND (
      SELECT count(*)
      FROM public.animals AS same_rgn
      WHERE upper(btrim(same_rgn.rgn)) = upper(btrim(animals.rgn))
    ) = 1
)
UPDATE public.exchanges AS related
SET animal_key = animal.animal_key
FROM unique_rgn AS animal
WHERE related.animal_key IS NULL AND related.animal_rgn = animal.rgn;

WITH unique_rgn AS (
  SELECT rgn, min(animal_key) AS animal_key
  FROM public.animals
  GROUP BY rgn
  HAVING count(*) = 1
    AND (
      SELECT count(*)
      FROM public.animals AS same_rgn
      WHERE upper(btrim(same_rgn.rgn)) = upper(btrim(animals.rgn))
    ) = 1
)
UPDATE public.exchanges AS related
SET traded_animal_key = animal.animal_key
FROM unique_rgn AS animal
WHERE related.traded_animal_key IS NULL
  AND related.traded_animal_rgn = animal.rgn;

WITH unique_rgn AS (
  SELECT rgn, min(animal_key) AS animal_key
  FROM public.animals
  GROUP BY rgn
  HAVING count(*) = 1
    AND (
      SELECT count(*)
      FROM public.animals AS same_rgn
      WHERE upper(btrim(same_rgn.rgn)) = upper(btrim(animals.rgn))
    ) = 1
)
UPDATE public.exchanges AS related
SET substitute_animal_key = animal.animal_key
FROM unique_rgn AS animal
WHERE related.substitute_animal_key IS NULL
  AND related.substitute_animal_rgn = animal.rgn;

UPDATE public.movements AS related
SET animal_key = animal.animal_key
FROM public.animals AS animal
WHERE related.animal_key IS NULL
  AND related.animal_id::text = animal.id::text;

WITH unique_rgn AS (
  SELECT upper(btrim(rgn)) AS normalized_rgn, min(animal_key) AS animal_key
  FROM public.animals
  GROUP BY upper(btrim(rgn))
  HAVING count(*) = 1
)
UPDATE public.movements AS related
SET animal_key = animal.animal_key
FROM unique_rgn AS animal
WHERE related.animal_key IS NULL
  AND upper(btrim(related.animal_id::text)) = animal.normalized_rgn;

WITH unique_rgn AS (
  SELECT rgn, min(animal_key) AS animal_key
  FROM public.animals
  GROUP BY rgn
  HAVING count(*) = 1
    AND (
      SELECT count(*)
      FROM public.animals AS same_rgn
      WHERE upper(btrim(same_rgn.rgn)) = upper(btrim(animals.rgn))
    ) = 1
)
UPDATE public.agenda_reminders AS related
SET animal_key = animal.animal_key
FROM unique_rgn AS animal
WHERE related.animal_key IS NULL AND related.animal_rgn = animal.rgn;

WITH unique_rgn AS (
  SELECT rgn, min(animal_key) AS animal_key
  FROM public.animals
  GROUP BY rgn
  HAVING count(*) = 1
    AND (
      SELECT count(*)
      FROM public.animals AS same_rgn
      WHERE upper(btrim(same_rgn.rgn)) = upper(btrim(animals.rgn))
    ) = 1
)
UPDATE public.retreats AS related
SET animal_key = animal.animal_key
FROM unique_rgn AS animal
WHERE related.animal_key IS NULL AND related.animal_rgn = animal.rgn;

CREATE INDEX IF NOT EXISTS animal_metrics_weight_animal_key_idx
  ON public.animal_metrics_weight (animal_key);
CREATE INDEX IF NOT EXISTS animal_metrics_ce_animal_key_idx
  ON public.animal_metrics_ce (animal_key);
CREATE INDEX IF NOT EXISTS animal_vaccines_animal_key_idx
  ON public.animal_vaccines (animal_key);
CREATE INDEX IF NOT EXISTS reproduction_events_animal_key_idx
  ON public.reproduction_events (animal_key);
CREATE INDEX IF NOT EXISTS deaths_animal_key_idx ON public.deaths (animal_key);
CREATE INDEX IF NOT EXISTS sales_animal_key_idx ON public.sales (animal_key);
CREATE INDEX IF NOT EXISTS exchanges_animal_key_idx ON public.exchanges (animal_key);
CREATE INDEX IF NOT EXISTS movements_animal_key_idx ON public.movements (animal_key);
CREATE INDEX IF NOT EXISTS agenda_reminders_animal_key_idx
  ON public.agenda_reminders (animal_key);
CREATE INDEX IF NOT EXISTS retreats_animal_key_idx ON public.retreats (animal_key);

COMMIT;
