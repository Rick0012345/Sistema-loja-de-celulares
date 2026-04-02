CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE perfil_usuario AS ENUM (
  'administrador',
  'atendente',
  'tecnico',
  'financeiro'
);

CREATE TYPE status_ordem_servico AS ENUM (
  'aguardando_orcamento',
  'aguardando_aprovacao',
  'aguardando_peca',
  'em_conserto',
  'pronto_para_retirada',
  'entregue',
  'cancelada'
);

CREATE TYPE tipo_movimentacao_estoque AS ENUM (
  'entrada',
  'saida',
  'ajuste'
);

CREATE TYPE origem_movimentacao_estoque AS ENUM (
  'compra',
  'ordem_servico',
  'ajuste_manual'
);

CREATE TYPE status_pagamento AS ENUM (
  'pendente',
  'pago',
  'cancelado'
);

CREATE TYPE meio_pagamento AS ENUM (
  'dinheiro',
  'pix',
  'cartao_credito',
  'cartao_debito',
  'transferencia'
);

CREATE TYPE tipo_conta_financeira AS ENUM (
  'pagar',
  'receber'
);

CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(180) NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  perfil perfil_usuario NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(150) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(180),
  cpf VARCHAR(14),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(150) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(180),
  documento VARCHAR(20),
  contato VARCHAR(120),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE categorias_produto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE produtos_pecas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(180) NOT NULL,
  marca VARCHAR(80),
  modelo_compatavel VARCHAR(120),
  categoria_id UUID REFERENCES categorias_produto(id),
  fornecedor_id UUID REFERENCES fornecedores(id),
  sku VARCHAR(80) UNIQUE,
  quantidade_estoque INTEGER NOT NULL DEFAULT 0,
  estoque_minimo INTEGER NOT NULL DEFAULT 0,
  preco_custo NUMERIC(12,2) NOT NULL,
  preco_venda NUMERIC(12,2) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_produto_quantidade_nao_negativa CHECK (quantidade_estoque >= 0),
  CONSTRAINT ck_produto_estoque_minimo_nao_negativo CHECK (estoque_minimo >= 0),
  CONSTRAINT ck_produto_preco_custo_nao_negativo CHECK (preco_custo >= 0),
  CONSTRAINT ck_produto_preco_venda_nao_negativo CHECK (preco_venda >= 0)
);

CREATE TABLE ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  atendente_id UUID REFERENCES usuarios(id),
  tecnico_id UUID REFERENCES usuarios(id),
  aparelho_marca VARCHAR(80) NOT NULL,
  aparelho_modelo VARCHAR(120) NOT NULL,
  aparelho_cor VARCHAR(50),
  imei VARCHAR(30),
  defeito_relatado TEXT NOT NULL,
  observacoes TEXT,
  senha_desbloqueio VARCHAR(120),
  termo_responsabilidade_aceito BOOLEAN NOT NULL DEFAULT FALSE,
  valor_mao_de_obra NUMERIC(12,2) NOT NULL DEFAULT 0,
  desconto NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  lucro_estimado NUMERIC(12,2) NOT NULL DEFAULT 0,
  status status_ordem_servico NOT NULL DEFAULT 'aguardando_orcamento',
  data_entrada TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  data_saida TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_os_valor_mao_obra_nao_negativo CHECK (valor_mao_de_obra >= 0),
  CONSTRAINT ck_os_desconto_nao_negativo CHECK (desconto >= 0),
  CONSTRAINT ck_os_valor_total_nao_negativo CHECK (valor_total >= 0)
);

CREATE TABLE itens_os (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos_pecas(id),
  descricao_item VARCHAR(180) NOT NULL,
  quantidade INTEGER NOT NULL,
  custo_unitario NUMERIC(12,2) NOT NULL,
  venda_unitaria NUMERIC(12,2) NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_item_os_quantidade_positiva CHECK (quantidade > 0),
  CONSTRAINT ck_item_os_custo_nao_negativo CHECK (custo_unitario >= 0),
  CONSTRAINT ck_item_os_venda_nao_negativa CHECK (venda_unitaria >= 0),
  CONSTRAINT ck_item_os_subtotal_nao_negativo CHECK (subtotal >= 0)
);

CREATE TABLE historico_status_os (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  status_anterior status_ordem_servico,
  status_novo status_ordem_servico NOT NULL,
  alterado_por UUID REFERENCES usuarios(id),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE movimentacoes_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES produtos_pecas(id),
  tipo tipo_movimentacao_estoque NOT NULL,
  origem origem_movimentacao_estoque NOT NULL,
  origem_id UUID,
  quantidade INTEGER NOT NULL,
  custo_unitario NUMERIC(12,2),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_movimentacao_quantidade_diferente_zero CHECK (quantidade <> 0),
  CONSTRAINT ck_movimentacao_custo_unitario_nao_negativo CHECK (custo_unitario IS NULL OR custo_unitario >= 0)
);

CREATE TABLE pagamentos_os (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ordem_servico_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  valor NUMERIC(12,2) NOT NULL,
  meio meio_pagamento NOT NULL,
  status status_pagamento NOT NULL DEFAULT 'pago',
  pago_em TIMESTAMPTZ,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_pagamento_os_valor_positivo CHECK (valor > 0)
);

CREATE TABLE contas_financeiras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tipo_conta_financeira NOT NULL,
  descricao VARCHAR(180) NOT NULL,
  cliente_id UUID REFERENCES clientes(id),
  fornecedor_id UUID REFERENCES fornecedores(id),
  ordem_servico_id UUID REFERENCES ordens_servico(id),
  valor NUMERIC(12,2) NOT NULL,
  vencimento DATE,
  status status_pagamento NOT NULL DEFAULT 'pendente',
  pago_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ck_conta_financeira_valor_positivo CHECK (valor > 0)
);

CREATE TABLE webhook_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento VARCHAR(100) NOT NULL,
  referencia_id UUID NOT NULL,
  payload JSONB NOT NULL,
  sucesso BOOLEAN NOT NULL DEFAULT FALSE,
  resposta TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_clientes_telefone ON clientes(telefone);
CREATE INDEX idx_produtos_pecas_nome ON produtos_pecas(nome);
CREATE INDEX idx_produtos_pecas_quantidade ON produtos_pecas(quantidade_estoque);
CREATE INDEX idx_ordens_servico_cliente ON ordens_servico(cliente_id);
CREATE INDEX idx_ordens_servico_status ON ordens_servico(status);
CREATE INDEX idx_ordens_servico_data_entrada ON ordens_servico(data_entrada);
CREATE INDEX idx_itens_os_ordem_servico ON itens_os(ordem_servico_id);
CREATE INDEX idx_historico_status_os_ordem_servico ON historico_status_os(ordem_servico_id);
CREATE INDEX idx_movimentacoes_estoque_produto ON movimentacoes_estoque(produto_id);
CREATE INDEX idx_pagamentos_os_ordem_servico ON pagamentos_os(ordem_servico_id);
CREATE INDEX idx_contas_financeiras_tipo_status ON contas_financeiras(tipo, status);
CREATE INDEX idx_webhook_eventos_evento ON webhook_eventos(evento);
