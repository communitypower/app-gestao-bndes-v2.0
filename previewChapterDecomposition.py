from pathlib import Path
import re

source = Path('/home/ubuntu/estudo-bndes-gestao/docs/source/estrutura-relatorio-1-v1-paragrafos.txt')
paragraphs = {}
for line in source.read_text(encoding='utf-8').splitlines():
    identifier, text = line.split('\t', 1)
    paragraphs[int(identifier)] = text.strip()

sections = [
    ('AP', 'Apresentação do Relatório 1', [5]),
    ('I.1', 'Introdução', [9, 10]),
    ('I.2', 'Economia Marítima', [12]),
    ('I.3', 'Transporte Marítimo Mundial', [14]),
    ('I.4', 'Transporte Marítimo no Brasil', [16]),
    ('I.5', 'Transporte Hidroviário Interior', [18]),
    ('I.6', 'Indústria de Óleo e Gás e de Energia Eólica Offshore', [20, 21, 22, 23]),
    ('I.7', 'Construção naval militar', [25]),
    ('I.8', 'Descarbonização na Indústria Marítima', [27, 28, 29, 30]),
    ('II.1', 'Construção Naval Mundial', [34]),
    ('II.2', 'Experiências nacionais de desenvolvimento da construção naval', [36]),
    ('II.3', 'Construção naval e offshore no Brasil', [38]),
    ('II.4', 'Estrutura atual e capacidade dos estaleiros brasileiros', [40, 41, 42, 43, 44]),
    ('II.5', 'Reparo, conversão, desmantelamento e descomissionamento', [46, 47, 48]),
    ('II.6', 'Cadeia produtiva da indústria de construção naval', [50, 51, 52]),
    ('II.7', 'Padrão tecnológico e recursos humanos', [54, 55, 56]),
    ('II.8', 'Produtividade e competitividade', [58, 59, 60, 61]),
    ('II.9', 'Descarbonização: oportunidades e desafios para a indústria naval', [63, 64, 65, 66, 67]),
    ('III.1', 'Fundamentos e tendências', [71, 72, 73, 74, 75, 76]),
    ('III.2', 'Políticas de marinha mercante no mundo', [78, 79, 80, 81]),
    ('III.3', 'Políticas de construção naval no mundo', [83, 84, 85, 86, 87, 88, 89]),
    ('III.4', 'Políticas brasileiras de marinha mercante e construção naval', [91, 92, 93, 94, 95]),
    ('III.5', 'O Fundo da Marinha Mercante', [97, 98, 99, 100, 101, 102]),
    ('III.6', 'Setores críticos da cadeia de suprimentos: siderurgia e materiais e equipamentos navais', [104, 105, 106, 107, 108]),
    ('III.7', 'Ciclos de expansão e queda da indústria naval brasileira: diagnóstico de sucessos e falhas', [110, 111, 112, 113]),
    ('III.8', 'Fatores geopolíticos e ambientais críticos para a reestruturação da indústria naval brasileira', [115, 116, 117]),
    ('III.9', 'Ambiente econômico e institucional da indústria marítima brasileira', [119, 120, 121, 122, 123, 124]),
    ('IV.1', 'Diagnóstico integrado da competitividade da indústria naval brasileira', [128, 129, 130, 131, 132]),
    ('IV.2', 'Cenários para a indústria naval brasileira', [134, 135, 136, 137, 138, 139]),
    ('IV.3', 'Conclusões do Relatório 1', [141, 142, 143, 144]),
]

def split_activity_sentences(text: str):
    protected = text.replace('E&P', 'E§P').replace('nº', 'n§')
    sentences = re.split(r'(?<=[.!?])\s+', protected)
    return [sentence.replace('E§P', 'E&P').replace('n§', 'nº').strip() for sentence in sentences if sentence.strip()]

total = 0
for chapter_number, (code, title, paragraph_ids) in enumerate(sections, start=1):
    sentences = []
    for paragraph_id in paragraph_ids:
        sentences.extend(split_activity_sentences(paragraphs[paragraph_id]))
    total += len(sentences)
    print(f'## {chapter_number}. {title} ({code})')
    for activity_number, sentence in enumerate(sentences, start=1):
        print(f'{chapter_number}.{activity_number}. {sentence}')
    print()
print(f'TOTAL={total}')
