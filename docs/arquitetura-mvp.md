# Arquitetura do MVP

## Objetivo

Estruturar um sistema web para assistência técnica e loja de celulares com foco em:

- controle de estoque
- abertura e acompanhamento de ordens de serviço
- cálculo de lucro por serviço
- contas a pagar e a receber
- dashboard operacional e financeiro

## Stack Final

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- TanStack Query
- TanStack Table

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

## Módulos de Negócio

### 1. Autenticação e Usuários

Responsável por login, sessão, perfis de acesso e rastreabilidade de ações.

Perfis iniciais sugeridos:

- administrador
- atendente
- técnico
- financeiro

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
- a quantidade é atualizada por movimentação de estoque
- itens usados em OS geram saída de estoque

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

### 9. Dashboard

Responsável por indicadores como:

- aparelhos para entregar hoje
- faturamento do mês
- lucro do mês
- serviços mais lucrativos
- estoque baixo

## Estrutura de Pastas Recomendada

```text
.
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── clientes/
│   │   │   ├── estoque/
│   │   │   ├── fornecedores/
│   │   │   ├── ordens-servico/
│   │   │   ├── financeiro/
│   │   │   ├── dashboard/
│   │   │   └── webhooks/
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
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   ├── lib/
│   │   └── services/
│   └── package.json
├── .env.example
└── docker-compose.yml
```

## Fluxos Principais

### Fluxo 1. Abertura da OS

- cadastrar ou localizar cliente
- informar aparelho e defeito
- registrar senha e termo de responsabilidade
- criar OS em aguardando_orcamento

### Fluxo 2. Orçamento

- adicionar peças
- adicionar mão de obra
- calcular total exibido ao cliente
- calcular lucro interno
- mudar status conforme aprovação

### Fluxo 3. Execução do Conserto

- separar item do estoque
- registrar saída
- atualizar status para em_conserto
- concluir e mudar para pronto_para_retirada

### Fluxo 4. Entrega e Fechamento

- registrar pagamento
- atualizar contas a receber
- marcar como entregue
- manter histórico para consulta futura

## Regras de Negócio Importantes

- preço de custo nunca substitui o preço histórico do item da OS
- preço de venda do produto é referência, mas o item da OS guarda snapshot
- lucro da OS considera mão de obra e venda das peças menos custo das peças
- estoque deve ser controlado por movimentações, não apenas por edição direta da quantidade
- mudança de status deve gerar histórico

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

- financeiro
- dashboard
- fornecedores
- pagamentos

### Etapa 3

- webhook de pronto para retirada
- relatórios avançados
- anexos e documentos
