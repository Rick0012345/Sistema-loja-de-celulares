# Arquitetura do MVP

## Objetivo

Estruturar um sistema web para assistência técnica e loja de celulares com foco em:

- controle de estoque
- abertura e acompanhamento de ordens de serviço
- cálculo de lucro por serviço
- contas a pagar e a receber
- dashboard operacional e financeiro

## Stack Atual

### Frontend

- React 19
- Vite
- TypeScript
- Tailwind CSS
- SPA com views por contexto operacional

### Backend

- NestJS
- TypeScript
- Prisma
- Swagger
- JWT

### Banco e Infra

- PostgreSQL
- Docker Compose

## Decisão de Arquitetura

- arquitetura monolítica modular
- frontend separado do backend
- API REST no backend
- banco relacional centralizado
- sem Redis e sem filas na fase inicial
- suporte futuro a webhook sem acoplamento forte
- Docker Compose como ambiente padrão local

## Módulos de Negócio

### 1. Autenticação e Usuários

Responsável por login, sessão, perfis de acesso e rastreabilidade de ações.

Perfis iniciais sugeridos:

- administrador
- atendente
- técnico
- financeiro

Regras atuais:

- login emite access token JWT
- a sessão do frontend é revalidada em `GET /auth/me`
- o administrador principal é sincronizado via variáveis de ambiente

### 2. Clientes

Responsável por cadastro, contato e histórico de ordens de serviço.

Campos essenciais:

- nome
- telefone
- e-mail
- CPF

### 3. Estoque e Produtos

Responsável por catálogo de peças, custo, preço de venda, quantidade e alerta de estoque baixo.

Regras principais:

- cada peça possui preço de custo e preço de venda
- a quantidade é preferencialmente auditada por movimentação de estoque
- itens usados em OS geram saída de estoque
- vendas de balcão geram saída com origem `venda`

### 4. Fornecedores

Responsável por origem das peças e vínculo com contas a pagar.

### 5. Ordens de Serviço

Responsável por abertura da OS, dados do aparelho, defeito relatado, senha, orçamento e andamento.

Status sugeridos:

- aguardando_orcamento
- aguardando_aprovacao
- aguardando_peca
- em_conserto
- pronto_para_retirada
- entregue
- cancelada

Regras atuais:

- o frontend trabalha com os mesmos status detalhados do backend
- a OS pode conter múltiplos itens
- cada item pode vir de produto do estoque ou ser manual

### 6. Itens da OS

Responsável por associar peças e serviços à OS.

Regras principais:

- cada item guarda custo e preço no momento do orçamento
- os valores ficam congelados para manter o histórico correto

### 7. Histórico de Status

Responsável por registrar mudança de etapa da OS e usuário responsável.

### 8. Financeiro

Responsável por:

- contas a pagar
- contas a receber
- pagamentos da OS
- lucro por serviço
- visão mensal de faturamento

Regras atuais:

- ao concluir uma OS com saldo pendente, a forma de pagamento é obrigatória
- a entrega registra automaticamente um pagamento em `pagamentos_os`
- vendas de balcão geram `contas_financeiras` já pagas

### 9. Dashboard

Responsável por indicadores como:

- aparelhos para entregar hoje
- faturamento do mês
- lucro do mês
- serviços mais lucrativos
- estoque baixo

Regras atuais:

- o dashboard financeiro consolida pagamentos de OS com vendas de balcão pagas
- lucro mensal considera lucro estimado de OS e margem apurada das vendas

## Estrutura Atual do Projeto

```text
.
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── clientes/
│   │   │   ├── estoque/
│   │   │   ├── ordens-servico/
│   │   │   ├── dashboard/
│   │   │   └── vendas/
│   │   ├── common/
│   │   └── main.ts
│   ├── prisma/
│   └── package.json
├── database/
│   └── schema.sql
├── docs/
│   └── arquitetura-mvp.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── views/
│   │   ├── App.tsx
│   │   └── types.ts
│   └── package.json
├── .env.example
└── docker-compose.yml
```

## Fluxos Principais

### Fluxo 1. Abertura da OS

- cadastrar ou localizar cliente
- informar aparelho e defeito
- registrar senha e termo de responsabilidade
- incluir zero, um ou vários itens
- criar OS em aguardando_orcamento

### Fluxo 2. Orçamento

- adicionar peças
- adicionar mão de obra
- calcular total exibido ao cliente
- calcular lucro interno
- mudar status para aguardando_aprovacao
- se necessário, mudar para aguardando_peca

### Fluxo 3. Execução do Conserto

- separar item do estoque
- ao entrar em em_conserto, pronto_para_retirada ou entregue, o backend garante a baixa pendente das peças vinculadas
- registrar saída com origem de ordem de serviço
- atualizar status para em_conserto
- concluir e mudar para pronto_para_retirada

### Fluxo 4. Entrega e Fechamento

- selecionar forma de pagamento
- registrar pagamento da OS
- marcar como entregue
- manter histórico para consulta futura

### Fluxo 5. Venda de Balcão

- selecionar produto e quantidade
- registrar forma de pagamento
- gerar saída de estoque com origem `venda`
- gerar conta financeira recebida
- considerar a venda no dashboard financeiro

## Regras de Negócio Importantes

- preço de custo nunca substitui o preço histórico do item da OS
- preço de venda do produto é referência, mas o item da OS guarda snapshot
- lucro da OS considera mão de obra e venda das peças menos custo das peças
- vendas e consumo de OS precisam deixar trilha de movimentação de estoque compatível com a origem do evento
- mudança de status deve gerar histórico
- entrega de OS com saldo pendente exige forma de pagamento
- dashboard deve usar dados consolidados do backend, não recálculos locais divergentes

## Preparação para Integrações Futuras

Na mudança para pronto_para_retirada, o backend pode:

- registrar evento interno
- gravar tentativa de notificação
- chamar webhook HTTP opcional

Sem fila, o comportamento inicial deve ser simples:

- a requisição principal conclui a mudança de status
- a tentativa de integração é curta e controlada
- falhas de integração são registradas para acompanhamento

## Roadmap do MVP

### Etapa 1

- autenticação
- clientes
- estoque
- ordens de serviço
- itens da OS
- histórico de status

### Etapa 2

- fornecedores
- webhook de pronto para retirada
- relatórios avançados

### Etapa 3

- anexos e documentos
- contas a pagar completas
- automações externas opcionais
