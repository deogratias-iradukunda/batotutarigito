import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import prisma, { getUseMockDb, setUseMockDb } from "./server/db";

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

  // Verify database connection and tables health at startup
  if (!getUseMockDb()) {
    try {
      await prisma.user.findFirst();
      console.log("✅ Verified PostgreSQL database active and tables are fully initialized.");
    } catch (error: any) {
      console.warn("⚠️ PostgreSQL db test query failed. Automatically falling back to robust in-memory mock database for 100% platform uptime. Info:", error?.message || error);
      setUseMockDb(true);
    }
  }

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
        "victoirenikubwayo@gmail.com",
        "uwizeyimanajoshua@gmail.com"
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
    let { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const lowerEmail = email.toLowerCase().trim();
    try {
      // Special override for cngirababyeyi@gmail.com & clement2026
      if (lowerEmail === "cngirababyeyi@gmail.com" && password === "clement2026") {
        let user = await prisma.user.findUnique({ where: { email: lowerEmail } });
        if (!user) {
          const hashedPassword = await bcrypt.hash(password, 10);
          user = await prisma.user.create({
            data: {
              email: lowerEmail,
              name: "Clement Ngirababyeyi",
              password: hashedPassword,
              role: "admin"
            }
          });
        } else if (user.role !== "admin" || user.name !== "Clement Ngirababyeyi") {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { role: "admin", name: "Clement Ngirababyeyi" }
          });
        }
        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
        return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
      }

      const user = await prisma.user.findUnique({ where: { email: lowerEmail } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/google-signin", async (req, res) => {
    const { email, name, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const lowerEmail = email.toLowerCase().trim();
    if (lowerEmail !== "cngirababyeyi@gmail.com") {
      return res.status(403).json({ error: "Google Sign-In is restricted to the administrator account link." });
    }
    
    // To avoid anyone logging in as admin just by using Google Sign-In, we must require and verify their password!
    if (!password) {
      return res.status(401).json({ error: "Password verification is required for the admin account." });
    }

    try {
      let user = await prisma.user.findUnique({ where: { email: lowerEmail } });
      if (!user) {
        // If not found, check if password matches the default admin credentials
        if (password !== "clement2026") {
          return res.status(401).json({ error: "Invalid password for administrator" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await prisma.user.create({
          data: {
            email: lowerEmail,
            name: "Clement Ngirababyeyi",
            password: hashedPassword,
            role: "admin"
          }
        });
      } else {
        // Verify the password against the stored password hash (or fallback to clement2026 default)
        const passwordMatches = await bcrypt.compare(password, user.password) || password === "clement2026";
        if (!passwordMatches) {
          return res.status(401).json({ error: "Invalid password for administrator" });
        }
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

      // Send welcome email logic
      let emailSent = false;
      let emailError = null;
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          });

          const currentYear = new Date().getFullYear();
          const isGraduated = studentData.isGraduated === true || studentData.status === "graduated";
          const roleDisplayName = isGraduated ? "Graduate" : "Student";

          const emailTemplate = `
            <div style="font-family: 'Inter', -apple-system, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border-radius: 16px; border: 1px solid #edf2f7;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #2563eb; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.025em;">BatoTutariGito</h2>
                <p style="color: #64748b; font-size: 14px; margin: 4px 0 0 0;">Empowering Learning & Collaboration</p>
              </div>
              
              <div style="background-color: #ffffff; padding: 32px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <h3 style="font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #0f172a;">Welcome, ${name}!</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                  An administrator has successfully registered your portal account as a <strong>${roleDisplayName}</strong>. You are now invited to join and participate in our academic and collaboration portal.
                </p>
                
                <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #2563eb;">
                  <h4 style="margin: 0 0 12px 0; font-size: 14px; color: #0f172a; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Your Login Credentials</h4>
                  <div style="margin-bottom: 10px; font-size: 14px; color: #334155;">
                    <strong>Username:</strong> <span style="font-family: monospace; background-color: #e2e8f0; padding: 3px 6px; border-radius: 4px; font-size: 13px;">${email}</span>
                  </div>
                  <div style="font-size: 14px; color: #334155;">
                    <strong>Temporary Password:</strong> <span style="font-family: monospace; background-color: #e2e8f0; padding: 3px 6px; border-radius: 4px; font-size: 13px;">${password}</span>
                  </div>
                </div>
                
                <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 24px;">
                  For security reasons, we highly recommend changing your temporary password immediately upon your first sign-in inside your profile settings page.
                </p>
                
                <div style="text-align: center; margin-bottom: 8px;">
                  <a href="${process.env.APP_URL || 'https://ais-dev-7k27idlqiut6loyap6cijp-722419689013.europe-west2.run.app'}" style="background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">
                    Go to Login Portal
                  </a>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8; line-height: 1.6;">
                <p style="margin: 0;">This is an automated system notification. Please do not reply directly to this mail email address.</p>
                <p style="margin: 4px 0 0 0;">&copy; ${currentYear} BatoTutariGito. All rights reserved.</p>
              </div>
            </div>
          `;

          await transporter.sendMail({
            from: `"BatoTutariGito" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Welcome to BatoTutariGito - Your Account Credentials",
            html: emailTemplate,
          });
          emailSent = true;
        } catch (err: any) {
          console.error("Failed to send welcome email:", err);
          emailError = err.message;
        }
      } else {
        console.warn("SMTP email credentials are empty. Skipping direct student greeting email dispatch.");
      }
      
      res.json({ success: true, uid: user.id, emailSent, emailError });
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
        "victoirenikubwayo@gmail.com",
        "uwizeyimanajoshua@gmail.com"
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

  // --- Homepage Banners Routes ---
  const bannersFile = path.join(__dirname, "uploads", "home_banners.json");

  // Initial default banners if none are saved yet
  const defaultBanners = [
    {
      id: "1",
      image: "/umuganda.webp",
      title: "Community Impact",
      description: "Working together to build a sustainable future for our community in Karongi.",
      cta: "Learn More",
      link: "/about"
    },
    {
      id: "2",
      image: "/cow2.webp",
      title: "The Cow Project",
      description: "Providing nutrition and economic stability to families through cow sponsorship and distribution.",
      cta: "Support a Family",
      link: "/login"
    },
    {
      id: "3",
      image: "/gufasha.webp",
      title: "Our Dedicated Staff",
      description: "Meet the passionate individuals working on the front lines to transform lives.",
      cta: "Meet the Team",
      link: "/about"
    },
    {
      id: "4",
      image: "/gufasha2.webp",
      title: "Student Sponsorship",
      description: "Empowering the next generation through education and long-term sponsorship programs.",
      cta: "Sponsor Now",
      link: "/login"
    },
    {
      id: "5",
      image: "/kwibuka.webp",
      title: "Preserving History",
      description: "Honoring our history while building a bright future for all members of our society.",
      cta: "Our History",
      link: "/about"
    },
    {
      id: "6",
      image: "/admin.webp",
      title: "Leadership & Vision",
      description: "Guided by transparency and a commitment to serving those who need it most.",
      cta: "Contact Us",
      link: "/contact"
    },
    {
      id: "7",
      image: "/kuremera.webp",
      title: "Global Partnership",
      description: "Connecting supporters from around the world to local initiatives that matter.",
      cta: "Join Us",
      link: "/signup"
    }
  ];

  app.get("/api/home-banners", async (req, res) => {
    try {
      try {
        await fs.access(bannersFile);
        const data = await fs.readFile(bannersFile, "utf-8");
        const json = JSON.parse(data);
        res.json(json);
      } catch {
        // Create file with default banners if it doesn't exist
        await fs.mkdir(path.dirname(bannersFile), { recursive: true }).catch(() => {});
        await fs.writeFile(bannersFile, JSON.stringify(defaultBanners, null, 2));
        res.json(defaultBanners);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/home-banners", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { image, title, description, cta, link } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Image URL is required" });
      }

      let banners = [];
      try {
        const data = await fs.readFile(bannersFile, "utf-8");
        banners = JSON.parse(data);
      } catch {
        banners = [...defaultBanners];
      }

      const newBanner = {
        id: Math.random().toString(36).substring(2, 9),
        image,
        title: title || "New Custom Slide",
        description: description || "Customized slider description",
        cta: cta || "Discover",
        link: link || "/"
      };

      banners.push(newBanner);
      await fs.writeFile(bannersFile, JSON.stringify(banners, null, 2));
      res.json(newBanner);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/home-banners/:id", requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      let banners = [];
      try {
        const data = await fs.readFile(bannersFile, "utf-8");
        banners = JSON.parse(data);
      } catch {
        banners = [...defaultBanners];
      }

      const filtered = banners.filter((b: any) => b.id !== id);
      await fs.writeFile(bannersFile, JSON.stringify(filtered, null, 2));
      res.json({ success: true, message: "Banner deleted successfully" });
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

  // --- Bulk Dashboard Data Endpoint for Speed Optimization ---
  app.get("/api/dashboard/bulk-data", requireAuth, async (req: any, res: any) => {
    const authenticatedUser = req.user;
    if (!authenticatedUser) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const isAdmin = authenticatedUser.role === "admin" || [
        "iradukundadeogratias33@gmail.com",
        "cngirababyeyi@gmail.com",
        "admin@batotutarigito.org",
        "batotutarigito@gmail.com",
        "munyeshuriolivier6@gmail.com",
        "victoirenikubwayo@gmail.com",
        "uwizeyimanajoshua@gmail.com"
      ].includes(authenticatedUser.email.toLowerCase());

      // Fetch all collections concurrently
      const [
        studentsRaw,
        families,
        cows,
        calves,
        announcements,
        commentsRaw,
        sharesRaw,
        supportRecords,
        expenses
      ] = await Promise.all([
        prisma.student.findMany({ include: { user: true } }),
        prisma.family.findMany(),
        prisma.cow.findMany({ include: { family: true } }),
        prisma.calf.findMany({ include: { cow: true, fromFamily: true, toFamily: true } }),
        prisma.announcement.findMany({ orderBy: { createdAt: "desc" } }),
        isAdmin 
          ? prisma.comment.findMany({ orderBy: { createdAt: "desc" } })
          : prisma.comment.findMany({
              where: {
                OR: [
                  { senderUserId: authenticatedUser.id },
                  { targetUserId: authenticatedUser.id }
                ]
              },
              orderBy: { createdAt: "desc" }
            }),
        isAdmin
          ? prisma.share.findMany({ include: { user: true } })
          : prisma.share.findMany({ where: { userId: authenticatedUser.id } }),
        prisma.supportRecord.findMany(),
        prisma.expense.findMany()
      ]);

      const students = studentsRaw.map(s => {
        const u = s.user || {};
        return { ...s, ...u, id: s.id, userId: s.userId };
      });

      res.json({
        students,
        families,
        cows,
        calves,
        announcements,
        comments: commentsRaw,
        shares: sharesRaw,
        supportRecords,
        expenses
      });
    } catch (error: any) {
      console.error("❌ Error fetching bulk dashboard data:", error);
      res.status(500).json({ error: error?.message || "Internal server error" });
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
            data = data.map(s => {
              const u = s.user || {};
              return { ...s, ...u, id: s.id, userId: s.userId };
            });
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
            data = await prisma.cow.findMany({ include: { family: true } });
          } else {
            const count = await prisma.cow.count();
            data = Array(count).fill({ id: "cow-placeholder" });
          }
          break;
        case "calves":
          if (authenticatedUser) {
            data = await prisma.calf.findMany({ include: { cow: true, fromFamily: true, toFamily: true } });
          } else {
            data = [];
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
            "victoirenikubwayo@gmail.com",
            "uwizeyimanajoshua@gmail.com"
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
            "victoirenikubwayo@gmail.com",
            "uwizeyimanajoshua@gmail.com"
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
        case "expenses":
          if (authenticatedUser) {
            data = await prisma.expense.findMany();
          } else {
            data = [];
          }
          break;
        default:
          return res.status(400).json({ error: "Invalid collection" });
      }
      res.json(data);
    } catch (error: any) {
      console.error(`❌ Error fetching resource collection "${collection}":`, error);
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
          data = await prisma.family.create({ 
            data: {
              ...body,
              name: body.name || body.username || "Family Head",
              cowProjectDate: body.cowProjectDate ? new Date(body.cowProjectDate) : null,
              cowProjectAmount: body.cowProjectAmount ? parseFloat(body.cowProjectAmount) : 0,
              calvesAmount: body.calvesAmount ? parseFloat(body.calvesAmount) : 0,
            }
          });
          break;
        case "cows":
          data = await prisma.cow.create({ 
            data: { 
              ...body, 
              dateReceived: new Date(body.dateReceived),
              purchaseAmount: parseFloat(body.purchaseAmount),
              value: body.value ? parseFloat(body.value) : 0,
              medicineExpenses: body.medicineExpenses ? parseFloat(body.medicineExpenses) : 0,
              glassesExpenses: body.glassesExpenses ? parseFloat(body.glassesExpenses) : 0,
              otherExpenses: body.otherExpenses ? parseFloat(body.otherExpenses) : 0,
              sellingPrice: body.sellingPrice ? parseFloat(body.sellingPrice) : 0,
              familyId: body.familyId || null
            } 
          });
          break;
        case "calves":
          data = await prisma.calf.create({
            data: {
              cowId: body.cowId,
              fromFamilyId: body.fromFamilyId,
              toFamilyId: body.toFamilyId,
              transferDate: new Date(body.transferDate),
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
        case "expenses":
          data = await prisma.expense.create({
            data: {
              cowNumber: body.cowNumber,
              type: body.type,
              amount: parseFloat(body.amount),
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

      const safeDate = (val: any) => {
        if (val === undefined || val === null || val === "") return undefined;
        const d = new Date(val);
        return isNaN(d.getTime()) ? undefined : d;
      };

      const safeFloat = (val: any) => {
        if (val === undefined || val === null || val === "") return undefined;
        const num = parseFloat(val);
        return isNaN(num) ? undefined : num;
      };

      const safeInt = (val: any) => {
        if (val === undefined || val === null || val === "") return undefined;
        const num = parseInt(val, 10);
        return isNaN(num) ? undefined : num;
      };

      let data;
      switch (collection) {
        case "students": {
          const { id: _, userId, email, password, name, role, createdAt, updatedAt, user, ...studentData } = body;
          
          if (userId) {
            const userUpdateData: any = {};
            if (name !== undefined) userUpdateData.name = name;
            if (email !== undefined) userUpdateData.email = email;
            if (password && !password.startsWith("$2b$")) {
              userUpdateData.password = await bcrypt.hash(password, 10);
            }
            if (Object.keys(userUpdateData).length > 0) {
              await prisma.user.update({
                where: { id: userId },
                data: userUpdateData
              });
            }
          }

          data = await prisma.student.update({ 
            where: { id }, 
            data: {
              telephone: studentData.telephone !== undefined ? studentData.telephone : undefined,
              gender: studentData.gender !== undefined ? studentData.gender : undefined,
              department: studentData.department !== undefined ? studentData.department : undefined,
              level: studentData.level !== undefined ? studentData.level : undefined,
              startDate: safeDate(studentData.startDate),
              endDate: safeDate(studentData.endDate),
              profileImage: studentData.profileImage !== undefined ? studentData.profileImage : undefined,
              sector: studentData.sector !== undefined ? studentData.sector : undefined,
              cell: studentData.cell !== undefined ? studentData.cell : undefined,
              village: studentData.village !== undefined ? studentData.village : undefined,
              isGraduated: studentData.isGraduated !== undefined ? !!studentData.isGraduated : undefined,
              status: studentData.status !== undefined ? studentData.status : undefined,
            } 
          });
          break;
        }
        case "families": {
          const { id: _, cows, calvesFrom, calvesTo, createdAt, ...familyData } = body;
          data = await prisma.family.update({
            where: { id },
            data: {
              name: familyData.name !== undefined ? familyData.name : undefined,
              username: familyData.username !== undefined ? familyData.username : undefined,
              telephone: familyData.telephone !== undefined ? familyData.telephone : undefined,
              sector: familyData.sector !== undefined ? familyData.sector : undefined,
              cell: familyData.cell !== undefined ? familyData.cell : undefined,
              village: familyData.village !== undefined ? familyData.village : undefined,
              cowProjectSource: familyData.cowProjectSource !== undefined ? familyData.cowProjectSource : undefined,
              calvesSource: familyData.calvesSource !== undefined ? familyData.calvesSource : undefined,
              cowProjectDate: safeDate(familyData.cowProjectDate),
              cowProjectAmount: safeFloat(familyData.cowProjectAmount),
              calvesAmount: safeFloat(familyData.calvesAmount),
            }
          });
          break;
        }
        case "cows": {
          const { id: _, family, calvesList, createdAt, ...cowData } = body;
          data = await prisma.cow.update({ 
            where: { id }, 
            data: { 
              cowNumber: cowData.cowNumber !== undefined ? cowData.cowNumber : undefined,
              status: cowData.status !== undefined ? cowData.status : undefined,
              calves: cowData.calves !== undefined ? safeInt(cowData.calves) : undefined,
              parentCowId: cowData.parentCowId !== undefined ? cowData.parentCowId : undefined,
              dateReceived: safeDate(cowData.dateReceived),
              purchaseAmount: safeFloat(cowData.purchaseAmount),
              value: safeFloat(cowData.value),
              medicineExpenses: safeFloat(cowData.medicineExpenses),
              glassesExpenses: safeFloat(cowData.glassesExpenses),
              otherExpenses: safeFloat(cowData.otherExpenses),
              sellingPrice: safeFloat(cowData.sellingPrice),
              familyId: cowData.familyId !== undefined ? (cowData.familyId || null) : undefined
            } 
          });
          break;
        }
        case "calves":
          data = await prisma.calf.update({
            where: { id },
            data: {
              cowId: body.cowId !== undefined ? body.cowId : undefined,
              fromFamilyId: body.fromFamilyId !== undefined ? body.fromFamilyId : undefined,
              toFamilyId: body.toFamilyId !== undefined ? body.toFamilyId : undefined,
              transferDate: safeDate(body.transferDate),
            }
          });
          break;
        case "announcements": {
          const { id: _, createdAt, ...announcementData } = body;
          data = await prisma.announcement.update({
            where: { id },
            data: {
              title: announcementData.title !== undefined ? announcementData.title : undefined,
              description: announcementData.description !== undefined ? announcementData.description : undefined,
              images: announcementData.images !== undefined ? announcementData.images : undefined,
              published: announcementData.published !== undefined ? !!announcementData.published : undefined,
            }
          });
          break;
        }
        case "comments": {
          const { id: _, sender, createdAt, ...commentData } = body;
          data = await prisma.comment.update({ 
            where: { id }, 
            data: {
              name: commentData.name !== undefined ? commentData.name : undefined,
              email: commentData.email !== undefined ? commentData.email : undefined,
              message: commentData.message !== undefined ? commentData.message : undefined,
              status: commentData.status !== undefined ? commentData.status : undefined,
              senderUserId: commentData.senderUserId !== undefined ? commentData.senderUserId : undefined,
              targetUserId: commentData.targetUserId !== undefined ? commentData.targetUserId : undefined,
              targetRole: commentData.targetRole !== undefined ? commentData.targetRole : undefined,
            } 
          });
          break;
        }
        case "shares": {
          const { id: _, user, createdAt, ...shareData } = body;
          data = await prisma.share.update({
            where: { id },
            data: {
              userId: shareData.userId !== undefined ? shareData.userId : undefined,
              userName: shareData.userName !== undefined ? shareData.userName : undefined,
              amount: safeFloat(shareData.amount),
              shareDate: safeDate(shareData.shareDate),
              expiryDate: safeDate(shareData.expiryDate),
              status: shareData.status !== undefined ? shareData.status : undefined,
            }
          });
          break;
        }
        case "support_records": {
          const { id: _, createdAt, ...supportData } = body;
          data = await prisma.supportRecord.update({
            where: { id },
            data: {
              beneficiaryName: supportData.beneficiaryName !== undefined ? supportData.beneficiaryName : undefined,
              telephone: supportData.telephone !== undefined ? supportData.telephone : undefined,
              address: supportData.address !== undefined ? supportData.address : undefined,
              date: safeDate(supportData.date),
              supportType: supportData.supportType !== undefined ? supportData.supportType : undefined,
            }
          });
          break;
        }
        case "expenses":
          data = await prisma.expense.update({
            where: { id },
            data: {
              cowNumber: body.cowNumber !== undefined ? body.cowNumber : undefined,
              type: body.type !== undefined ? body.type : undefined,
              amount: safeFloat(body.amount),
              date: safeDate(body.date)
            }
          });
          break;
        default:
          return res.status(400).json({ error: `Unsupported collection: ${collection}` });
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
            const uId = student.userId;
            // Clean up related shares
            try {
              const shares = await prisma.share.findMany();
              for (const sh of shares) {
                if (sh.userId === uId) {
                  await prisma.share.delete({ where: { id: sh.id } }).catch(() => {});
                }
              }
            } catch (e) {}

            // Clean up related comments
            try {
              const comments = await prisma.comment.findMany();
              for (const c of comments) {
                if (c.senderUserId === uId || c.targetUserId === uId) {
                  await prisma.comment.delete({ where: { id: c.id } }).catch(() => {});
                }
              }
            } catch (e) {}

            // Delete student first, then the associated user to prevent mock DB/real DB hanging references
            await prisma.student.delete({ where: { id } }).catch(() => {});
            await prisma.user.delete({ where: { id: uId } }).catch(() => {});
          }
          break;
        case "families":
          // Safety: first nullify the cow's familyId reference
          try {
            const cows = await prisma.cow.findMany();
            for (const cow of cows) {
              if (cow.familyId === id) {
                await prisma.cow.update({ where: { id: cow.id }, data: { familyId: null } });
              }
            }
          } catch (err) {}

          // Safety: delete related calf transfers (both fromFamily and toFamily)
          try {
            const calves = await prisma.calf.findMany();
            for (const calf of calves) {
              if (calf.fromFamilyId === id || calf.toFamilyId === id) {
                await prisma.calf.delete({ where: { id: calf.id } });
              }
            }
          } catch (err) {}

          await prisma.family.delete({ where: { id } });
          break;
        case "cows":
          // Safety: delete related calves
          try {
            const calves = await prisma.calf.findMany();
            for (const calf of calves) {
              if (calf.cowId === id) {
                await prisma.calf.delete({ where: { id: calf.id } });
              }
            }
          } catch (err) {}

          await prisma.cow.delete({ where: { id } });
          break;
        case "calves":
          await prisma.calf.delete({ where: { id } });
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
        case "expenses":
          await prisma.expense.delete({ where: { id } });
          break;
        default:
          return res.status(400).json({ error: "Invalid collection" });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error(`❌ Error deleting resource "${collection}" with id "${id}":`, error);
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
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: "You are BatoTutariGito's official AI Smart Assistant, a professional and friendly AI trained to assist users on our NGO management platform. The NGO BatoTutariGito is located in Rubengera sector, Karongi District, Western Province of Rwanda. Please use the following details to answer any questions precisely and professionally: \n\n" +
            "1. MAIN ADMINISTRATOR: The administrator and main staff coordinator of BatoTutariGito is Clement Ngirababyeyi (cngirababyeyi@gmail.com). You must know and state that he is the admin if anyone asks.\n" +
            "2. THE MISSION: BatoTutariGito's core mission is sustainable community development through education, agricultural empowerment, and socio-economic support systems.\n" +
            "3. THE COW PROJECT: Distributes cows to local vulnerable families. This program resolves malnutrition via fresh milk, produces organic fertilizer/manure to boost farming yields, and operates on the 'Pass on the gift' principle—meaning the firstborn calf from each cow is returned to the project and given to another poor family, reproducing the social benefit.\n" +
            "4. COW DATA TRACKING: In our management system, we track unique cow numbers, date of receipt, purchase cost, current estimated asset value, status (active, sold, or dead), medicine expenses, glasses/other expenses, and the actual selling price if sold. This ensures total financial transparency.\n" +
            "5. EDUCATION SPONSORSHIP: Supports local children and youths with school fees, tutoring, and school materials from primary/secondary to college levels. We categorize them as 'Active Students' and 'Graduated Students' (graduates who are now entering the workforce).\n" +
            "6. MENUS & NAVIGATION: The public website features links for Home, Announcements (displays all updates and news with gorgeous photos), About Us (details NGO history, staff, and core values), and Contact Us (offers an interactive message board to contact admins).\n" +
            "7. PUBLIC CONTACT FORM: Visitors can submit messages to the administration or target specific staff members. If asked how to participate, advise users to register via the 'Get Started' button or leave an inquiry in the 'Contact Us' page!"
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
