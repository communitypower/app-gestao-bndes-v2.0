import { readFileSync } from "node:fs";
import { requireDb } from "/home/ubuntu/estudo-bndes-gestao/server/db.ts";
import { libraryItems } from "/home/ubuntu/estudo-bndes-gestao/drizzle/schema.ts";
import { like } from "/home/ubuntu/estudo-bndes-gestao/node_modules/drizzle-orm/index.js";

const plan = JSON.parse(
  readFileSync("/home/ubuntu/drive-library-import/plan.json", "utf8")
);
const db = await requireDb();
const existing = await db
  .select({ externalUrl: libraryItems.externalUrl })
  .from(libraryItems)
  .where(like(libraryItems.externalUrl, "https://drive.google.com/%"));
const existingUrls = new Set(
  existing.map(item => item.externalUrl).filter(Boolean)
);
const pending = plan.entries.filter(
  entry => !existingUrls.has(entry.externalUrl)
);

const rows = pending.map(entry => ({
  title: entry.title,
  description: entry.description,
  theme: entry.theme,
  sectionId: entry.sectionId,
  itemType: "link",
  externalUrl: entry.externalUrl,
  fileName: entry.fileName,
  mimeType: entry.mimeType,
  fileSize: entry.fileSize,
  uploadedBy: 1,
}));

await db.transaction(async tx => {
  for (let index = 0; index < rows.length; index += 50) {
    await tx.insert(libraryItems).values(rows.slice(index, index + 50));
  }
});

console.log(
  JSON.stringify(
    {
      sourceUniqueFiles: plan.summary.uniqueFileCount,
      existingDriveLinks: existingUrls.size,
      inserted: rows.length,
      totalDriveLinksAfterImport: existingUrls.size + rows.length,
    },
    null,
    2
  )
);
process.exit(0);
