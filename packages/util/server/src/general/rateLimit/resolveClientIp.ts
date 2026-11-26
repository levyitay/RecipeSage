import type { IncomingHttpHeaders } from "http";
import { config } from "../config";

export const resolveClientIp = (req: {
  headers: IncomingHttpHeaders;
  ip?: string;
}): string | null => {
  const header = config.rateLimit.clientIpHeader;
  if (header) {
    const value = req.headers[header];
    const raw = Array.isArray(value) ? value[0] : value;
    if (!raw) return null;
    const first = raw.split(",")[0].trim();
    return first.length > 0 ? first : null;
  }

  return req.ip || null;
};
