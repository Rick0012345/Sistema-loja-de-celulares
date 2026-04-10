ALTER TABLE ordens_servico
  ADD COLUMN IF NOT EXISTS criado_por UUID NULL,
  ADD COLUMN IF NOT EXISTS entregue_por UUID NULL;

ALTER TABLE pagamentos_os
  ADD COLUMN IF NOT EXISTS registrado_por UUID NULL;

ALTER TABLE contas_financeiras
  ADD COLUMN IF NOT EXISTS registrado_por UUID NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_ordens_servico_criado_por'
  ) THEN
    ALTER TABLE ordens_servico
      ADD CONSTRAINT fk_ordens_servico_criado_por
      FOREIGN KEY (criado_por) REFERENCES usuarios(id)
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_ordens_servico_entregue_por'
  ) THEN
    ALTER TABLE ordens_servico
      ADD CONSTRAINT fk_ordens_servico_entregue_por
      FOREIGN KEY (entregue_por) REFERENCES usuarios(id)
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_pagamentos_os_registrado_por'
  ) THEN
    ALTER TABLE pagamentos_os
      ADD CONSTRAINT fk_pagamentos_os_registrado_por
      FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_contas_financeiras_registrado_por'
  ) THEN
    ALTER TABLE contas_financeiras
      ADD CONSTRAINT fk_contas_financeiras_registrado_por
      FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
      ON DELETE SET NULL ON UPDATE NO ACTION;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ordem_servico_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  tipo VARCHAR(60) NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  descricao TEXT NULL,
  usuario_id UUID NULL REFERENCES usuarios(id) ON DELETE SET NULL,
  metadados JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ordem_servico_eventos_ordem_created
  ON ordem_servico_eventos (ordem_servico_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ordem_servico_eventos_tipo
  ON ordem_servico_eventos (tipo);
