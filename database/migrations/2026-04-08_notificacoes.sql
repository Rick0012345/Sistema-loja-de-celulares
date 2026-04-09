DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notificacao_severidade') THEN
    CREATE TYPE notificacao_severidade AS ENUM ('info', 'warning', 'critical', 'success');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notificacao_tipo') THEN
    CREATE TYPE notificacao_tipo AS ENUM (
      'estoque_baixo',
      'estoque_critico',
      'venda_registrada',
      'ordem_status_atualizado',
      'produto_cadastrado'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo notificacao_tipo NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  mensagem TEXT NOT NULL,
  severidade notificacao_severidade NOT NULL DEFAULT 'info',
  referencia_tipo VARCHAR(60),
  referencia_id UUID,
  metadados JSONB,
  lida BOOLEAN NOT NULL DEFAULT FALSE,
  lida_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notificacoes_created_at
  ON notificacoes(created_at);

CREATE INDEX IF NOT EXISTS idx_notificacoes_lida_created_at
  ON notificacoes(lida, created_at);

CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo_referencia
  ON notificacoes(tipo, referencia_id);
