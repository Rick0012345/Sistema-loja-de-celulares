# Workflow de OS pronta

Arquivo para importar no n8n:

- `docs/n8n/ordem-servico-pronta.workflow.json`

O fluxo faz isto:

1. Recebe um webhook do backend quando a OS muda para `pronto_para_retirada`.
2. Usa um node `Postgres` para buscar as configuracoes salvas no banco.
3. Valida o token enviado no header `x-webhook-token`.
4. Monta a mensagem final com base em `tipoEntrega`.
5. Envia o WhatsApp pela Evolution API usando `HTTP Request`.

## Configuracoes lidas do banco

O workflow busca na tabela `configuracoes_loja`:

- `evolution_instance_name`
- `evolution_api_base_url`
- `evolution_api_key`
- `ordem_pronta_webhook_token`

## Credencial Postgres no n8n

Voce precisa selecionar uma credencial `Postgres` no node `Buscar configuracoes Postgres`.

Sugestao de conexao se o `n8n` estiver em Docker na mesma rede do projeto:

- Host: `postgres`
- Database: `loja_celulares`
- User: `postgres`
- Password: `postgres`
- Port: `5432`

## Importacao

1. Abra o n8n.
2. Use `Import from File`.
3. Selecione `docs/n8n/ordem-servico-pronta.workflow.json`.
4. Ative o workflow.

## Endpoint do webhook

O backend esta configurado para chamar:

- Docker: `http://n8n:5678/webhook/ordem-servico-pronta`
- Backend local fora do Docker: `http://localhost:5678/webhook/ordem-servico-pronta`

## Mensagens enviadas

- `retirada_loja`: `vc ja pode retirar na loja`
- `entrega`: `seu conserto esta finalizado, nosso entregador ira realizar a entrega nas proximas horas`

## Observacao importante

O workflow nao depende mais de `$env` para URL da Evolution, API key, token ou nome da instancia.
Esses dados devem ser preenchidos na tela de configuracoes da loja.

Se preferir usar credencial nativa da Evolution dentro do n8n no futuro, o host correto dentro do Docker e:

- `http://evolution-api:8080`

Nao use `http://localhost:8080` dentro do container do `n8n`.
