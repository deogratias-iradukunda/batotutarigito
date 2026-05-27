import app from "./server/app.js";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function bootstrap() {
  const PORT = 3000;

  // Mount Vite developer server/middleware in development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("🛠️ Vite dev server middleware mounted.");
  } else {
    // Serve static files from compiled dist folder in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: any, res: any) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("📦 Production static asset serving middleware mounted.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Standing node container server listening at http://localhost:${PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("❌ Fatal error bootstraping standing container server:", error);
});
export default app;
