# Validação dos títulos completos das atividades

Em **31 de julho de 2026**, a rota autenticada `/atividades` foi capturada em página completa, com resolução de 1280 × 720 pixels. A interface apresentou o contador **21 registros** e exibiu, da seção **5.1** à **5.21**, o título canônico completo de cada seção como título da atividade.

| Seção | Título exibido na interface |
|---|---|
| 5.1 | Políticas industriais nos principais países produtores e blocos |
| 5.2 | Políticas industriais no Brasil |
| 5.3 | Transporte marítimo no mundo |
| 5.4 | Indústria de óleo e gás e energia offshore mundial |
| 5.5 | Construção naval no mundo |
| 5.6 | Transporte marítimo no Brasil |
| 5.7 | Transporte aquaviário interior no Brasil |
| 5.8 | Indústria de óleo e gás e energia eólica offshore no Brasil |
| 5.9 | Descarbonização: oportunidades e desafios para a indústria de construção naval |
| 5.10 | Construção naval e offshore no Brasil |
| 5.11 | Construção naval militar |
| 5.12 | Reparo naval no Brasil |
| 5.13 | Desmantelamento e descomissionamento |
| 5.14 | Cadeia produtiva da indústria de construção naval |
| 5.15 | Padrão tecnológico e competitividade da indústria naval brasileira |
| 5.16 | Políticas de marinha mercante no mundo |
| 5.17 | Políticas de construção naval no mundo |
| 5.18 | Políticas brasileiras de marinha mercante e construção naval |
| 5.19 | O Fundo da Marinha Mercante |
| 5.20 | Aspectos geopolíticos da indústria marítima |
| 5.21 | Cenários econômicos e institucionais brasileiros |

> A inspeção integral confirmou que nenhum dos 21 registros visíveis mantém o prefixo genérico `Elaborar diagnóstico da seção`.

A evidência visual foi complementada pela atualização agregada do banco e pelo teste `shared/domain.test.ts`, que compara os 21 títulos de atividades iniciais com `STUDY_SECTIONS`. A suíte final passou com **36 testes**, seguida de verificação TypeScript e build de produção bem-sucedidos.
