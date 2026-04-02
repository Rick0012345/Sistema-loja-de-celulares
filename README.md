# Sistema de Gestão para Loja de Celulares

Sistema web para controle de estoque, ordens de serviço, financeiro e lucratividade de uma assistência técnica e loja de celulares.

## Stack Definida

- Frontend: Next.js + TypeScript
- UI: Tailwind CSS + shadcn/ui
- Backend: NestJS + TypeScript
- Banco de dados: PostgreSQL
- ORM: Prisma
- Autenticação: JWT com refresh token
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

## Primeira Entrega Implementada

- API NestJS com Prisma conectada ao PostgreSQL
- Endpoints para autenticação inicial, clientes, estoque, ordens de serviço e dashboard
- Swagger disponível em `http://localhost:3001/docs`
- Painel Next.js com indicadores e formulários para cadastro rápido
- Docker Compose configurado para subir banco, backend e frontend

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
- frontend e backend já sobem com o perfil `scaffold`
- o backend fica disponível em `http://localhost:3001`
- o frontend fica disponível em `http://localhost:3000`

## Como subir

Execute na raiz do projeto:

```bash
docker compose --profile scaffold up -d
```

## Endpoints iniciais

- `GET /` status da API
- `GET /auth/status` verifica se já existe usuário
- `POST /auth/bootstrap-admin` cria o primeiro administrador
- `POST /auth/login` autentica usuário
- `GET/POST/PATCH/DELETE /clientes`
- `GET/POST/PATCH /estoque/produtos`
- `POST /estoque/produtos/:id/movimentacoes`
- `GET/POST /ordens-servico`
- `PATCH /ordens-servico/:id/status`
- `GET /dashboard/resumo`
