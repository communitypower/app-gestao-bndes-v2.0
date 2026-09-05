from __future__ import annotations

import json
from pathlib import Path

AUDIT = Path("/home/ubuntu/portal_attachments_audit.json")
OUT = Path("/home/ubuntu/activity_plan_generated.json")
OUT_TS = Path("/home/ubuntu/activity_plan_generated.ts")

SECTION_BY_PLAN_CODE = {
    "A00": "AP",
    "A01": "I.1",
    "A02": "I.2",
    "A03": "I.3",
    "A04": "I.4",
    "A05": "I.5",
    "A06": "I.6",
    "A07": "I.6",
    "A08": "I.6",
    "A09": "I.6",
    "A10": "I.7",
    "A11": "I.8",
    "A12": "I.8",
    "A13": "I.8",
    "A14": "I.8",
    "B01": "II.1",
    "B02": "II.2",
    "B03": "II.3",
    "B04": "II.4",
    "B05": "II.4",
    "B06": "II.5",
    "B07": "II.6",
    "B08": "II.7",
    "B09": "II.8",
    "B10": "II.9",
    "C01": "III.1",
    "C02": "III.2",
    "C03": "III.3",
    "C04": "III.4",
    "C05": "III.5",
    "C06": "III.6",
    "C07": "III.7",
    "C08": "III.8",
    "C09": "III.9",
    "D01": "IV.1",
    "D02": "IV.2",
}


def main() -> None:
    audit = json.loads(AUDIT.read_text(encoding="utf-8"))
    records = []
    for sort_order, source in enumerate(audit["activities"], start=1):
        code = source["ID"]
        records.append(
            {
                "code": code,
                "sectionCode": SECTION_BY_PLAN_CODE[code],
                "sortOrder": sort_order,
                "tomeSection": source["Tomo / seção"],
                "title": source["Atividade"],
                "summary": source["Descrição pública e técnica"],
                "functionalResponsible": source["Responsável principal"],
                "support": source["Apoio"],
                "portalDeliverable": source["Entrega para o Portal Naval"],
                "dependencies": source["Dependências"],
                "keywords": source["Palavras-chave"],
                "planningStatus": source["Status"],
                "contentType": source["Tipo de conteúdo"],
                "visibility": source["Visibilidade"],
                "acceptanceCriteria": source["Critério de aceite"],
                "sourceBase": source["Fonte-base"],
            }
        )
    OUT.write_text(json.dumps(records, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    OUT_TS.write_text(
        "export const ACTIVITY_PLAN_ITEMS = "
        + json.dumps(records, ensure_ascii=False, indent=2)
        + " as const;\n\n"
        + "export type ActivityPlanItem = (typeof ACTIVITY_PLAN_ITEMS)[number];\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
