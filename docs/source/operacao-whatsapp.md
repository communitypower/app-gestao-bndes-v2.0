# Ativação operacional do WhatsApp

A plataforma já contém o fluxo completo, idempotente e rastreável para os três eventos definidos: **atribuição**, **três dias antes da entrega** e **marcação como atrasado**. O envio real depende das credenciais da conta oficial do WhatsApp Business e da publicação da aplicação.

## Pré-requisitos

1. Criar ou abrir um aplicativo do tipo Business em [Meta for Developers](https://developers.facebook.com/apps/).
2. Em **WhatsApp > API Setup**, copiar o **Phone Number ID** para `WHATSAPP_PHONE_NUMBER_ID`.
3. Em [Configurações do negócio](https://business.facebook.com/settings/), criar um usuário do sistema, atribuir o aplicativo e a conta do WhatsApp e gerar um token permanente com `whatsapp_business_messaging` e `whatsapp_business_management`. Esse valor deve ser armazenado como `WHATSAPP_ACCESS_TOKEN`.
4. Criar e obter aprovação para um modelo utilitário. O nome inicial esperado pela plataforma é `estudo_bndes_alerta_atividade`, no idioma `pt_BR`.
5. Cadastrar, na área **Equipe**, o telefone em formato internacional e registrar o consentimento de WhatsApp de cada destinatário.

## Ativação após a publicação

1. Publicar a versão pelo botão **Publish** da interface de gerenciamento.
2. Abrir **Administração**, habilitar os envios e conferir o nome e o idioma do modelo aprovado.
3. Selecionar **Ativar após publicação** para registrar a rotina diária autenticada.
4. Usar **Processar agora** para uma verificação manual controlada, quando necessário.

O processamento registra histórico, deduplica cada atividade e evento e realiza no máximo três tentativas em caso de falha transitória. A rotina não cria outros eventos nem outras variações de prazo.
