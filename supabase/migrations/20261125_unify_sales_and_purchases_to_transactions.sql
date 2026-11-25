-- Migration: Unificar vendas (sales) e compras em uma única tabela "transactions"

BEGIN;

-- 1. Renomear a tabela sales existente para transactions
ALTER TABLE IF EXISTS public.sales RENAME TO transactions;

-- 2. Adicionar colunas para suportar vendas e compras na mesma tabela
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS transaction_type TEXT NOT NULL DEFAULT 'venda';

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS adt TEXT;

-- 3. Garantir registros antigos marcados como 'venda'
UPDATE public.transactions
SET transaction_type = 'venda'
WHERE transaction_type IS NULL;

-- 4. Atualizar índices
DROP INDEX IF EXISTS idx_sales_animal_rgn;
DROP INDEX IF EXISTS idx_sales_client_id;
DROP INDEX IF EXISTS idx_sales_date;
DROP INDEX IF EXISTS idx_sales_updated_at;
DROP INDEX IF EXISTS sales_animal_key_idx;

CREATE INDEX IF NOT EXISTS idx_transactions_animal_key ON public.transactions(animal_key);
CREATE INDEX IF NOT EXISTS idx_transactions_animal_rgn ON public.transactions(animal_rgn);
CREATE INDEX IF NOT EXISTS idx_transactions_client_id  ON public.transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date       ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type       ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_updated_at ON public.transactions(updated_at);

-- 5. Atualizar RLS e Trigger de updated_at
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sales_all" ON public.transactions;
DROP POLICY IF EXISTS "transactions_all" ON public.transactions;
CREATE POLICY "transactions_all" ON public.transactions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP TRIGGER IF EXISTS trg_sales_updated_at ON public.transactions;
DROP TRIGGER IF EXISTS trg_transactions_updated_at ON public.transactions;
CREATE TRIGGER trg_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 6. Garantir remoção da tabela purchases caso tenha sido criada
DROP TABLE IF EXISTS public.purchases CASCADE;

COMMIT;
