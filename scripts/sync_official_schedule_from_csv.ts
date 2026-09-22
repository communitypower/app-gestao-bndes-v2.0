import fs from "fs";
import path from "path";
import { PDF_ANALYTIC_SECTIONS, PDF_ANALYTIC_ITEMS } from "../shared/pdfAnalyticIndex";

const rawCsv = `Atividade,Data de início,Data de término
Apresentação,M5,M6
1. Introdução,M1,M4
1.1. Objetivos,M1,M4
"1.2. Escopo setorial, temporal e geográfico",M1,M4
1.3. Metodologia e fontes de informação,M1,M4
1.4. Estrutura do relatório e articulação entre os tomos,M1,M4
2. Economia Marítima,M1,M5
2.1. Conceito e delimitação da economia marítima,M1,M3
2.2. Interdependências entre a construção naval e demais setores marítimos,M1,M3
2.3. Relevância estratégica e econômica da economia marítima,M1,M3
"2.4. Vetores de transformação: geopolítica, transição energética, cadeias globais e regulação ambiental",M1,M5
3. Transporte Marítimo Mundial,M1,M4
3.1. Evolução do comércio e do transporte marítimo mundial,M1,M3
3.2. Regulamentação internacional do transporte marítimo,M1,M3
3.3. Principais tipos de embarcações: aspectos tecnológicos e operacionais,M1,M3
3.4. Estrutura e evolução da frota mercante,M1,M3
"3.5. Mercado de transporte de granéis líquidos, gases liquefeitos e produtos químicos",M1,M3
3.6. Mercado de transporte de granéis sólidos,M1,M3
3.7. Mercado de transporte de contêineres,M1,M3
"3.8. Outros segmentos: veículos, cargas de projeto, apoio marítimo e portuário",M1,M3
"3.9. Evolução dos preços, fretes e condições de mercado",M1,M3
"3.10. Carteira de encomendas, renovação da frota e perspectivas de demanda por novas embarcações",M3,M4
"3.11. Fatores econômicos, geopolíticos e ambientais que condicionam a expansão, renovação e transformação tecnológica das frotas",M3,M4
3.12. Perspectivas do transporte marítimo mundial e implicações para a marinha mercante e a indústria naval brasileiras,M3,M4
4. Transporte Marítimo no Brasil,M1,M4
4.1. Evolução da marinha mercante brasileira,M1,M3
4.2. Principais fluxos de transporte marítimo de cabotagem e longo curso,M1,M3
4.3. Regulamentação do transporte marítimo no Brasil,M1,M3
"4.4. Estrutura e organização dos mercados: empresas, frotas, bandeiras e afretamento",M1,M3
4.5. Integração às redes mundiais de transporte marítimo,M1,M4
4.6. Apoio portuário e apoio marítimo,M1,M4
4.7. Custos diferenciais da bandeira brasileira,M2,M4
4.8. Panorama do setor pesqueiro,M1,M4
"4.9. Cenários de demanda para construção, reparo, conversão e modernização de navios e embarcações de apoio",M3,M4
5. Transporte Hidroviário Interior,M1,M5
5.1. Principais bacias e sistemas de navegação interior no Brasil,M1,M3
5.2. Regulamentação da navegação interior,M1,M3
5.3. Principais tipos de embarcações: aspectos tecnológicos e operacionais,M1,M3
5.4. Infraestrutura e condições de navegabilidade,M2,M4
5.5. Fluxos e estrutura das operações,M2,M4
5.6. Empresas e frotas,M2,M4
5.7. Transporte multimodal,M2,M4
5.8. Navegação fluvial de percurso internacional,M2,M4
5.9. Transporte de passageiros na Região Amazônica,M3,M5
5.10. Transporte hidroviário urbano,M3,M5
5.11. Navegação interior e desenvolvimento regional,M3,M5
5.12. Cenários de demanda para construção de embarcações fluviais,M4,M5
6. Indústria de Óleo e Gás e de Energia Eólica Offshore,M1,M5
6.1. Evolução e perspectivas da indústria mundial de óleo e gás offshore,M1,M4
6.2. Marcos regulatórios nos principais polos,M1,M4
6.3. Principais tipos de unidades flutuantes de exploração e produção: aspectos tecnológicos e operacionais,M1,M4
"6.4. Mercado internacional de unidades de exploração e produção offshore: demanda, oferta, formas de contratação e preços",M1,M4
6.5. Embarcações de apoio e aliviadores: aspectos tecnológicos e operacionais,M1,M4
"6.6. Mercado internacional de embarcações de apoio e aliviadores: regiões de operação, demanda, oferta, formas de contratação e preços",M1,M4
"6.7. Atividade offshore no Brasil: campos, empresas e perspectivas",M1,M4
6.8. Frota e demanda por unidades flutuantes de produção e sondas no Brasil,M1,M4
"6.9. Cenários de demanda de E&P no Brasil: construção, fabricação e integração de módulos e descomissionamento",M3,M5
6.10. Mercado brasileiro de navios aliviadores e embarcações de apoio offshore,M3,M5
"6.11. O setor de geração eólica offshore no Brasil: evolução, perspectivas e regulamentação",M2,M5
6.12. Tipos de instalações e embarcações para energia eólica offshore: aspectos tecnológicos e operacionais,M3,M5
"6.13. Cenários de demanda por navios aliviadores, embarcações de apoio especializadas e instalações de geração eólica offshore no Brasil",M4,M5
7. Construção naval militar,M1,M4
7.1. Construção naval militar no mundo: políticas navais e modelos de governança,M1,M2
7.2. Principais tipos de navios e embarcações militares: aspectos tecnológicos e operacionais,M1,M2
7.3. Evolução da construção naval militar no Brasil,M1,M2
7.4. Programas navais em curso e previstos,M2,M3
"7.5. Programas de offset, clusters navais e estratégias de inovação",M2,M4
7.6. Participação da indústria local e processos de transferência de tecnologia,M2,M4
"7.7. Gargalos econômicos, produtivos e tecnológicos",M3,M4
7.8. Oportunidades para inserção nas cadeias globais,M3,M4
8. Descarbonização na Indústria Marítima,M1,M5
"8.1. Direcionadores globais, metas e regulamentação internacional da descarbonização marítima",M1,M1
8.2. Estratégias de descarbonização nos principais países e regiões,M2,M4
"8.3. Respostas de armadores, operadores, portos e fornecedores de energia à descarbonização",M2,M4
"8.4. Combustíveis marítimos alternativos: características, disponibilidade, custos e perspectivas",M2,M4
"8.5. Tecnologias de eficiência energética e redução de emissões: casco, propulsão, sistemas de controle e digitalização",M2,M4
"8.6. Maturidade tecnológica, custos e perspectivas de adoção das tecnologias de descarbonização",M3,M5
"8.7. Frota mundial: adoção de combustíveis alternativos e tecnologias de eficiência energética por segmento, país e perfil de empresa",M2,M3
"8.8. Impactos da descarbonização sobre os mercados, renovação da frota e demanda por novas embarcações e retrofitting",M4,M5
8.9. Frota brasileira: estratégias de descarbonização dos armadores,M3,M5
8.10. Potencial competitivo do Brasil na produção e utilização de combustíveis marítimos renováveis,M4,M5
"8.11. Infraestrutura de abastecimento, bunkering, portos e corredores verdes",M4,M5
1. Construção Naval Mundial,M1,M5
1.1. Análise da trajetória e da estrutura atual da construção naval mundial,M1,M3
"1.2. Evolução da produção, da capacidade dos estaleiros e dos padrões de produção",M1,M3
"1.3. Segmentos da indústria naval: navios mercantes, offshore, apoio marítimo, defesa e outros",M1,M3
"1.4. Principais estaleiros e organizações empresariais: estatais e privados, grupos de estaleiros, verticalização e escala",M1,M3
1.5. Protecionismo e fatores de competitividade,M2,M4
1.6. Estrutura e integração da cadeia produtiva,M2,M4
"1.7. Transformações ambientais, tecnológicas e geopolíticas e tendências da construção naval mundial",M3,M5
2. Experiências nacionais de desenvolvimento da indústria naval,M1,M5
2.1. Dimensões de análise das experiências nacionais: protecionismo; evolução da indústria; estrutura empresarial; especialização; qualificação tecnológica; recursos humanos; cadeia de fornecedores; inserção internacional; evolução da produtividade; competitividade; resultados produtivos; estratégias de desenvolvimento tecnológico e catching-up,M1,M2
2.2. Japão,M1,M4
2.3. Coreia do Sul,M1,M4
2.4. China,M1,M4
2.5. Singapura,M1,M4
2.6. Estados Unidos,M2,M4
2.7. Países europeus selecionados,M2,M4
2.8. Índia,M3,M5
2.9. Vietnã,M3,M5
2.10. Indonésia,M3,M5
2.11. Outros produtores emergentes,M4,M5
3. Construção naval e offshore no Brasil,M1,M4
3.1. Antecedentes e formação da indústria naval moderna brasileira,M1,M3
3.2. O ciclo das décadas de 1970 e 1980,M1,M3
3.3. O ciclo das décadas de 2000 e 2010,M1,M3
3.4. Evolução da construção de navios e embarcações,M1,M3
"3.5. Evolução da construção de unidades offshore, fabricação de módulos, integração e comissionamento",M1,M3
3.6. Evolução da construção naval militar,M1,M3
"3.7. Evolução da estrutura industrial: empresas, capacidade produtiva, distribuição geográfica e cadeia de fornecedores",M2,M4
3.8. Evolução da qualificação tecnológica e dos recursos humanos,M2,M4
"3.9. Contratos, produção realizada, preços, prazos e desempenho",M3,M4
"3.10. Fatores econômicos, empresariais, tecnológicos, regulatórios e institucionais associados aos ciclos de expansão e retração",M3,M4
4. Estrutura atual e capacidade dos estaleiros brasileiros,M1,M5
"4.1. Dimensões de análise dos estaleiros e instalações: evolução das instalações, organização corporativa, capacidade, produção e desempenho; estrutura e situação atuais; segmentos de atuação; carteiras de encomendas; engenharia de projeto e de processos; infraestrutura industrial; processos produtivos; organização e gestão; potencial de reativação, modernização e adaptação",M1,M2
4.2. Estaleiros de construção de navios e embarcações,M2,M5
4.3. Estaleiros de construção de embarcações fluviais,M2,M5
"4.4. Estaleiros e instalações para construção de unidades offshore, fabricação e integração de módulos",M2,M5
4.5. Estaleiros de construção naval militar,M2,M5
"4.6. Cadeia produtiva, por tipo de produto e região",M2,M5
4.7. Economias e deseconomias de localização e os polos navais,M3,M5
"5. Reparo, conversão, desmantelamento e descomissionamento",M1,M5
5.1. Reparo naval: características do mercado mundial e principais polos,M1,M4
"5.2. Estaleiros de construção e de reparo: diferenças estruturais, tecnológicas e operacionais",M1,M4
5.3. Regulamentação internacional do desmantelamento e reciclagem de navios: Convenção de Hong Kong e requisitos ambientais,M1,M3
"5.4. Mercado mundial de desmantelamento e reciclagem de navios: estrutura, principais polos e tendências",M1,M3
"5.5. Descomissionamento de unidades offshore: características, regulamentação e mercado mundial",M1,M3
5.6. Regulamentação brasileira do desmantelamento e reciclagem de navios e plataformas,M2,M4
"5.7. Demanda brasileira por reparo, docagem e retrofitting de embarcações",M2,M4
"5.8. Demanda brasileira por reparo, conversão e descomissionamento de unidades offshore",M2,M4
"5.9. Empresas, instalações e capacidade nacional para reparo, conversão, desmantelamento e descomissionamento",M2,M4
5.10. Competição internacional e competitividade das atividades no Brasil,M4,M5
"5.11. Desafios e oportunidades para reparo, retrofitting, desmantelamento e descomissionamento no Brasil",M4,M5
6. Cadeia produtiva da indústria de construção naval,M1,M6
"6.1. Estrutura da cadeia produtiva da construção naval: principais segmentos, produtos e relações entre estaleiros e fornecedores",M1,M2
6.2. Perfil de nacionalização de componentes nos principais países produtores de navios,M1,M4
"6.3. Indústrias de materiais, equipamentos e sistemas navais nos principais países produtores",M1,M4
6.4. Evolução do conteúdo nacional e da cadeia de fornecedores nas diferentes fases da indústria naval brasileira,M3,M5
6.5. Estrutura atual da cadeia de fornecedores da indústria naval brasileira,M3,M5
"6.6. Cadeia de fornecedores por segmento: construção de navios, embarcações fluviais, offshore e construção naval militar",M3,M5
6.7. Distribuição regional e capacidade dos fornecedores nacionais,M3,M5
"6.8. Conteúdo nacional, dependências externas e lacunas produtivas e tecnológicas",M3,M5
6.9. Relações entre estaleiros e fornecedores e formas de organização da cadeia de suprimentos,M3,M5
6.10. Desafios e oportunidades para a estaleiros brasileiros,M5,M6
7. Padrão tecnológico e recursos humanos,M1,M5
7.1. Capacitação dos estaleiros brasileiros em engenharia de produto e de processo,M1,M4
"7.2. Capacitação dos estaleiros brasileiros em planejamento, organização e gestão da produção",M1,M4
7.3. Força de trabalho empregada nos estaleiros: perfil e qualificação,M2,M4
"7.4. Capacidade de pesquisa, desenvolvimento e inovação em empresas, universidades e centros de pesquisa",M3,M5
"7.5. Relações entre universidades, centros de pesquisa, empresas e a base produtiva da indústria naval",M3,M5
"7.6. Disponibilidade de recursos humanos para a indústria naval nos níveis operacional, técnico, de engenharia e gerencial",M4,M5
"7.7. Sistemas de formação e qualificação profissional nos níveis básico, técnico e superior",M4,M5
8. Produtividade e competitividade,M1,M5
"8.1. Metodologia e indicadores para avaliação tecnológica, de produtividade e desempenho dos estaleiros",M1,M2
"8.2. Padrões tecnológicos, produtividade e desempenho das principais classes de estaleiros mundiais",M2,M4
"8.3. Padrões tecnológicos, produtividade e desempenho dos estaleiros brasileiros nos últimos períodos de operação contínua, na situação atual e potencial",M2,M5
8.4. Benchmarking dos estaleiros brasileiros em relação às classes internacionais relevantes,M3,M5
"8.5. Potencialidades, limitações e gargalos de produtividade e competitividade dos estaleiros brasileiros",M4,M5
8.6. Possibilidades de inserção competitiva e metas de produtividade e desempenho por classe de estaleiro,M5,M5
9. Descarbonização: oportunidades e desafios para a indústria naval,M3,M6
"9.1. Impactos da descarbonização sobre o projeto, a construção e o retrofitting de navios",M3,M5
9.2. Competências requeridas para projeto e construção de navios capazes ou preparados para novos combustíveis,M3,M5
"9.3. Competências requeridas para desenvolvimento e aplicação de tecnologias de eficiência energética, captura de carbono e correlatas",M3,M5
9.4. Requisitos tecnológicos e produtivos para retrofitting de navios,M3,M5
9.5. Capacidades e deficiências dos estaleiros brasileiros para atendimento às novas demandas tecnológicas,M4,M5
9.6. Capacidades e oportunidades para empresas brasileiras de engenharia e fornecedores de equipamentos e sistemas,M4,M5
9.7. Descarbonização dos processos de construção naval,M4,M5
9.8. Oportunidades de inserção competitiva da indústria naval brasileira nos mercados associados à descarbonização,M4,M6
9.9. Principais desafios tecnológicos e produtivos,M4,M6
1. Fundamentos e tendências,M1,M5
1.1. Conceitos e fundamentos da política industrial,M1,M3
1.2. Justificativas econômicas e estratégicas para políticas industriais,M1,M3
1.3. Objetivos e instrumentos de política industrial: políticas horizontais e setoriais,M1,M3
1.4. Transformações ambientais e geopolíticas em curso e tendências,M1,M3
1.5. Evolução das políticas industriais praticadas no Brasil e tendências recentes,M1,M3
1.6. Metodologia para análise da evolução das políticas setoriais voltadas para a indústria naval no Brasil e no mundo,M1,M3
1.7. Relevância dos instrumentos horizontais para a indústria naval: Nova Indústria Brasil (NIB) e outras políticas,M2,M4
1.8. Políticas públicas e mecanismos de fomento à descarbonização marítima e sua aplicabilidade ao Brasil,M2,M5
2. Políticas de marinha mercante no mundo,M1,M6
"2.1. Justificativas econômicas, estratégicas e geopolíticas para políticas de marinha mercante",M1,M4
2.2. Evolução das políticas de marinha mercante desde o pós-guerra,M1,M4
2.3. Regulamentação e organismos internacionais,M1,M4
"2.4. Dimensões de análise das experiências nacionais: evolução das políticas; registros alternativos; financiamento; subsídios; incentivos fiscais; reserva de mercado e de carga; preferência de bandeira; políticas de tripulação; desenvolvimento tecnológico; resultados sobre frota, participação no mercado e competitividade; identificação dos casos mais expressivos de sucesso e falha",M1,M4
2.5. Europa Ocidental,M1,M4
2.6. Estados Unidos,M1,M4
2.7. Japão,M1,M4
2.8. Coreia do Sul,M1,M4
2.9. China,M1,M4
2.10. Singapura,M1,M4
2.11. Austrália e Nova Zelândia,M1,M4
2.12. Europa Oriental e Turquia,M1,M4
2.13. Índia,M1,M4
2.14. Outros casos relevantes,M4,M5
3. Políticas de construção naval no mundo,M1,M4
"3.1. Justificativas econômicas, estratégicas e geopolíticas para políticas de construção naval",M1,M4
3.2. Inter-relação entre políticas de marinha mercante e de construção naval,M1,M4
3.3. Evolução das políticas de construção naval e dos ciclos de industrialização e realocação da produção mundial,M1,M4
3.4. Regulamentação e organismos internacionais,M1,M4
3.5. Dimensões de análise das experiências nacionais: planejamento e políticas de desenvolvimento da indústria; proteção do mercado; participação e controle estatal; subsídios e incentivos fiscais; financiamento; garantias e créditos à exportação; compras governamentais; políticas de conteúdo local; desenvolvimento tecnológico e transferência de tecnologia; cooperação internacional; impacto das políticas governamentais na consolidação da indústria; identificação dos casos mais expressivos de sucesso e falha,M1,M4
3.6. Japão,M1,M4
3.7. Coreia do Sul,M1,M4
3.8. China,M1,M4
3.9. Singapura,M1,M4
3.10. Estados Unidos,M1,M4
3.11. Europa Ocidental,M1,M4
3.12. Índia,M3,M4
3.13. Vietnã,M3,M4
3.14. Indonésia,M3,M4
3.15. Turquia e Europa Oriental,M3,M4
3.16. Outros casos relevantes,M4,M4
4. Políticas brasileiras de marinha mercante e construção naval,M1,M5
"4.1. Políticas marítimas no Brasil: marinha mercante, construção naval, navegação interior, óleo e gás offshore, energias oceânicas e defesa",M1,M3
4.2. Evolução das políticas brasileiras de marinha mercante,M1,M3
4.3. Evolução das políticas brasileiras de construção naval,M1,M3
4.4. Os Planos de Desenvolvimento e os Planos de Construção Naval: ciclos de 1970–1980 e 2000–2010,M1,M3
"4.5. Instrumentos de proteção e incentivo à marinha mercante: reserva de mercado e de carga, preferência de bandeira, afretamento, tripulação e incentivos fiscais",M1,M4
"4.6. Instrumentos de apoio à construção naval: barreiras tributárias e restrições ao afretamento, incentivos fiscais, conteúdo local e compras governamentais",M1,M4
4.7. Financiamento e outros instrumentos financeiros,M1,M4
"4.8. Políticas de pesquisa, desenvolvimento, inovação e formação de recursos humanos",M1,M4
4.9. Clusters navais e políticas de desenvolvimento regional,M1,M4
"4.10. Políticas para os setores de óleo e gás, defesa e energia e seus impactos sobre a indústria naval",M1,M4
4.11. Resultados das políticas brasileiras de marinha mercante e construção naval,M4,M5
4.12. Mudanças recentes e principais questões em debate no Brasil,M4,M5
5. O Fundo da Marinha Mercante,M1,M5
5.1. Descrição geral do sistema,M1,M1
5.2. Histórico e relevância do FMM para a indústria marítima brasileira,M2,M2
5.3. Evolução da regulamentação do AFRMM e do FMM,M2,M2
"5.4. Arrecadação, distribuição e aplicação do AFRMM",M2,M2
"5.5. Eficiência do sistema: projetos financiados, obras concluídas e prazos",M3,M3
5.6. Eficácia do sistema: consolidação das empresas e evolução da competitividade,M3,M3
5.7. Efeitos do financiamento e da utilização das contas vinculadas sobre o custo efetivo de capital: análise e simulações,M4,M5
5.8. Alocação de custos e benefícios: efeitos distributivos intersetoriais e inter-regionais,M3,M5
5.9. Justificativa econômica e estratégica do modelo atual por segmento da navegação,M4,M5
6. Setores críticos da cadeia de suprimentos: siderurgia e materiais e equipamentos navais,M1,M5
6.1. Políticas industriais e perfil de nacionalização da cadeia de suprimentos da indústria naval nos principais países produtores,M1,M4
6.2. Importância da siderurgia e da indústria de materiais e equipamentos navais para a construção naval,M1,M4
6.3. Evolução das indústrias siderúrgica e de materiais e equipamentos navais no Brasil,M2,M5
"6.4. Estrutura atual da oferta de produtos siderúrgicos para a indústria naval brasileira: empresas, capacidade, tecnologia e dependência de importações",M2,M5
"6.5. Estrutura atual da indústria brasileira de materiais e equipamentos navais: setores, empresas, capacidade, tecnologia e dependência de importações",M2,M5
6.6. Políticas industriais e de conteúdo local e evolução dos índices de nacionalização no Brasil,M2,M5
"6.7. Cenários prospectivos, oportunidades e desafios para o desenvolvimento da siderurgia e da indústria de materiais e equipamentos navais",M4,M5
6.8. Importância do desenvolvimento da cadeia nacional de suprimentos para a competitividade da indústria naval brasileira,M4,M5
7. Ciclos de expansão e queda da indústria naval brasileira: diagnóstico de sucessos e falhas,M1,M6
"7.1. O ciclo das décadas de 1970 e 1980 no Brasil: objetivos, instrumentos e resultados",M1,M3
7.2. Fatores endógenos e exógenos da crise e retração nas décadas de 1980 e 1990,M1,M3
7.3. Brasil e Coreia do Sul: análise comparada das trajetórias da indústria naval,M1,M3
"7.4. O ciclo das décadas de 2000 e 2010 no Brasil: objetivos, instrumentos e resultados",M2,M4
7.5. Fatores determinantes da retração da indústria naval brasileira após o ciclo de expansão dos anos 2000,M2,M4
7.6. Brasil e China: análise comparada das trajetórias da indústria naval a partir dos anos 2000,M2,M4
"7.7. Análise comparativa dos ciclos brasileiros: continuidade e coordenação institucional, demanda, financiamento, escala de produção, produtividade, aprendizado tecnológico e inserção internacional",M4,M5
7.8. Problemas sistêmicos e lições para uma nova política de desenvolvimento da indústria naval brasileira,M4,M5
8. Fatores geopolíticos e ambientais críticos para a reestruturação da indústria naval brasileira,M5,M6
"8.1. Transformações geopolíticas e seus impactos sobre o comércio, o transporte marítimo e a indústria naval",M5,M6
8.2. Segurança econômica e reorganização das cadeias globais de produção e suprimento,M5,M6
8.3. Descarbonização e novas exigências ambientais: impactos sobre a demanda e a estrutura da indústria naval,M5,M6
"8.4. Reconfiguração da indústria naval mundial: relocalização de capacidades produtivas, políticas de reindustrialização e novos países produtores",M5,M6
8.5. Segurança e defesa e seus impactos sobre a indústria naval,M5,M6
8.6. Riscos e oportunidades decorrentes das transformações geopolíticas e ambientais para a indústria naval brasileira,M5,M6
9. Ambiente econômico e institucional da indústria marítima brasileira,M4,M6
"9.1. Condições econômicas para o desenvolvimento da indústria marítima brasileira: demanda, ambiente macroeconômico, custo de capital, restrições fiscais, taxa de câmbio e ambiente de investimento",M5,M6
9.2. Organização institucional dos órgãos do Estado com atribuições sobre a indústria marítima,M4,M6
9.3. Coordenação entre órgãos e políticas e continuidade da orientação programática,M4,M6
"9.4. Capacitação técnica, autonomia decisória e continuidade institucional dos órgãos e agências",M4,M6
"9.5. Riscos políticos, econômicos, institucionais e regulatórios para a reestruturação da indústria naval",M5,M6
1. Diagnóstico integrado da indústria naval brasileira,M5,M6
"1.1. Relações entre volume e estabilidade da demanda, capacidade dos estaleiros, produtividade, custos, prazos, qualidade e condições de financiamento",M5,M6
1.2. Compatibilidade entre a demanda potencial e a capacidade de atendimento da indústria naval brasileira nos diferentes segmentos,M5,M6
"1.3. Potencialidades, limitações e gargalos da indústria naval brasileira",M5,M6
"1.4. Potencialidades, limitações e gargalos dos segmentos de reparo, conversão e descomissionamento",M5,M6
"1.5. Impactos da descarbonização e das transformações tecnológicas e geopolíticas sobre a demanda, requisitos tecnológicos e oportunidades para a indústria naval brasileira",M5,M6
1.6. Fatores críticos e incertezas para a construção dos cenários para a indústria naval brasileira,M5,M6
2. Cenários para a indústria naval brasileira,M5,M6
"2.1. Premissas, hipóteses, horizontes temporais e principais incertezas",M5,M6
"2.2. Consolidação das projeções de demanda para transporte marítimo, navegação interior, óleo e gás offshore, energias oceânicas, defesa, reparo e descomissionamento",M5,M6
2.3. Cenários alternativos de volume e composição da demanda por segmento,M5,M6
2.4. Capacidade da indústria naval brasileira para atendimento da demanda nos diferentes cenários,M5,M6
2.5. Simulação das condições necessárias para que a demanda seja atendida pela indústria nacional,M5,M6
2.6. Possibilidades e desafios para a inserção competitiva no mercado internacional,M5,M6
"2.7. Requisitos de infraestrutura, tecnologia e recursos humanos para os diferentes cenários",M5,M6
3. Conclusões do Relatório 1,M6,M6
3.1. Principais conclusões do diagnóstico integrado e dos cenários,M6,M6
"3.2. Incertezas, hipóteses e lacunas de informação que condicionam as conclusões",M6,M6
3.3. Questões para a identificação dos segmentos estratégicos e a formulação das políticas,M6,M6`;

export const OFFICIAL_MONTH_MILESTONES = [
  { month: 1, label: "M1", startDate: "2026-08-20", dueDate: "2026-09-20", startAt: Date.UTC(2026, 7, 20, 0, 0, 0), dueAt: Date.UTC(2026, 8, 20, 23, 59, 59) },
  { month: 2, label: "M2", startDate: "2026-09-21", dueDate: "2026-10-20", startAt: Date.UTC(2026, 8, 21, 0, 0, 0), dueAt: Date.UTC(2026, 9, 20, 23, 59, 59) },
  { month: 3, label: "M3", startDate: "2026-10-21", dueDate: "2026-11-20", startAt: Date.UTC(2026, 9, 21, 0, 0, 0), dueAt: Date.UTC(2026, 10, 20, 23, 59, 59) },
  { month: 4, label: "M4", startDate: "2026-11-21", dueDate: "2026-12-20", startAt: Date.UTC(2026, 10, 21, 0, 0, 0), dueAt: Date.UTC(2026, 11, 20, 23, 59, 59) },
  { month: 5, label: "M5", startDate: "2026-12-21", dueDate: "2027-01-20", startAt: Date.UTC(2026, 11, 21, 0, 0, 0), dueAt: Date.UTC(2027, 0, 20, 23, 59, 59) },
  { month: 6, label: "M6", startDate: "2027-01-21", dueDate: "2027-02-20", startAt: Date.UTC(2027, 0, 21, 0, 0, 0), dueAt: Date.UTC(2027, 1, 20, 23, 59, 59) },
  { month: 7, label: "M7", startDate: "2027-02-21", dueDate: "2027-03-20", startAt: Date.UTC(2027, 1, 21, 0, 0, 0), dueAt: Date.UTC(2027, 2, 20, 23, 59, 59) },
] as const;

function getMilestone(month: number) {
  const m = Math.max(1, Math.min(7, month));
  return OFFICIAL_MONTH_MILESTONES[m - 1];
}

// Parse CSV sequence
const lines = rawCsv.split("\n").map(l => l.trim()).filter(l => l.length > 0);
let currentTomeIdx = 0;
let currentChapterNum = 0;
const romanPrefixes = ["I", "II", "III", "IV"];

interface ParsedScheduleRow {
  rawTitle: string;
  cleanTitle: string;
  isChapter: boolean;
  code: string;
  startMonth: number;
  endMonth: number;
}

const itemScheduleMap = new Map<string, { startMonth: number; endMonth: number; title: string }>();
const chapterScheduleMap = new Map<string, { startMonth: number; endMonth: number; title: string }>();

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  let title = "";
  let startMonthStr = "";
  let endMonthStr = "";

  if (line.startsWith('"')) {
    const lastQuoteIdx = line.lastIndexOf('"');
    title = line.substring(1, lastQuoteIdx);
    const remainder = line.substring(lastQuoteIdx + 1);
    const parts = remainder.split(",").filter(p => p.trim());
    startMonthStr = parts[0]?.trim() || "";
    endMonthStr = parts[1]?.trim() || "";
  } else {
    const parts = line.split(",");
    endMonthStr = parts.pop()?.trim() || "";
    startMonthStr = parts.pop()?.trim() || "";
    title = parts.join(",").trim();
  }

  const startMonth = parseInt(startMonthStr.replace(/\D/g, "") || "1", 10);
  const endMonth = parseInt(endMonthStr.replace(/\D/g, "") || "6", 10);

  if (title === "Apresentação") {
    chapterScheduleMap.set("AP", { startMonth, endMonth, title });
    continue;
  }

  const secMatch = title.match(/^(\d+)\.(\d+)\.?\s*(.*)$/);
  const chapMatch = title.match(/^(\d+)\.?\s*(.*)$/);

  if (secMatch) {
    const chap = parseInt(secMatch[1]);
    const sec = parseInt(secMatch[2]);
    const cleanTitle = secMatch[3].trim();
    const code = `${romanPrefixes[currentTomeIdx]}.${chap}.${sec}`;
    itemScheduleMap.set(code, { startMonth, endMonth, title: cleanTitle });
  } else if (chapMatch) {
    const chap = parseInt(chapMatch[1]);
    const cleanTitle = chapMatch[2].trim();
    if (chap === 1 && currentChapterNum > 1) {
      currentTomeIdx++;
    }
    currentChapterNum = chap;
    const code = `${romanPrefixes[currentTomeIdx]}.${chap}`;
    chapterScheduleMap.set(code, { startMonth, endMonth, title: cleanTitle });
  }
}

console.log(`Parsed ${itemScheduleMap.size} item mappings and ${chapterScheduleMap.size} chapter mappings.`);

// Build schedule sections
const scheduleSections = PDF_ANALYTIC_ITEMS.map(item => {
  const section = PDF_ANALYTIC_SECTIONS.find(s => s.code === item.sectionCode);
  
  // Find schedule info by exact code or fallback to chapter schedule
  let sched = itemScheduleMap.get(item.detailCode);
  if (!sched) {
    // try title matching
    for (const [k, v] of itemScheduleMap.entries()) {
      if (k.startsWith(item.sectionCode + ".") && v.title.toLowerCase().includes(item.title.toLowerCase().substring(0, 15))) {
        sched = v;
        break;
      }
    }
  }

  const startMonth = sched?.startMonth ?? (chapterScheduleMap.get(item.sectionCode)?.startMonth ?? 1);
  const endMonth = sched?.endMonth ?? (chapterScheduleMap.get(item.sectionCode)?.endMonth ?? 6);
  const activeMonths = Array.from({ length: Math.max(1, endMonth - startMonth + 1) }, (_, i) => startMonth + i);
  const startMilestone = getMilestone(startMonth);
  const endMilestone = getMilestone(endMonth);

  return {
    detailCode: item.detailCode,
    title: item.title,
    tome: section?.tome ?? "Tomo I",
    chapter: item.sectionCode,
    startMonth,
    endMonth,
    activeMonths,
    startDate: startMilestone.startDate,
    dueDate: endMilestone.dueDate,
    startAt: startMilestone.startAt,
    dueAt: endMilestone.dueAt,
  };
});

// Build schedule chapters
const scheduleChapters: Record<string, any> = {};
for (const section of PDF_ANALYTIC_SECTIONS) {
  const children = scheduleSections.filter(s => s.chapter === section.code);
  const chapSched = chapterScheduleMap.get(section.code);

  let startMonth = chapSched?.startMonth ?? 1;
  let endMonth = chapSched?.endMonth ?? 6;

  if (children.length > 0) {
    // If children exist, chapter start is min of children or explicit chapter start, end is max
    const childMinStart = Math.min(...children.map(c => c.startMonth));
    const childMaxEnd = Math.max(...children.map(c => c.endMonth));
    startMonth = chapSched ? Math.min(chapSched.startMonth, childMinStart) : childMinStart;
    endMonth = chapSched ? Math.max(chapSched.endMonth, childMaxEnd) : childMaxEnd;
  }

  const activeMonths = Array.from({ length: Math.max(1, endMonth - startMonth + 1) }, (_, i) => startMonth + i);
  const startMilestone = getMilestone(startMonth);
  const endMilestone = getMilestone(endMonth);

  scheduleChapters[section.code] = {
    code: section.code,
    title: section.title,
    tome: section.tome,
    startMonth,
    endMonth,
    activeMonths,
    startDate: startMilestone.startDate,
    dueDate: endMilestone.dueDate,
    startAt: startMilestone.startAt,
    dueAt: endMilestone.dueAt,
    childrenCount: children.length,
  };
}

const outputTs = `/**
 * Cronograma Oficial do Estudo (Relatório 1)
 * Fonte: Cronograma_r1_200926 (Revisão Master BNDES - M1 a M7 com vencimento todo dia 20 e início escalonado)
 */

export interface MonthMilestone {
  month: number;
  label: string;
  startDate: string;
  dueDate: string;
  startAt: number;
  dueAt: number;
}

export const OFFICIAL_MONTH_MILESTONES: ReadonlyArray<MonthMilestone> = ${JSON.stringify(OFFICIAL_MONTH_MILESTONES, null, 2)} as const;

export interface ScheduleSectionItem {
  detailCode: string;
  title: string;
  tome: string;
  chapter?: string | null;
  startMonth: number;
  endMonth: number;
  activeMonths: number[];
  startDate: string;
  dueDate: string;
  startAt: number;
  dueAt: number;
  group?: string | null;
}

export interface ScheduleChapterItem {
  code: string;
  title: string;
  tome: string;
  startMonth: number;
  endMonth: number;
  activeMonths: number[];
  startDate: string;
  dueDate: string;
  startAt: number;
  dueAt: number;
  group?: string | null;
  childrenCount?: number;
}

export const OFFICIAL_SCHEDULE_MES3_SECTIONS: ReadonlyArray<ScheduleSectionItem> = ${JSON.stringify(scheduleSections, null, 2)} as const;

export const OFFICIAL_SCHEDULE_MES3_CHAPTERS: Record<string, ScheduleChapterItem> = ${JSON.stringify(scheduleChapters, null, 2)} as const;

export const SCHEDULE_MES3_SECTIONS_BY_CODE = new Map<string, ScheduleSectionItem>(
  OFFICIAL_SCHEDULE_MES3_SECTIONS.map(item => [item.detailCode, item])
);

export function getScheduleForDetailCode(detailCode: string): ScheduleSectionItem | undefined {
  return SCHEDULE_MES3_SECTIONS_BY_CODE.get(detailCode);
}

export function getScheduleForChapterCode(chapterCode: string): ScheduleChapterItem | undefined {
  return OFFICIAL_SCHEDULE_MES3_CHAPTERS[chapterCode];
}
`;

fs.writeFileSync(
  path.resolve("c:/Users/PC/OneDrive/0.Projects/0.Estudo BNDES/App Gestão Estudo BNDES/app gestão bndes v2.0/shared/officialScheduleMes3.ts"),
  outputTs,
  "utf-8"
);

console.log("Successfully generated shared/officialScheduleMes3.ts with exact start and end dates!");
