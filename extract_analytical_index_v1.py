from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

source = Path("/home/ubuntu/upload/pasted_file_53qWfW_Estrutura-Relatorio_1-V1.docx")
output = Path("/home/ubuntu/estudo-bndes-gestao/docs/source/indice-analitico-v1-paragrafos.txt")
namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

with ZipFile(source) as archive:
    root = ET.fromstring(archive.read("word/document.xml"))

paragraphs = []
for paragraph in root.findall(".//w:p", namespace):
    text = "".join(node.text or "" for node in paragraph.findall(".//w:t", namespace)).strip()
    if text:
        paragraphs.append(text)

output.parent.mkdir(parents=True, exist_ok=True)
output.write_text("\n".join(f"{index + 1:04d}\t{text}" for index, text in enumerate(paragraphs)), encoding="utf-8")
print(f"{len(paragraphs)} parágrafos extraídos em {output}")
