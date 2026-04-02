# Backend

API NestJS do sistema de gestão da loja de celulares.

## Módulos implementados

- auth
- clientes
- estoque
- ordens-servico
- dashboard

## Recursos disponíveis

- Prisma conectado ao PostgreSQL
- Swagger em `http://localhost:3001/docs`
- bootstrap do primeiro administrador
- cadastro de clientes
- cadastro e movimentação de estoque
- abertura de ordens de serviço com baixa automática de estoque
- resumo operacional para dashboard

## Execução

Na raiz do projeto:

```bash
docker compose --profile scaffold up -d backend
```
