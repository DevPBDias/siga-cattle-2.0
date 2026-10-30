-- =============================================================================
-- INDI OURO 2.0 - Supabase Schema Completo (Idempotente)
-- SEGURO para banco existente: nao apaga dados.
-- Usa CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS.
-- DROP POLICY/TRIGGER IF EXISTS antes de recriar = pode reexecutar.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- FARMS
CREATE TABLE IF NOT EXISTS farms (
  id         TEXT    PRIMARY KEY,
  farm_name  TEXT    NOT NULL,
  created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted   BOOLEAN NOT NULL DEFAULT FALSE
);

-- USER_PROFILES
CREATE TABLE IF NOT EXISTS user_profiles (
  id                      TEXT    PRIMARY KEY,
  full_name               TEXT,
  residential_address     TEXT,
  cpf                     TEXT,
  phone                   TEXT,
  email                   TEXT,
  farm_name               TEXT,
  farm_state_registration TEXT,
  farm_address            TEXT,
  farm_city               TEXT,
  farm_car_number         TEXT,
  farm_sigcar             TEXT,
  farm_nirb               TEXT,
  farm_ccir               TEXT,
  role                    TEXT,
  permissions             JSONB,
  owner_id                TEXT,
  created_at              BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at              BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted                BOOLEAN NOT NULL DEFAULT FALSE
);

-- ANIMALS
CREATE TABLE IF NOT EXISTS animals (
  rgn                       TEXT    PRIMARY KEY,
  name                      TEXT,
  sex                       TEXT,
  is_natural_bull           BOOLEAN,
  born_date                 DATE,
  serie_rgd                 TEXT    NOT NULL DEFAULT '',
  breed                     TEXT,
  born_color                TEXT,
  iabcgz                    TEXT,
  deca                      TEXT,
  p                         TEXT,
  f                         TEXT,
  status                    TEXT,
  document_situation        TEXT,
  farm_id                   TEXT,
  type                      TEXT,
  genotyping                TEXT,
  condition                 TEXT,
  classification            TEXT,
  animal_state              TEXT,
  defects                   TEXT[],
  parturition_from          JSONB,
  father_name               TEXT,
  mother_serie_rgd          TEXT,
  mother_rgn                TEXT,
  maternal_grandfather_name TEXT,
  paternal_grandfather_name TEXT,
  partnership               TEXT,
  animal_image              TEXT,
  created_at                BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at                BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted                  BOOLEAN NOT NULL DEFAULT FALSE
);

-- CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id                 TEXT    PRIMARY KEY,
  name               TEXT    NOT NULL,
  cpf_cnpj           TEXT    NOT NULL,
  inscricao_estadual TEXT,
  phone              TEXT,
  farm               TEXT,
  city               TEXT,
  email              TEXT,
  created_at         BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at         BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted           BOOLEAN NOT NULL DEFAULT FALSE
);

-- VACCINES
CREATE TABLE IF NOT EXISTS vaccines (
  id           TEXT    PRIMARY KEY,
  vaccine_name TEXT    NOT NULL,
  created_at   BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at   BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted     BOOLEAN NOT NULL DEFAULT FALSE
);

-- ANIMAL_VACCINES
CREATE TABLE IF NOT EXISTS animal_vaccines (
  id         TEXT    PRIMARY KEY,
  rgn        TEXT    NOT NULL,
  vaccine_id TEXT    NOT NULL,
  date       DATE,
  created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted   BOOLEAN NOT NULL DEFAULT FALSE
);

-- ANIMAL_METRICS_WEIGHT
CREATE TABLE IF NOT EXISTS animal_metrics_weight (
  id          TEXT    PRIMARY KEY,
  rgn         TEXT    NOT NULL,
  born_metric BOOLEAN,
  date        TEXT,
  value       NUMERIC,
  created_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted    BOOLEAN NOT NULL DEFAULT FALSE
);

-- ANIMAL_METRICS_CE
CREATE TABLE IF NOT EXISTS animal_metrics_ce (
  id          TEXT    PRIMARY KEY,
  rgn         TEXT    NOT NULL,
  born_metric BOOLEAN,
  date        TEXT,
  value       NUMERIC,
  created_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted    BOOLEAN NOT NULL DEFAULT FALSE
);

-- ANIMAL_STATUSES
CREATE TABLE IF NOT EXISTS animal_statuses (
  id          TEXT    PRIMARY KEY,
  status_name TEXT    NOT NULL,
  created_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted    BOOLEAN NOT NULL DEFAULT FALSE
);

-- ANIMAL_SITUATIONS
CREATE TABLE IF NOT EXISTS animal_situations (
  id             TEXT    PRIMARY KEY,
  situation_name TEXT    NOT NULL,
  created_at     BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at     BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted       BOOLEAN NOT NULL DEFAULT FALSE
);

-- REPRODUCTION_EVENTS
CREATE TABLE IF NOT EXISTS reproduction_events (
  event_id                 TEXT    PRIMARY KEY,
  rgn                      TEXT    NOT NULL,
  event_type               TEXT    NOT NULL,
  productive_status        TEXT,
  age                      NUMERIC,
  evaluation_date          DATE,
  body_score               INTEGER,
  gestational_condition    TEXT,
  ovary_size               TEXT,
  ovary_structure          TEXT,
  cycle_stage              TEXT,
  protocol_name            TEXT,
  d0_date                  DATE    NOT NULL,
  d8_date                  DATE,
  d10_date                 DATE,
  d11_date                 DATE,
  bull_name                TEXT,
  bull_image               TEXT,
  d22_date                 DATE,
  d30_date                 DATE,
  diagnostic_d30           TEXT,
  d32_date                 DATE,
  resync_bull              TEXT,
  calving_start_date       DATE,
  calving_end_date         DATE,
  natural_mating_d35_entry DATE,
  natural_mating_bull      TEXT,
  natural_mating_d80_exit  DATE,
  d110_date                DATE,
  final_diagnostic         TEXT,
  pregnancy_origin         TEXT,
  created_at               BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at               BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted                 BOOLEAN NOT NULL DEFAULT FALSE
);

-- DEATHS
CREATE TABLE IF NOT EXISTS deaths (
  id          TEXT    PRIMARY KEY,
  animal_rgn  TEXT    NOT NULL,
  date        TEXT    NOT NULL,
  reason      TEXT    NOT NULL,
  mother_name TEXT,
  photos      TEXT[]  NOT NULL DEFAULT '{}',
  photo_paths TEXT[]  NOT NULL DEFAULT '{}',
  created_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted    BOOLEAN NOT NULL DEFAULT FALSE
);

-- SALES
CREATE TABLE IF NOT EXISTS sales (
  id                TEXT    PRIMARY KEY,
  animal_rgn        TEXT    NOT NULL,
  client_id         TEXT    NOT NULL,
  date              TEXT    NOT NULL,
  total_value       NUMERIC,
  down_payment      NUMERIC,
  payment_method    TEXT,
  installments      INTEGER,
  installment_value NUMERIC,
  financial_status  TEXT,
  gta_number        TEXT,
  invoice_number    TEXT,
  sale_type         TEXT,
  created_at        BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at        BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted          BOOLEAN NOT NULL DEFAULT FALSE
);

-- EXCHANGES
CREATE TABLE IF NOT EXISTS exchanges (
  id                    TEXT    PRIMARY KEY,
  animal_rgn            TEXT    NOT NULL,
  date                  TEXT    NOT NULL,
  client_id             TEXT    NOT NULL,
  traded_animal_rgn     TEXT    NOT NULL,
  substitute_animal_rgn TEXT,
  value_difference      NUMERIC,
  created_at            BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at            BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted              BOOLEAN NOT NULL DEFAULT FALSE
);

-- MOVEMENTS
CREATE TABLE IF NOT EXISTS movements (
  id         TEXT    PRIMARY KEY,
  type       TEXT    NOT NULL,
  date       TEXT    NOT NULL,
  event_date TEXT,
  animal_id  TEXT    NOT NULL,
  details_id TEXT    NOT NULL,
  created_by TEXT,
  created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted   BOOLEAN NOT NULL DEFAULT FALSE
);

-- SEMEN_DOSES
CREATE TABLE IF NOT EXISTS semen_doses (
  id                        TEXT    PRIMARY KEY,
  animal_name               TEXT    NOT NULL,
  animal_image              TEXT,
  father_name               TEXT,
  maternal_grandfather_name TEXT,
  iabcz                     TEXT,
  registration              TEXT,
  center_name               TEXT,
  breed                     TEXT    NOT NULL,
  quantity                  NUMERIC NOT NULL,
  created_at                BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at                BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted                  BOOLEAN NOT NULL DEFAULT FALSE
);

-- AGENDA_REMINDERS
CREATE TABLE IF NOT EXISTS agenda_reminders (
  id          TEXT    PRIMARY KEY,
  title       TEXT    NOT NULL,
  description TEXT,
  date        TEXT,
  animal_rgn  TEXT,
  created_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted    BOOLEAN NOT NULL DEFAULT FALSE
);

-- RETREATS
CREATE TABLE IF NOT EXISTS retreats (
  id         TEXT    PRIMARY KEY,
  animal_rgn TEXT,
  date       TEXT,
  reason     TEXT,
  created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
  _deleted   BOOLEAN NOT NULL DEFAULT FALSE
);

-- =============================================================================
-- ADD COLUMN IF NOT EXISTS (adiciona colunas faltantes em tabelas existentes)
-- Executa em cada tabela individualmente. Seguro: nao altera dados existentes.
-- =============================================================================

-- farms
ALTER TABLE farms ADD COLUMN IF NOT EXISTS updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS _deleted   BOOLEAN NOT NULL DEFAULT FALSE;

-- user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS updated_at              BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS created_at              BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS _deleted                BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS full_name               TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS residential_address     TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS cpf                     TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS phone                   TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email                   TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS farm_name               TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS farm_state_registration TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS farm_address            TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS farm_city               TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS farm_car_number         TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS farm_sigcar             TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS farm_nirb               TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS farm_ccir               TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role                    TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS permissions             JSONB;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS owner_id                TEXT;

-- animals
ALTER TABLE animals ADD COLUMN IF NOT EXISTS updated_at                BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS created_at                BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS _deleted                  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS serie_rgd                 TEXT    NOT NULL DEFAULT '';
ALTER TABLE animals ADD COLUMN IF NOT EXISTS iabcgz                    TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS deca                      TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS p                         TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS f                         TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS document_situation        TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS genotyping                TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS condition                 TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS classification            TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS animal_state              TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS defects                   TEXT[];
ALTER TABLE animals ADD COLUMN IF NOT EXISTS parturition_from          JSONB;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS father_name               TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS mother_serie_rgd          TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS mother_rgn                TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS maternal_grandfather_name TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS paternal_grandfather_name TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS partnership               TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS animal_image              TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS is_natural_bull           BOOLEAN;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS born_color                TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS farm_id                   TEXT;
ALTER TABLE animals ADD COLUMN IF NOT EXISTS type                      TEXT;

-- clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at         BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at         BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS _deleted           BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS inscricao_estadual TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone              TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS farm               TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city               TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email              TEXT;

-- vaccines
ALTER TABLE vaccines ADD COLUMN IF NOT EXISTS updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE vaccines ADD COLUMN IF NOT EXISTS created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE vaccines ADD COLUMN IF NOT EXISTS _deleted   BOOLEAN NOT NULL DEFAULT FALSE;

-- animal_vaccines
ALTER TABLE animal_vaccines ADD COLUMN IF NOT EXISTS updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE animal_vaccines ADD COLUMN IF NOT EXISTS created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE animal_vaccines ADD COLUMN IF NOT EXISTS _deleted   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE animal_vaccines ADD COLUMN IF NOT EXISTS date       DATE;

-- animal_metrics_weight
ALTER TABLE animal_metrics_weight ADD COLUMN IF NOT EXISTS updated_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE animal_metrics_weight ADD COLUMN IF NOT EXISTS created_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE animal_metrics_weight ADD COLUMN IF NOT EXISTS _deleted    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE animal_metrics_weight ADD COLUMN IF NOT EXISTS born_metric BOOLEAN;
ALTER TABLE animal_metrics_weight ADD COLUMN IF NOT EXISTS date        TEXT;
ALTER TABLE animal_metrics_weight ADD COLUMN IF NOT EXISTS value       NUMERIC;

-- animal_metrics_ce
ALTER TABLE animal_metrics_ce ADD COLUMN IF NOT EXISTS updated_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE animal_metrics_ce ADD COLUMN IF NOT EXISTS created_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE animal_metrics_ce ADD COLUMN IF NOT EXISTS _deleted    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE animal_metrics_ce ADD COLUMN IF NOT EXISTS born_metric BOOLEAN;
ALTER TABLE animal_metrics_ce ADD COLUMN IF NOT EXISTS date        TEXT;
ALTER TABLE animal_metrics_ce ADD COLUMN IF NOT EXISTS value       NUMERIC;

-- animal_statuses
ALTER TABLE animal_statuses ADD COLUMN IF NOT EXISTS updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE animal_statuses ADD COLUMN IF NOT EXISTS created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE animal_statuses ADD COLUMN IF NOT EXISTS _deleted   BOOLEAN NOT NULL DEFAULT FALSE;

-- animal_situations
ALTER TABLE animal_situations ADD COLUMN IF NOT EXISTS updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE animal_situations ADD COLUMN IF NOT EXISTS created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE animal_situations ADD COLUMN IF NOT EXISTS _deleted   BOOLEAN NOT NULL DEFAULT FALSE;

-- reproduction_events
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS updated_at                BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS created_at                BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS _deleted                  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS productive_status         TEXT;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS age                       NUMERIC;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS evaluation_date           DATE;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS body_score                INTEGER;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS gestational_condition     TEXT;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS ovary_size                TEXT;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS ovary_structure           TEXT;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS cycle_stage               TEXT;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS protocol_name             TEXT;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS d8_date                   DATE;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS d10_date                  DATE;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS d11_date                  DATE;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS bull_name                 TEXT;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS bull_image                TEXT;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS d22_date                  DATE;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS d30_date                  DATE;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS diagnostic_d30            TEXT;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS d32_date                  DATE;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS resync_bull               TEXT;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS calving_start_date        DATE;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS calving_end_date          DATE;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS natural_mating_d35_entry  DATE;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS natural_mating_bull       TEXT;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS natural_mating_d80_exit   DATE;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS d110_date                 DATE;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS final_diagnostic          TEXT;
ALTER TABLE reproduction_events ADD COLUMN IF NOT EXISTS pregnancy_origin          TEXT;

-- deaths (tabela com problema: faltava updated_at)
ALTER TABLE deaths ADD COLUMN IF NOT EXISTS updated_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE deaths ADD COLUMN IF NOT EXISTS created_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE deaths ADD COLUMN IF NOT EXISTS _deleted    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE deaths ADD COLUMN IF NOT EXISTS mother_name TEXT;
ALTER TABLE deaths ADD COLUMN IF NOT EXISTS photos      TEXT[]  NOT NULL DEFAULT '{}';
ALTER TABLE deaths ADD COLUMN IF NOT EXISTS photo_paths TEXT[]  NOT NULL DEFAULT '{}';

-- sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS updated_at        BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS created_at        BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS _deleted          BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS total_value       NUMERIC;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS down_payment      NUMERIC;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS payment_method    TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS installments      INTEGER;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS installment_value NUMERIC;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS financial_status  TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS gta_number        TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS invoice_number    TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_type         TEXT;

-- exchanges
ALTER TABLE exchanges ADD COLUMN IF NOT EXISTS updated_at             BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE exchanges ADD COLUMN IF NOT EXISTS created_at             BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE exchanges ADD COLUMN IF NOT EXISTS _deleted               BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE exchanges ADD COLUMN IF NOT EXISTS substitute_animal_rgn  TEXT;
ALTER TABLE exchanges ADD COLUMN IF NOT EXISTS value_difference        NUMERIC;

-- movements
ALTER TABLE movements ADD COLUMN IF NOT EXISTS updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE movements ADD COLUMN IF NOT EXISTS created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE movements ADD COLUMN IF NOT EXISTS _deleted   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE movements ADD COLUMN IF NOT EXISTS event_date TEXT;
ALTER TABLE movements ADD COLUMN IF NOT EXISTS created_by TEXT;

-- semen_doses
ALTER TABLE semen_doses ADD COLUMN IF NOT EXISTS updated_at                BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE semen_doses ADD COLUMN IF NOT EXISTS created_at                BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE semen_doses ADD COLUMN IF NOT EXISTS _deleted                  BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE semen_doses ADD COLUMN IF NOT EXISTS animal_image              TEXT;
ALTER TABLE semen_doses ADD COLUMN IF NOT EXISTS father_name               TEXT;
ALTER TABLE semen_doses ADD COLUMN IF NOT EXISTS maternal_grandfather_name TEXT;
ALTER TABLE semen_doses ADD COLUMN IF NOT EXISTS iabcz                     TEXT;
ALTER TABLE semen_doses ADD COLUMN IF NOT EXISTS registration               TEXT;
ALTER TABLE semen_doses ADD COLUMN IF NOT EXISTS center_name               TEXT;

-- agenda_reminders
ALTER TABLE agenda_reminders ADD COLUMN IF NOT EXISTS updated_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE agenda_reminders ADD COLUMN IF NOT EXISTS created_at  BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE agenda_reminders ADD COLUMN IF NOT EXISTS _deleted    BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE agenda_reminders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE agenda_reminders ADD COLUMN IF NOT EXISTS date        TEXT;
ALTER TABLE agenda_reminders ADD COLUMN IF NOT EXISTS animal_rgn  TEXT;

-- retreats
ALTER TABLE retreats ADD COLUMN IF NOT EXISTS updated_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE retreats ADD COLUMN IF NOT EXISTS created_at BIGINT  NOT NULL DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
ALTER TABLE retreats ADD COLUMN IF NOT EXISTS _deleted   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE retreats ADD COLUMN IF NOT EXISTS date       TEXT;
ALTER TABLE retreats ADD COLUMN IF NOT EXISTS reason     TEXT;
ALTER TABLE retreats ADD COLUMN IF NOT EXISTS animal_rgn TEXT;

-- =============================================================================
-- INDICES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_farms_updated_at             ON farms (updated_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_updated_at     ON user_profiles (updated_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_owner_id       ON user_profiles (owner_id);
CREATE INDEX IF NOT EXISTS idx_animals_updated_at           ON animals (updated_at);
CREATE INDEX IF NOT EXISTS idx_animals_farm_id              ON animals (farm_id);
CREATE INDEX IF NOT EXISTS idx_animals_animal_state         ON animals (animal_state);
CREATE INDEX IF NOT EXISTS idx_animals_name_trgm            ON animals USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_clients_updated_at           ON clients (updated_at);
CREATE INDEX IF NOT EXISTS idx_vaccines_updated_at          ON vaccines (updated_at);
CREATE INDEX IF NOT EXISTS idx_animal_vaccines_rgn          ON animal_vaccines (rgn);
CREATE INDEX IF NOT EXISTS idx_animal_vaccines_vaccine_id   ON animal_vaccines (vaccine_id);
CREATE INDEX IF NOT EXISTS idx_animal_vaccines_updated_at   ON animal_vaccines (updated_at);
CREATE INDEX IF NOT EXISTS idx_amw_rgn                      ON animal_metrics_weight (rgn);
CREATE INDEX IF NOT EXISTS idx_amw_updated_at               ON animal_metrics_weight (updated_at);
CREATE INDEX IF NOT EXISTS idx_amce_rgn                     ON animal_metrics_ce (rgn);
CREATE INDEX IF NOT EXISTS idx_amce_updated_at              ON animal_metrics_ce (updated_at);
CREATE INDEX IF NOT EXISTS idx_animal_statuses_updated_at   ON animal_statuses (updated_at);
CREATE INDEX IF NOT EXISTS idx_animal_situations_updated_at ON animal_situations (updated_at);
CREATE INDEX IF NOT EXISTS idx_repr_events_rgn              ON reproduction_events (rgn);
CREATE INDEX IF NOT EXISTS idx_repr_events_event_type       ON reproduction_events (event_type);
CREATE INDEX IF NOT EXISTS idx_repr_events_updated_at       ON reproduction_events (updated_at);
CREATE INDEX IF NOT EXISTS idx_deaths_animal_rgn            ON deaths (animal_rgn);
CREATE INDEX IF NOT EXISTS idx_deaths_date                  ON deaths (date);
CREATE INDEX IF NOT EXISTS idx_deaths_updated_at            ON deaths (updated_at);
CREATE INDEX IF NOT EXISTS idx_sales_animal_rgn             ON sales (animal_rgn);
CREATE INDEX IF NOT EXISTS idx_sales_client_id              ON sales (client_id);
CREATE INDEX IF NOT EXISTS idx_sales_date                   ON sales (date);
CREATE INDEX IF NOT EXISTS idx_sales_updated_at             ON sales (updated_at);
CREATE INDEX IF NOT EXISTS idx_exchanges_animal_rgn         ON exchanges (animal_rgn);
CREATE INDEX IF NOT EXISTS idx_exchanges_client_id          ON exchanges (client_id);
CREATE INDEX IF NOT EXISTS idx_exchanges_updated_at         ON exchanges (updated_at);
CREATE INDEX IF NOT EXISTS idx_movements_animal_id          ON movements (animal_id);
CREATE INDEX IF NOT EXISTS idx_movements_type               ON movements (type);
CREATE INDEX IF NOT EXISTS idx_movements_date               ON movements (date);
CREATE INDEX IF NOT EXISTS idx_movements_updated_at         ON movements (updated_at);
CREATE INDEX IF NOT EXISTS idx_semen_doses_updated_at       ON semen_doses (updated_at);
CREATE INDEX IF NOT EXISTS idx_agenda_reminders_updated_at  ON agenda_reminders (updated_at);
CREATE INDEX IF NOT EXISTS idx_agenda_reminders_date        ON agenda_reminders (date);
CREATE INDEX IF NOT EXISTS idx_retreats_updated_at          ON retreats (updated_at);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE farms               ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE animals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccines            ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_vaccines     ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_metrics_weight ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_metrics_ce   ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_statuses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE animal_situations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE reproduction_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE deaths              ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales               ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchanges           ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements           ENABLE ROW LEVEL SECURITY;
ALTER TABLE semen_doses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda_reminders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE retreats            ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- POLITICAS RLS (DROP IF EXISTS = idempotente)
-- =============================================================================
DROP POLICY IF EXISTS "farms_all"             ON farms;
DROP POLICY IF EXISTS "animals_all"           ON animals;
DROP POLICY IF EXISTS "clients_all"           ON clients;
DROP POLICY IF EXISTS "vaccines_all"          ON vaccines;
DROP POLICY IF EXISTS "animal_vaccines_all"   ON animal_vaccines;
DROP POLICY IF EXISTS "amw_all"               ON animal_metrics_weight;
DROP POLICY IF EXISTS "amce_all"              ON animal_metrics_ce;
DROP POLICY IF EXISTS "animal_statuses_all"   ON animal_statuses;
DROP POLICY IF EXISTS "animal_situations_all" ON animal_situations;
DROP POLICY IF EXISTS "repr_events_all"       ON reproduction_events;
DROP POLICY IF EXISTS "deaths_all"            ON deaths;
DROP POLICY IF EXISTS "sales_all"             ON sales;
DROP POLICY IF EXISTS "exchanges_all"         ON exchanges;
DROP POLICY IF EXISTS "movements_all"         ON movements;
DROP POLICY IF EXISTS "semen_doses_all"       ON semen_doses;
DROP POLICY IF EXISTS "agenda_reminders_all"  ON agenda_reminders;
DROP POLICY IF EXISTS "retreats_all"          ON retreats;
DROP POLICY IF EXISTS "user_profiles_select"  ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert"  ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update"  ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete"  ON user_profiles;

CREATE POLICY "farms_all"             ON farms               FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "animals_all"           ON animals             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "clients_all"           ON clients             FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vaccines_all"          ON vaccines            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "animal_vaccines_all"   ON animal_vaccines     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "amw_all"               ON animal_metrics_weight FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "amce_all"              ON animal_metrics_ce   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "animal_statuses_all"   ON animal_statuses     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "animal_situations_all" ON animal_situations   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "repr_events_all"       ON reproduction_events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "deaths_all"            ON deaths              FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "sales_all"             ON sales               FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "exchanges_all"         ON exchanges           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "movements_all"         ON movements           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "semen_doses_all"       ON semen_doses         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agenda_reminders_all"  ON agenda_reminders    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "retreats_all"          ON retreats            FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- user_profiles: leitura para todos os usuarios autenticados da fazenda; gravacao para o proprio usuario ou donos
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE TO authenticated
  USING (
    id::text = auth.uid()::text 
    OR owner_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id::text = auth.uid()::text AND up.role = 'owner'
    )
  )
  WITH CHECK (
    id::text = auth.uid()::text 
    OR owner_id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id::text = auth.uid()::text AND up.role = 'owner'
    )
  );
CREATE POLICY "user_profiles_delete" ON user_profiles FOR DELETE TO authenticated
  USING (
    id::text = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id::text = auth.uid()::text AND up.role = 'owner'
    )
  );

-- =============================================================================
-- TRIGGERS (DROP IF EXISTS = idempotente)
-- =============================================================================
DROP TRIGGER IF EXISTS trg_farms_updated_at             ON farms;
DROP TRIGGER IF EXISTS trg_user_profiles_updated_at     ON user_profiles;
DROP TRIGGER IF EXISTS trg_animals_updated_at           ON animals;
DROP TRIGGER IF EXISTS trg_clients_updated_at           ON clients;
DROP TRIGGER IF EXISTS trg_vaccines_updated_at          ON vaccines;
DROP TRIGGER IF EXISTS trg_animal_vaccines_updated_at   ON animal_vaccines;
DROP TRIGGER IF EXISTS trg_amw_updated_at               ON animal_metrics_weight;
DROP TRIGGER IF EXISTS trg_amce_updated_at              ON animal_metrics_ce;
DROP TRIGGER IF EXISTS trg_animal_statuses_updated_at   ON animal_statuses;
DROP TRIGGER IF EXISTS trg_animal_situations_updated_at ON animal_situations;
DROP TRIGGER IF EXISTS trg_repr_events_updated_at       ON reproduction_events;
DROP TRIGGER IF EXISTS trg_deaths_updated_at            ON deaths;
DROP TRIGGER IF EXISTS trg_sales_updated_at             ON sales;
DROP TRIGGER IF EXISTS trg_exchanges_updated_at         ON exchanges;
DROP TRIGGER IF EXISTS trg_movements_updated_at         ON movements;
DROP TRIGGER IF EXISTS trg_semen_doses_updated_at       ON semen_doses;
DROP TRIGGER IF EXISTS trg_agenda_reminders_updated_at  ON agenda_reminders;
DROP TRIGGER IF EXISTS trg_retreats_updated_at          ON retreats;

CREATE TRIGGER trg_farms_updated_at             BEFORE UPDATE ON farms               FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_user_profiles_updated_at     BEFORE UPDATE ON user_profiles       FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_animals_updated_at           BEFORE UPDATE ON animals             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_clients_updated_at           BEFORE UPDATE ON clients             FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_vaccines_updated_at          BEFORE UPDATE ON vaccines            FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_animal_vaccines_updated_at   BEFORE UPDATE ON animal_vaccines     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_amw_updated_at               BEFORE UPDATE ON animal_metrics_weight FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_amce_updated_at              BEFORE UPDATE ON animal_metrics_ce   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_animal_statuses_updated_at   BEFORE UPDATE ON animal_statuses     FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_animal_situations_updated_at BEFORE UPDATE ON animal_situations   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_repr_events_updated_at       BEFORE UPDATE ON reproduction_events FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_deaths_updated_at            BEFORE UPDATE ON deaths              FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_sales_updated_at             BEFORE UPDATE ON sales               FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_exchanges_updated_at         BEFORE UPDATE ON exchanges           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_movements_updated_at         BEFORE UPDATE ON movements           FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_semen_doses_updated_at       BEFORE UPDATE ON semen_doses         FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_agenda_reminders_updated_at  BEFORE UPDATE ON agenda_reminders    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_retreats_updated_at          BEFORE UPDATE ON retreats            FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============================================================================
-- FUNCAO: criar perfil automaticamente apos signup
-- =============================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, created_at, updated_at, _deleted)
  VALUES (
    NEW.id::text,
    NEW.email,
    (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT,
    FALSE
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================================================
-- REALTIME
-- Usa bloco DO com EXCEPTION para ignorar erro caso tabela ja esteja
-- na publicacao (ALTER PUBLICATION nao suporta IF EXISTS nativamente).
-- =============================================================================
DO $$
DECLARE
  tbls TEXT[] := ARRAY[
    'animals', 'farms', 'user_profiles', 'clients', 'vaccines',
    'animal_vaccines', 'animal_metrics_weight', 'animal_metrics_ce',
    'animal_statuses', 'animal_situations', 'reproduction_events',
    'deaths', 'sales', 'exchanges', 'movements', 'semen_doses',
    'agenda_reminders', 'retreats'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY tbls LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', tbl);
    EXCEPTION WHEN OTHERS THEN
      -- Ignora erro se tabela ja estiver na publicacao
      NULL;
    END;
  END LOOP;
END;
$$;

-- FIM DO SCRIPT

