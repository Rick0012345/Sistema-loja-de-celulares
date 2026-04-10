ALTER TABLE configuracoes_loja
ADD COLUMN IF NOT EXISTS evolution_api_base_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS evolution_api_key TEXT,
ADD COLUMN IF NOT EXISTS ordem_pronta_webhook_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS ordem_pronta_webhook_token VARCHAR(255);
