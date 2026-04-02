# Frontend

Painel em React + Vite para o sistema de loja e assistencia tecnica.

## Desenvolvimento

1. Instale as dependencias com `npm install`
2. Copie `.env.example` para `.env`
3. Ajuste `VITE_API_URL` para a URL do backend
4. Rode `npm run dev`

O frontend agora consome os endpoints de:

- `GET/POST/PATCH/DELETE /estoque/produtos`
- `GET/POST /clientes`
- `GET/POST /ordens-servico`
- `PATCH /ordens-servico/:id/status`
- `GET /dashboard/resumo`
