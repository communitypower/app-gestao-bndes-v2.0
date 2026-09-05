import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const ROOT_ID = "1Y9JG1HdyMxPuZsbgmLiWSLHb7URjKewc";
const ROOT_NAME = "Biblioteca Estudo BNDES";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const outputPath = "/home/ubuntu/drive-library-inventory.json";

function listChildren(folderId) {
  const params = JSON.stringify({
    q: `'${folderId}' in parents and trashed = false`,
    pageSize: 1000,
    fields:
      "files(id,name,mimeType,size,modifiedTime,createdTime,webViewLink,description,md5Checksum,sha1Checksum,sha256Checksum,shortcutDetails),nextPageToken",
    orderBy: "folder,name",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  const stdout = execFileSync(
    "gws",
    [
      "drive",
      "files",
      "list",
      "--params",
      params,
      "--page-all",
      "--page-limit",
      "100",
    ],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
  );

  return stdout
    .split("\n")
    .filter(line => line.trim().startsWith("{"))
    .flatMap(line => JSON.parse(line).files ?? []);
}

const queue = [{ id: ROOT_ID, path: ROOT_NAME, topLevelFolder: null }];
const visited = new Set();
const folders = [];
const files = [];

while (queue.length) {
  const current = queue.shift();
  if (!current || visited.has(current.id)) continue;
  if (visited.size >= 2000) throw new Error("Limite de 2.000 pastas excedido.");
  visited.add(current.id);

  const children = listChildren(current.id);
  folders.push({
    id: current.id,
    path: current.path,
    topLevelFolder: current.topLevelFolder,
    childCount: children.length,
  });

  for (const item of children) {
    const itemPath = `${current.path}/${item.name}`;
    const topLevelFolder = current.topLevelFolder ?? item.name;
    if (item.mimeType === FOLDER_MIME) {
      queue.push({ id: item.id, path: itemPath, topLevelFolder });
    } else {
      files.push({
        ...item,
        path: itemPath,
        parentPath: current.path,
        topLevelFolder,
      });
    }
  }
}

const mimeCounts = Object.entries(
  files.reduce((counts, file) => {
    counts[file.mimeType] = (counts[file.mimeType] ?? 0) + 1;
    return counts;
  }, {})
)
  .map(([mimeType, count]) => ({ mimeType, count }))
  .sort((a, b) => b.count - a.count || a.mimeType.localeCompare(b.mimeType));

const topLevelCounts = Object.entries(
  files.reduce((counts, file) => {
    counts[file.topLevelFolder] = (counts[file.topLevelFolder] ?? 0) + 1;
    return counts;
  }, {})
)
  .map(([folder, count]) => ({ folder, count }))
  .sort((a, b) => a.folder.localeCompare(b.folder, "pt-BR", { numeric: true }));

const result = {
  rootId: ROOT_ID,
  generatedAt: new Date().toISOString(),
  summary: {
    folderCount: folders.length - 1,
    fileCount: files.length,
    mimeCounts,
    topLevelCounts,
  },
  folders,
  files,
};

writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      outputPath,
      folderCount: result.summary.folderCount,
      fileCount: result.summary.fileCount,
      mimeCounts,
      topLevelCounts,
    },
    null,
    2
  )
);
