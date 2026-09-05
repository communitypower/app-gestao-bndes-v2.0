from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

SOURCE = Path("/home/ubuntu/upload/Estrutura-Relatorio_1.docx")
OUTPUT = Path("/home/ubuntu/estrutura-relatorio-extraida")
OUTPUT.mkdir(parents=True, exist_ok=True)

namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
with ZipFile(SOURCE) as archive:
    root = ET.fromstring(archive.read("word/document.xml"))

paragraphs: list[str] = []
for paragraph in root.findall(".//w:p", namespace):
    text = "".join(
        node.text or "" for node in paragraph.findall(".//w:t", namespace)
    ).strip()
    if text:
        paragraphs.append(text)

markers = ["Apresentação", "Tomo I", "Tomo II", "Tomo III", "Tomo IV"]
starts: list[tuple[str, int]] = []
for marker in markers:
    index = next(
        (position for position, text in enumerate(paragraphs) if text == marker),
        -1,
    )
    if index >= 0:
        starts.append((marker, index))

for position, (marker, start) in enumerate(starts):
    end = starts[position + 1][1] if position + 1 < len(starts) else len(paragraphs)
    slug = marker.lower().replace(" ", "_").replace("ç", "c").replace("ã", "a")
    (OUTPUT / f"{slug}.txt").write_text(
        "\n\n".join(paragraphs[start:end]), encoding="utf-8"
    )

(OUTPUT / "completo.txt").write_text("\n\n".join(paragraphs), encoding="utf-8")
print(f"Extraídos {len(paragraphs)} parágrafos para {OUTPUT}")
