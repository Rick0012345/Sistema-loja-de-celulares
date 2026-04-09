# Sistema de Gestão para Loja de Celulares

Sistema web para controle de estoque, ordens de serviço, financeiro e lucratividade de uma assistência técnica e loja de celulares.

## Stack Atual

- Frontend: React + Vite + TypeScript
- UI: Tailwind CSS
- Backend: NestJS + TypeScript
- Banco de dados: PostgreSQL
- ORM: Prisma
- Autenticação: JWT
- Infra: Docker Compose

## Arquitetura Escolhida

- Monólito modular
- API REST
- Banco relacional
- Sem fila na versão inicial
- Webhook opcional preparado para integrações futuras

## Módulos do MVP

- Autenticação e usuários
- Clientes
- Estoque e produtos
- Fornecedores
- Ordens de serviço
- Itens da OS
- Histórico de status
- Financeiro
- Dashboard
- Vendas de balcão

## Primeira Entrega Implementada

- API NestJS com Prisma conectada ao PostgreSQL
- Endpoints para autenticação, clientes, estoque, ordens de serviço, dashboard e vendas
- Swagger disponível em `http://localhost:3001/docs`
- Painel React/Vite com indicadores e formulários para cadastro rápido
- Docker Compose configurado para subir banco, backend e frontend

## Regras de Negócio Atuais

- a OS usa status detalhados: aguardando orçamento, aprovação, peça, conserto, pronta para retirada, entregue e cancelada
- uma OS pode ter múltiplos itens, inclusive itens manuais
- ao entregar uma OS com saldo pendente, a forma de pagamento é obrigatória e o backend registra o pagamento automaticamente
- vendas de balcão baixam estoque com origem `venda` e entram no consolidado financeiro do dashboard
- o frontend revalida a sessão do usuário em `GET /auth/me`

## Estrutura Inicial Recomendada

```text
.
├── backend/
├── database/
├── docs/
├── frontend/
├── .env.example
└── docker-compose.yml
```

## Documentação

- [Arquitetura do MVP](file:///c:/Users/po442/OneDrive/Desktop/sistema%20de%20loja%20de%20celular/docs/arquitetura-mvp.md)
- [Modelagem inicial do banco](file:///c:/Users/po442/OneDrive/Desktop/sistema%20de%20loja%20de%20celular/database/schema.sql)

## Ambiente com Docker

O projeto passa a adotar Docker Compose como padrão de ambiente local.

- PostgreSQL já está configurado para subir por padrão
- frontend e backend já sobem no compose padrão
- o backend fica disponível em `http://localhost:3001`
- o frontend fica disponível em `http://localhost:3000`
- o n8n fica disponível em `http://localhost:5678`

## Como subir

Execute na raiz do projeto:

```bash
docker compose up -d
```

Se for a primeira vez usando n8n, copie `.env.example` para `.env` e defina uma chave forte em `N8N_ENCRYPTION_KEY`.

## Endpoints iniciais

- `GET /` status da API
- `GET /auth/status` verifica se já existe usuário
- `POST /auth/login` autentica usuário
- `GET /auth/me` valida a sessão atual
- `GET/POST/PATCH/DELETE /clientes`
- `GET/POST/PATCH /estoque/produtos`
- `POST /estoque/produtos/:id/movimentacoes`
- `GET/POST/PATCH /ordens-servico`
- `PATCH /ordens-servico/:id/status`
- `GET /dashboard/resumo`
- `GET/POST /vendas`
