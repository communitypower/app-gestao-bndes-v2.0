# Correção de validação do rótulo de material ou evidência

**Data de execução:** 29 de agosto de 2026  
**Ocorrência:** tentativa de vincular material ou evidência em `/atividades?ficha=30001` com rótulo inferior a três caracteres.

## Causa e correção

O formulário permitia clicar em **Vincular** com um rótulo não vazio, porém com menos de três caracteres. A API corretamente recusava o pedido pela regra mínima de validação, mas a mensagem técnica era apresentada após a tentativa de envio.

O formulário agora normaliza o rótulo antes da operação, bloqueia o envio se ele tiver menos de três caracteres e informa de forma clara a exigência mínima. O campo também expõe estado inválido para tecnologias assistivas e o botão permanece desabilitado enquanto rótulo ou endereço não estiverem válidos.

| Situação | Comportamento atual |
|---|---|
| Rótulo vazio | Botão desabilitado. |
| Rótulo com 1 ou 2 caracteres | Botão desabilitado; campo identificado como inválido. |
| Rótulo com 3 ou mais caracteres e endereço preenchido | Botão habilitado e mutação enviada com valores normalizados. |

## Validação

Foi incluído teste de regressão que abre a ficha, preenche endereço e um rótulo de um caractere e confirma o estado inválido e o bloqueio do botão. A suíte totalizou 106 testes aprovados, além de `pnpm check` e `pnpm build` aprovados.
