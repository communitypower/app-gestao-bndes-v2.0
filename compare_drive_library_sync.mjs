import { readFileSync, writeFileSync } from "node:fs";

const current = JSON.parse(readFileSync("/home/ubuntu/drive-library-inventory.json", "utf8"));
const previous = JSON.parse(readFileSync("/home/ubuntu/drive-library-import-plan.json", "utf8"));

const driveIdFromUrl = url => url?.match(/\/d\/([^/]+)/)?.[1] ?? null;
const previousById = new Map(
  previous.entries.map(entry => [driveIdFromUrl(entry.externalUrl), entry]).filter(([id]) => id)
);
const previousHashes = new Set(previous.entries.map(entry => entry.sourceHash).filter(Boolean));
const currentById = new Map(current.files.map(file => [file.id, file]));
const currentHashGroups = new Map();
for (const file of current.files) {
  const key = file.md5Checksum ?? `id:${file.id}`;
  currentHashGroups.set(key, [...(currentHashGroups.get(key) ?? []), file]);
}

const addedIds = current.files.filter(file => !previousById.has(file.id));
const removed = [...previousById.entries()]
  .filter(([id]) => !currentById.has(id))
  .map(([, entry]) => entry);
const modified = current.files
  .filter(file => previousById.has(file.id))
  .map(file => ({ file, previous: previousById.get(file.id) }))
  .filter(({ file, previous: entry }) => entry.sourceHash && file.md5Checksum && entry.sourceHash !== file.md5Checksum)
  .map(({ file, previous: entry }) => ({
    id: file.id,
    name: file.name,
    path: file.path,
    previousHash: entry.sourceHash,
    currentHash: file.md5Checksum,
    modifiedTime: file.modifiedTime,
  }));
const newUniqueFiles = [...currentHashGroups.entries()]
  .filter(([hash]) => !previousHashes.has(hash))
  .map(([hash, copies]) => ({
    hash,
    canonical: copies[0],
    copies: copies.length,
  }));

const comparison = {
  generatedAt: new Date().toISOString(),
  previous: {
    uniqueImported: previous.entries.length,
    sourceFileCount: previous.summary.sourceFileCount,
  },
  current: {
    sourceFileCount: current.files.length,
    uniqueByHash: currentHashGroups.size,
  },
  summary: {
    newFileIds: addedIds.length,
    removedFileIds: removed.length,
    modifiedFileIds: modified.length,
    newUniqueFiles: newUniqueFiles.length,
  },
  addedIds: addedIds.map(file => ({ id: file.id, name: file.name, path: file.path, hash: file.md5Checksum, modifiedTime: file.modifiedTime })),
  removed: removed.map(entry => ({ title: entry.title, url: entry.externalUrl, hash: entry.sourceHash })),
  modified,
  newUniqueFiles: newUniqueFiles.map(({ hash, canonical, copies }) => ({
    hash,
    id: canonical.id,
    name: canonical.name,
    path: canonical.path,
    mimeType: canonical.mimeType,
    modifiedTime: canonical.modifiedTime,
    copies,
  })),
};

const outputPath = "/home/ubuntu/drive-library-resync-comparison.json";
writeFileSync(outputPath, `${JSON.stringify(comparison, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, ...comparison.summary }, null, 2));
