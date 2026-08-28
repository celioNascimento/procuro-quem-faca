-- Add portfolio_obrigatorio column to prestadores table
ALTER TABLE public.prestadores ADD COLUMN portfolio_obrigatorio BOOLEAN NOT NULL DEFAULT true;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_prestadores_portfolio_obrigatorio ON public.prestadores(portfolio_obrigatorio);
