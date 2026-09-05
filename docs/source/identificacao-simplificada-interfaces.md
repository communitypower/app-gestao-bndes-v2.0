# Identificação simplificada na Gestão de Interfaces

**Data de execução:** 29 de agosto de 2026  
**Escopo:** apresentação de capítulos, itens e fichas vinculadas em interfaces de escopo sobreposto, dependências e coordenação.

## Ajuste aplicado

A ficha de uma interface passa a apresentar cada capítulo relacionado apenas uma vez, com seu código visual e título. Quando há uma atividade-mãe que representa esse mesmo capítulo, o próprio cartão do capítulo torna-se o link para a ficha completa. Dessa forma, a referência deixa de aparecer em sequência como código isolado, código mais título e, novamente, ficha da mesma atividade.

| Antes | Depois |
|---|---|
| Seções relacionadas; itens do plano relacionados; ficha da atividade, podendo repetir o mesmo capítulo. | **Capítulos e fichas relacionadas**, em uma única lista. O cartão do capítulo abre sua ficha quando há vínculo correspondente. |
| Código e título exibidos separadamente em blocos distintos. | Um único identificador visual, composto pelo código e título do capítulo. |
| Todos os itens vinculados repetidos abaixo das seções. | Apenas **itens específicos vinculados**, isto é, etapas ou atividades que não representam o mesmo capítulo. |

## Regra de correspondência

Uma atividade vinculada representa a mesma referência do capítulo quando possui o mesmo código de plano ou o mesmo título, após normalização de espaços e diferenças de maiúsculas/minúsculas. Nessa situação, ela é incorporada ao cartão do capítulo e não aparece novamente na lista de itens específicos. Os vínculos, papéis, permissões e endereços de ficha foram preservados.

## Validação

| Verificação | Resultado |
|---|---|
| Tipagem | `pnpm check` aprovado. |
| Testes existentes de interface e gestão de interfaces | 29 arquivos e 105 testes aprovados. |
| Build de produção | `pnpm build` aprovado. |
| Navegação | Capítulo com ficha vinculada mantém link direto para `/atividades?ficha={id}`. |

> A mudança atua apenas na composição visual da identificação. Nenhuma seção, atividade, item, interface ou histórico foi alterado.
