# Correção da tela em branco na versão publicada

## Diagnóstico

A prévia de desenvolvimento carregava normalmente, mas o domínio publicado mantinha o elemento `#root` vazio. A reexecução controlada do módulo principal no navegador revelou:

> `TypeError: Cannot read properties of undefined (reading 'createContext')`

O bundle de produção continha uma dependência circular forçada: `vendor-misc` importava `vendor-react` e `vendor-react` importava `vendor-misc`. A inicialização do primeiro chunk tentava acessar React antes de sua definição, impedindo a montagem da aplicação.

## Correção

A função `manualChunks` foi removida de `vite.config.ts`. O Rollup voltou a determinar automaticamente os chunks, eliminando o ciclo. Foi adicionado o teste `server/productionBundle.test.ts`, que impede a reintrodução da divisão manual problemática.

## Validação

| Verificação | Resultado |
|---|---|
| Testes automatizados | 76 aprovados em 19 arquivos |
| TypeScript | sem erros |
| Build de produção | concluído |
| Importações circulares `vendor-react`/`vendor-misc` | ausentes |
| Prévia `/` | renderizada |
| Prévia `/atividades` | renderizada |
| Servidor e navegador da prévia | sem erros atuais |

