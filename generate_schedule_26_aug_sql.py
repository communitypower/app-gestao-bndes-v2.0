from pathlib import Path
from datetime import datetime, date
from zoneinfo import ZoneInfo
import json

source_path = Path("/home/ubuntu/estudo-bndes-gestao/docs/source/cronograma-r1-r2-26-agosto-estruturado.json")
output_path = Path("/home/ubuntu/estudo-bndes-gestao/docs/migrations/2026-08-26-cronograma-r1-r2.sql")

months = [
    (date(2026, 8, 21), date(2026, 9, 20)),
    (date(2026, 9, 21), date(2026, 10, 20)),
    (date(2026, 10, 21), date(2026, 11, 20)),
    (date(2026, 11, 21), date(2026, 12, 20)),
    (date(2026, 12, 21), date(2027, 1, 20)),
    (date(2027, 1, 21), date(2027, 2, 20)),
    (date(2027, 2, 21), date(2027, 3, 20)),
    (date(2027, 3, 21), date(2027, 4, 20)),
]
timezone = ZoneInfo("America/Sao_Paulo")

def timestamp_for(day: date, end_of_day: bool) -> int:
    time_value = "23:59:59" if end_of_day else "00:00:00"
    return int(datetime.fromisoformat(f"{day.isoformat()}T{time_value}").replace(tzinfo=timezone).timestamp() * 1000)

items = json.loads(source_path.read_text(encoding="utf-8"))
lines = [
    "-- Cronograma R1/R2 de 26 de agosto de 2026.",
    "-- Atualiza apenas as etapas cujo detailCode existe na matriz extraída; não remove histórico nem vínculos.",
    "START TRANSACTION;",
]

for item in items:
    start_at = timestamp_for(months[item["start_month"] - 1][0], False)
    due_at = timestamp_for(months[item["end_month"] - 1][1], True)
    code = item["detail_code"].replace("'", "''")
    title = item["title"].replace("'", "''")
    display_title = title[:260]
    lines.append(
        f"UPDATE activities SET startAt = {start_at}, dueAt = {due_at}, planningSummary = CASE WHEN COALESCE(planningSummary, '') = '' THEN CONCAT('[Título anterior] ', title) ELSE CONCAT(planningSummary, CHAR(10), '[Título anterior] ', title) END, title = '{display_title}', description = CASE WHEN description = '' THEN '{title}' ELSE description END WHERE detailCode = '{code}';"
    )

lines.extend([
    "UPDATE activities parent JOIN (SELECT parentActivityId, MIN(startAt) AS startAt, MAX(dueAt) AS dueAt FROM activities WHERE parentActivityId IS NOT NULL AND startAt IS NOT NULL GROUP BY parentActivityId) child ON child.parentActivityId = parent.id SET parent.startAt = child.startAt, parent.dueAt = child.dueAt;",
    "COMMIT;",
])

output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Geradas {len(items)} atualizações de etapa em {output_path}")
