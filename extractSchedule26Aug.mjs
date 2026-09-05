import XLSX from "xlsx";
import fs from "node:fs";
import path from "node:path";

const sourcePath = "/home/ubuntu/upload/Cronograma-R1-e-R2-26_agosto.xlsm";
const outputDir = "/home/ubuntu/estudo-bndes-gestao/docs/source";

fs.mkdirSync(outputDir, { recursive: true });

const workbook = XLSX.readFile(sourcePath, { cellDates: true, raw: false });
const result = workbook.SheetNames.map(name => ({
  name,
  rows: XLSX.utils.sheet_to_json(workbook.Sheets[name], {
    header: 1,
    raw: false,
    defval: "",
  }),
}));

fs.writeFileSync(
  path.join(outputDir, "cronograma-r1-r2-26-agosto.json"),
  JSON.stringify(result, null, 2),
  "utf8"
);

for (const sheet of result) {
  const text = sheet.rows
    .map((row, index) => `${String(index + 1).padStart(3, "0")} | ${row.join(" | ")}`)
    .join("\n");
  const safeName = sheet.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  fs.writeFileSync(path.join(outputDir, `cronograma-${safeName}.txt`), text, "utf8");
}

console.log(`Extraídas ${result.length} planilha(s): ${result.map(sheet => sheet.name).join(", ")}`);
