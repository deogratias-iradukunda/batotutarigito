import app from "../server/app.js";

// Export handler that ensures route paths match Express routes on Vercel
export default function handler(req: any, res: any) {
  if (req.url && !req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  return app(req, res);
}

