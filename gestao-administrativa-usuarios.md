# Gestão administrativa de usuários e permissões

## Escopo

A rota `/usuarios-permissoes` é restrita a administradores e reúne contas autenticadas e pré-cadastros em um único diretório. A tela permite pesquisar pessoas, consultar perfil, estado de acesso e último login, além de alterar perfil e estado de cada registro.

## Perfis e estados

| Tipo de registro | Perfis disponíveis | Estados disponíveis |
| --- | --- | --- |
| Conta autenticada | administrador, colaborador | ativo, revogado |
| Pré-cadastro | administrador, colaborador | pendente, ativado, revogado |

Uma conta revogada é bloqueada antes de qualquer procedimento protegido. Alterações em contas e pré-cadastros geram evento auditável com operador, perfil anterior, novo perfil e data. O administrador não pode reduzir ou revogar o próprio acesso.

## Ativação por e-mail

No primeiro login, o e-mail autenticado é normalizado e comparado com os pré-cadastros. Quando há correspondência pendente ou ativada, o perfil provisionado é aplicado à conta e o pré-cadastro é vinculado à identidade autenticada.
