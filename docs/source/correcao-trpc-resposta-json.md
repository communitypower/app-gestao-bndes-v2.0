# Correção da resposta tRPC na Visão Geral

## Incidente

Em 27 de agosto de 2026, uma consulta da Visão Geral apresentou erro de interpretação de JSON porque recebeu uma resposta iniciada por HTML. O sintoma no cliente foi `Unexpected token '<'`.

## Diagnóstico e correção

A rota `dashboard.overview` foi consultada diretamente no servidor local e no endereço de prévia. Em ambos os casos, respondeu com `application/json`, inclusive para a resposta de autenticação pendente. O servidor já registra a middleware tRPC antes do fallback da aplicação de página única.

Como proteção contra respostas do fallback HTML durante recargas de desenvolvimento, o cliente tRPC passou a enviar explicitamente o cabeçalho `Accept: application/json` em todas as consultas. A função foi isolada e coberta por teste para garantir a preservação dos demais cabeçalhos tRPC.

## Evidências de validação

| Verificação | Resultado |
|---|---|
| Rota `dashboard.overview` na prévia | `401 application/json` sem sessão, comportamento esperado |
| TypeScript | Aprovado |
| Testes automatizados | 103 aprovados |
| Build de produção | Aprovado |
