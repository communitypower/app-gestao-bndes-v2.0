import type { Request, Response } from "express";
import { processScheduledActivityAlerts } from "./notificationEngine";

export async function activityAlertsHandler(req: Request, res: Response) {
  try {
    const result = await processScheduledActivityAlerts();
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("[ScheduledAlerts] Error processing activity alerts:", error);
    return res.status(500).json({ success: false, error: String(error) });
  }
}
