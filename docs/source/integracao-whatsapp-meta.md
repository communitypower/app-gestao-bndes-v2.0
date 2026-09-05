# Integração oficial do WhatsApp

## Situação atual do portal

| Indicador | Resultado |
|---|---:|
| Integrantes ativos | 16 |
| Com telefone cadastrado | 1 |
| Com consentimento registrado | 1 |
| Elegíveis para alerta no momento | 1 |
| Eventos já implementados | Atribuição, prazo de três dias e atraso |

O portal já usa mensagens de modelo e mantém histórico idempotente em `notification_logs`. A ativação permanece bloqueada enquanto não forem informados o token de acesso e o identificador do número de envio da API oficial.

## Credenciais e configuração na Meta

1. Criar uma aplicação no painel Meta com o caso de uso **Connect with customers through WhatsApp**.
2. Associar ou criar a conta do WhatsApp Business e adicionar o número de envio na área **API Setup**.
3. Criar um usuário de sistema no Business Settings, atribuir a aplicação e a conta do WhatsApp Business e gerar um token permanente com as permissões `business_management`, `whatsapp_business_messaging` e `whatsapp_business_management`.
4. Registrar e aprovar o modelo `estudo_bndes_alerta_atividade` em `pt_BR`, com cinco parâmetros de texto: destinatário, evento, atividade, frente e prazo.
5. Informar ao portal o token permanente e o identificador do número de envio. Ativar somente após conferir telefones no formato internacional e consentimento dos destinatários.

## Fontes oficiais

1. Meta for Developers, [WhatsApp Cloud API Get Started](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started), atualizado em 16 jun. 2026.
2. Meta for Developers, [Register a business phone number](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/registration), atualizado em 26 jun. 2026.

