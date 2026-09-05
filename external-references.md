# Referências externas verificadas

## Tipografia

**Bodoni Moda** foi selecionada para títulos de grande escala por ser uma família serifada de alto contraste com pesos de 400 a 900 e variantes itálicas. Fonte oficial: [Google Fonts — Bodoni Moda](https://fonts.google.com/specimen/Bodoni+Moda), consultada em 30 de julho de 2026.

**Cormorant Garamond** foi selecionada para subtítulos editoriais e textos serifados de apoio, com pesos de 300 a 700 e variantes itálicas. Fonte oficial: [Google Fonts — Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond), consultada em 30 de julho de 2026.

## WhatsApp Business Platform

A documentação oficial da Meta informa que o envio é realizado por `POST /<WHATSAPP_BUSINESS_PHONE_NUMBER_ID>/messages`, com autenticação Bearer e o produto `whatsapp`. Mensagens automáticas enviadas fora da janela de atendimento de 24 horas devem usar modelos previamente aprovados. A integração desta plataforma utiliza, portanto, mensagens de modelo e registra apenas a aceitação da requisição pela API, não confundindo esse retorno com confirmação de entrega.

Fontes oficiais consultadas em 30 de julho de 2026:

1. [Meta for Developers — Service messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages)
2. [Meta for Developers — Template fundamentals](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview)
3. [Meta for Developers — WhatsApp Cloud API Message API](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api)

Requisitos aplicados: consentimento explícito do destinatário, número com código de país, modelo utilitário aprovado, deduplicação por evento e atividade, e registro de erro ou identificador retornado pelo provedor.
