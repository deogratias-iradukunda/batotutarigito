import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import prisma from "./server/db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "your-fallback-secret";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for image uploads
const upload = multer({ dest: "uploads/" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- Auth Middlewares ---

  const requireAuth = async (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized: Missing token" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { student: true }
      });

      if (!user) {
        return res.status(401).json({ error: "Unauthorized: User not found" });
      }

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== "admin") {
      const hardcodedAdmins = [
        "iradukundadeogratias33@gmail.com",
        "cngirababyeyi@gmail.com",
        "admin@batotutarigito.org",
        "batotutarigito@gmail.com",
        "munyeshuriolivier6@gmail.com",
        "victoirenikubwayo@gmail.com"
      ];
      if (req.user?.email && hardcodedAdmins.includes(req.user.email.toLowerCase())) {
        return next();
      }
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }
    next();
  };

  // --- Auth Routes ---

  app.get("/api/auth/status", async (req, res) => {
    try {
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      res.json({ adminExists: adminCount > 0 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/setup", async (req, res) => {
    const { email, password, name } = req.body;
    try {
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      if (adminCount > 0) {
        return res.status(403).json({ error: "System already setup" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "admin"
        }
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/change-password", requireAuth, async (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
        return res.status(401).json({ error: "Invalid current password" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name } = req.body;
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "guest"
        }
      });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", requireAuth, (req: any, res) => {
    const user = req.user;
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  });

  // --- Image Upload API ---
  app.post("/api/upload", requireAuth, upload.single("image"), async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "batotutarigito",
      });
      res.json({ url: result.secure_url });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Student Registration (Admin Only) ---
  app.post("/api/register-student", requireAuth, requireAdmin, async (req: any, res) => {
    const { email, password, name, ...studentData } = req.body;
    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "student",
          student: {
            create: {
              ...studentData,
              startDate: studentData.startDate ? new Date(studentData.startDate) : undefined,
              endDate: studentData.endDate ? new Date(studentData.endDate) : undefined,
            }
          }
        }
      });

      // Send welcome email logic (omitted for brevity but should be kept if needed)
      
      res.json({ success: true, uid: user.id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Generic Resource CRUD ---

  // --- Public Admins Route ---
  app.get("/api/resources/admins", async (req, res) => {
    try {
      const hardcodedAdmins = [
        "iradukundadeogratias33@gmail.com",
        "cngirababyeyi@gmail.com",
        "admin@batotutarigito.org",
        "batotutarigito@gmail.com",
        "munyeshuriolivier6@gmail.com",
        "victoirenikubwayo@gmail.com"
      ];
      const dbAdmins = await prisma.user.findMany({
        where: {
          OR: [
            { role: "admin" },
            ...hardcodedAdmins.map(email => ({
              email: { equals: email, mode: "insensitive" as const }
            }))
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });
      res.json(dbAdmins);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Public Comments Creation Route ---
  app.post("/api/resources/comments", async (req, res) => {
    const body = req.body;
    try {
      const data = await prisma.comment.create({ data: body });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
  
  app.get("/api/resources/:collection", async (req: any, res: any) => {
    const { collection } = req.params;
    
    // Check if user is authenticated optionally
    let authenticatedUser: any = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        authenticatedUser = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: { student: true }
        });
      } catch (e) {
        // Safe to ignore, user is unauthenticated
      }
    }

    try {
      let data;
      switch (collection) {
        case "students":
          if (authenticatedUser) {
            data = await prisma.student.findMany({ include: { user: true } });
            data = data.map(s => ({ ...s, ...s.user, id: s.id, userId: s.userId }));
          } else {
            // Unauthenticated guest: return lightweight list with correct length to populate statistics safely
            const count = await prisma.student.count();
            data = Array(count).fill({ id: "student-placeholder" });
          }
          break;
        case "families":
          if (authenticatedUser) {
            data = await prisma.family.findMany();
          } else {
            const count = await prisma.family.count();
            data = Array(count).fill({ id: "family-placeholder" });
          }
          break;
        case "cows":
          if (authenticatedUser) {
            data = await prisma.cow.findMany();
          } else {
            const count = await prisma.cow.count();
            data = Array(count).fill({ id: "cow-placeholder" });
          }
          break;
        case "announcements":
          // Fully public resource
          data = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
          break;
        case "comments":
          if (!authenticatedUser) {
            return res.status(401).json({ error: "Unauthorized" });
          }
          // Admins can see all, students see comments for them or sent by them
          const isAdmin = authenticatedUser.role === "admin" || [
            "iradukundadeogratias33@gmail.com",
            "cngirababyeyi@gmail.com",
            "admin@batotutarigito.org",
            "batotutarigito@gmail.com",
            "munyeshuriolivier6@gmail.com",
            "victoirenikubwayo@gmail.com"
          ].includes(authenticatedUser.email.toLowerCase());

          if (isAdmin) {
            data = await prisma.comment.findMany({ orderBy: { createdAt: "desc" } });
          } else {
            data = await prisma.comment.findMany({
              where: {
                OR: [
                  { senderUserId: authenticatedUser.id },
                  { targetUserId: authenticatedUser.id }
                ]
              },
              orderBy: { createdAt: "desc" }
            });
          }
          break;
        case "shares":
          if (!authenticatedUser) {
            return res.status(401).json({ error: "Unauthorized" });
          }
          const isShareAdmin = authenticatedUser.role === "admin" || [
            "iradukundadeogratias33@gmail.com",
            "cngirababyeyi@gmail.com",
            "admin@batotutarigito.org",
            "batotutarigito@gmail.com",
            "munyeshuriolivier6@gmail.com",
            "victoirenikubwayo@gmail.com"
          ].includes(authenticatedUser.email.toLowerCase());

          if (isShareAdmin) {
             data = await prisma.share.findMany({ include: { user: true } });
          } else {
             data = await prisma.share.findMany({ where: { userId: authenticatedUser.id } });
          }
          break;
        case "support_records":
          if (authenticatedUser) {
            data = await prisma.supportRecord.findMany();
          } else {
            data = [];
          }
          break;
        default:
          return res.status(400).json({ error: "Invalid collection" });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/resources/:collection", requireAuth, requireAdmin, async (req, res) => {
    const { collection } = req.params;
    const body = req.body;
    try {
      let data;
      switch (collection) {
        case "families":
          data = await prisma.family.create({ data: body });
          break;
        case "cows":
          data = await prisma.cow.create({ 
            data: { 
              ...body, 
              dateReceived: new Date(body.dateReceived),
              purchaseAmount: parseFloat(body.purchaseAmount),
              value: body.value ? parseFloat(body.value) : undefined
            } 
          });
          break;
        case "announcements":
          data = await prisma.announcement.create({ data: body });
          break;
        case "comments":
          data = await prisma.comment.create({ data: body });
          break;
        case "shares":
          data = await prisma.share.create({ 
            data: { 
              ...body,
              shareDate: new Date(body.shareDate),
              expiryDate: new Date(body.expiryDate),
              amount: parseFloat(body.amount)
            } 
          });
          break;
        case "support_records":
          data = await prisma.supportRecord.create({ 
            data: { 
              ...body, 
              date: new Date(body.date) 
            } 
          });
          break;
        default:
          return res.status(400).json({ error: "Invalid collection" });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/resources/:collection/:id", requireAuth, async (req: any, res) => {
    const { collection, id } = req.params;
    const body = req.body;
    try {
      // Permission check
      if (req.user.role !== "admin") {
         // Students can only update their own profile? (Not supported in this generic patch yet)
         // For now, only admin
         return res.status(403).json({ error: "Forbidden" });
      }

      let data;
      switch (collection) {
        case "students":
          // Need to handle user part separately if included?
          const { user, ...studentData } = body;
          data = await prisma.student.update({ 
            where: { id }, 
            data: {
              ...studentData,
              startDate: studentData.startDate ? new Date(studentData.startDate) : undefined,
              endDate: studentData.endDate ? new Date(studentData.endDate) : undefined,
            } 
          });
          break;
        case "cows":
          data = await prisma.cow.update({ where: { id }, data: { ...body, dateReceived: body.dateReceived ? new Date(body.dateReceived) : undefined } });
          break;
        case "comments":
          data = await prisma.comment.update({ where: { id }, data: body });
          break;
        default:
          // Generic update for others
          data = await (prisma as any)[collection.slice(0,-1)].update({ where: { id }, data: body });
      }
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/resources/:collection/:id", requireAuth, requireAdmin, async (req, res) => {
    const { collection, id } = req.params;
    try {
      switch (collection) {
        case "students":
          const student = await prisma.student.findUnique({ where: { id } });
          if (student) {
            await prisma.user.delete({ where: { id: student.userId } });
          }
          break;
        case "families":
          await prisma.family.delete({ where: { id } });
          break;
        case "cows":
          await prisma.cow.delete({ where: { id } });
          break;
        case "announcements":
          await prisma.announcement.delete({ where: { id } });
          break;
        case "comments":
          await prisma.comment.delete({ where: { id } });
          break;
        case "shares":
          await prisma.share.delete({ where: { id } });
          break;
        case "support_records":
          await prisma.supportRecord.delete({ where: { id } });
          break;
        default:
          return res.status(400).json({ error: "Invalid collection" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Shared APIs ---

  app.post("/api/send-email", async (req, res) => {
    const { to, subject, html } = req.body;
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ error: "Email server not configured" });
    }
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    try {
      await transporter.sendMail({
        from: `"BatoTutariGito" <${process.env.EMAIL_USER}>`,
        to, subject, html,
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/chat", async (req, res) => {
    const { history, message } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "AI service not configured" });
    }
    try {
      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are an AI assistant for BatoTutariGito, a professional NGO management platform."
        },
        history: history.map((msg: any) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        }))
      });
      const result = await chat.sendMessageStream({ message });
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      for await (const chunk of result) {
        res.write(chunk.text);
      }
      res.end();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
