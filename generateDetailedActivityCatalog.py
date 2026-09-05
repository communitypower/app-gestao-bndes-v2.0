from pathlib import Path
import re

source = Path('/home/ubuntu/estudo-bndes-gestao/docs/decomposicao-capitulos-v1-preview.md')
target = Path('/home/ubuntu/estudo-bndes-gestao/shared/detailedActivityPlan.ts')
chapter = None
items = []
for line in source.read_text(encoding='utf-8').splitlines():
    heading = re.match(r'^##\s+\d+\.\s+.+\s+\(([^)]+)\)$', line)
    if heading:
        chapter = heading.group(1)
        continue
    activity = re.match(r'^\d+\.(\d+)\.\s+(.+)$', line)
    if activity and chapter:
        position = int(activity.group(1))
        items.append((chapter, position, activity.group(2).strip()))

body = ',\n'.join(
    f'  {{ sectionCode: {code!r}, detailCode: {code + "." + str(position)!r}, detailSortOrder: {position}, title: {title!r} }}'
    for code, position, title in items
)
target.write_text(
    'export const DETAILED_ACTIVITY_ITEMS = [\n' + body + '\n] as const;\n\n'
    'export type DetailedActivityItem = (typeof DETAILED_ACTIVITY_ITEMS)[number];\n',
    encoding='utf-8'
)
print(f'Geradas {len(items)} atividades detalhadas em {target}')
