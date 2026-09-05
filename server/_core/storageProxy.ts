import type { Express } from "express";
import fs from "fs";
import path from "path";

export function registerStorageProxy(app: Express) {
  // Local storage proxy endpoint to serve uploaded files in development or local deployments
  app.get("/manus-storage/:key(*)", (req, res) => {
    const key = req.params.key;
    const localDir = path.resolve(process.cwd(), ".storage");
    const filePath = path.resolve(localDir, key);

    // Security check: prevent directory traversal
    if (!filePath.startsWith(localDir)) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }

    res.status(404).json({ error: "Storage proxy file not found", key });
  });
}
