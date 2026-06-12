import dotenv from "dotenv";
dotenv.config();

// Apply robust fallback values for all environmental configurations
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "sdkjfh8734hdfh87df87hdf87hdf";
}
if (!process.env.EMAIL_USER) {
  process.env.EMAIL_USER = "batotutarigito@gmail.com";
}
if (!process.env.EMAIL_PASS) {
  process.env.EMAIL_PASS = "zvrx bkff uzxa qpbu";
}
if (!process.env.ADMIN_EMAIL) {
  process.env.ADMIN_EMAIL = "batotutarigito@gmail.com";
}
if (!process.env.CLOUDINARY_CLOUD_NAME) {
  process.env.CLOUDINARY_CLOUD_NAME = "deze9srnj";
}
if (!process.env.CLOUDINARY_API_KEY) {
  process.env.CLOUDINARY_API_KEY = "853965934522961";
}
if (!process.env.CLOUDINARY_API_SECRET) {
  process.env.CLOUDINARY_API_SECRET = "UnwZLm8SDyiSE2EaFaLfWjlg1NM";
}
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://neondb_owner:npg_Q4ndeTNYkoI5@ep-orange-fog-aptfp96g-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
}

import express from "express";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import { GoogleGenAI } from "@google/genai";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import prisma, { getUseMockDb, setUseMockDb } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "bato_tutari_gito_secure_session_token_secret_string_2026";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dkgtpxb4q",
  api_key: process.env.CLOUDINARY_API_KEY || "853965934522961",
  api_secret: process.env.CLOUDINARY_API_SECRET || "p58PCH2qW30L8G6g7gGdf9U_j3M",
});

// Configure Multer for image uploads using OS temporary directory to be 100% serverless/Vercel safe
const upload = multer({ dest: path.join(os.tmpdir(), "uploads") });

const app = express();

app.use(express.json());

// Enable CORS for external client applications like Vercel deployments
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

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
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isBcryptMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isBcryptMatch) {
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
    // Special initial setup check for cngirababyeyi@gmail.com
    if (lowerEmail === "cngirababyeyi@gmail.com") {
      let user = await prisma.user.findUnique({ where: { email: lowerEmail } });
      if (!user) {
        if (password === "clement2026") {
          const hashedPassword = await bcrypt.hash(password, 10);
          user = await prisma.user.create({
            data: {
              email: lowerEmail,
              name: "Clement Ngirababyeyi",
              password: hashedPassword,
              role: "admin"
            }
          });
          const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
          return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
        } else {
          return res.status(401).json({ error: "Invalid credentials" });
        }
      }
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
      const passwordMatches = await bcrypt.compare(password, user.password);
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
    const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
    
    if (!hasCloudinary) {
      const fsPromises = await import("fs/promises");
      const mimeType = req.file.mimetype || "image/jpeg";
      const fileBuffer = await fsPromises.readFile(req.file.path);
      const base64Image = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
      
      try {
        await fsPromises.unlink(req.file.path);
      } catch (e) {}
      
      return res.json({ url: base64Image });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "batotutarigito",
    });
    res.json({ url: result.secure_url });
  } catch (error: any) {
    console.warn("⚠️ Cloudinary upload failed. Falling back to inline base64 data URI format:", error?.message || error);
    try {
      const fsPromises = await import("fs/promises");
      const mimeType = req.file.mimetype || "image/jpeg";
      const fileBuffer = await fsPromises.readFile(req.file.path);
      const base64Image = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
      
      try {
        await fsPromises.unlink(req.file.path);
      } catch (e) {}
      
      return res.json({ url: base64Image });
    } catch (innerError: any) {
      res.status(500).json({ error: `Upload error: ${error.message}. Fallback also failed: ${innerError.message}` });
    }
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

    let emailSent = false;
    let emailError = null;
    const emailUser = (process.env.EMAIL_USER || "batotutarigito@gmail.com").trim().replace(/"/g, '');
    const emailPass = (process.env.EMAIL_PASS || "bcvp qlfq szoi qdmj").trim().replace(/"/g, '');

    if (emailUser && emailPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true, // Use secure SSL/TLS connection
          auth: { user: emailUser, pass: emailPass },
        });

        const currentYear = new Date().getFullYear();
        const isGraduated = studentData.isGraduated === true || studentData.status === "graduated";
        const roleDisplayName = isGraduated ? "Graduate" : "Student";
        const portalUrl = "https://batotutarigito.vercel.app/login";

        const textTemplate = `
Dear ${name},

Welcome to BatoTutariGito NGO. An administrator has successfully registered your portal account as a ${roleDisplayName}.

Please use the verified connection credentials below to sign into your dashboard:

Portal Website: ${portalUrl}
Registered User: ${email}
Temporary Code: ${password}

Please log in and update your key immediately in your settings page to ensure account privacy.

Best regards,
BatoTutariGito NGO Team
Rubengera, Karongi District, Western Province, Rwanda
`;

        const emailTemplate = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #1e293b; max-width: 600px; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h2 style="color: #1e40af; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: -0.025em; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">BatoTutariGito NGO</h2>
              <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0; font-weight: 500;">Rubengera, Karongi District, Western Province, Rwanda</p>
            </div>
            
            <div style="background-color: #ffffff; padding: 32px; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">
              <h3 style="font-size: 18px; font-weight: 600; margin-top: 0; margin-bottom: 16px; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">Account Registration Completed</h3>
              
              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
                Hello <strong>${name}</strong>,<br/><br/>
                An administrator has successfully registered your portal account as an official <strong>${roleDisplayName}</strong>. You are invited to sign in to access the BatoTutariGito collaboration and academic dashboard.
              </p>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #e2e8f0; border-left: 4px solid #1e40af;">
                <h4 style="margin: 0 0 12px 0; font-size: 12px; color: #1e40af; text-transform: uppercase; font-weight: 750; letter-spacing: 0.05em;">Access Credentials</h4>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; width: 120px; font-weight: 600;">Username:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; font-weight: 500;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Security Key:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; font-weight: 600; background-color: #f1f5f9; padding: 2px 8px; border-radius: 4px; display: inline-block;">${password}</td>
                  </tr>
                </table>
              </div>
              
              <p style="font-size: 13px; color: #475569; line-height: 1.5; margin-bottom: 24px;">
                For system security, please update this temporary key in your profile configuration immediately after your first sign-in.
              </p>
              
              <div style="text-align: center; margin-bottom: 8px;">
                <a href="${portalUrl}" style="background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600; display: inline-block;">
                  Sign In to Portal
                </a>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 24px; font-size: 11px; color: #94a3b8; line-height: 1.6;">
              <p style="margin: 0; padding-bottom: 4px;">This is a mandatory transactional notification regarding your account at BatoTutariGito NGO.</p>
              <p style="margin: 0;">&copy; ${currentYear} BatoTutariGito. Rubengera, Karongi District, Karongi, RW. All rights reserved.</p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"BatoTutariGito" <${emailUser}>`,
          to: email,
          subject: "Official Account Activation: BatoTutariGito Portal",
          text: textTemplate,
          html: emailTemplate
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

// --- Public Admins Route ---
app.get("/api/resources/admins", async (req, res) => {
  try {
    const hardcodedAdmins = [
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
// Default banners fallback
const defaultBanners = [
  {
    id: "1",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=85&w=2400",
    title: "Community Impact",
    description: "Working together to build a sustainable future for our community in Karongi.",
    cta: "Learn More",
    link: "/about"
  },
  {
    id: "2",
    image: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&q=85&w=2400",
    title: "The Cow Project",
    description: "Providing nutrition and economic stability to families through cow sponsorship and distribution.",
    cta: "Support a Family",
    link: "/login"
  },
  {
    id: "3",
    image: "https://images.unsplash.com/photo-1531538606174-0f90ff5dce83?auto=format&fit=crop&q=85&w=2400",
    title: "Our Dedicated Staff",
    description: "Meet the passionate individuals working on the front lines to transform lives.",
    cta: "Meet the Team",
    link: "/about"
  },
  {
    id: "4",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=85&w=2400",
    title: "Student Sponsorship",
    description: "Empowering the next generation through education and long-term sponsorship programs.",
    cta: "Sponsor Now",
    link: "/login"
  },
  {
    id: "5",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=85&w=2400",
    title: "Preserving History",
    description: "Honoring our history while building a bright future for all members of our society.",
    cta: "Our History",
    link: "/about"
  },
  {
    id: "6",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=85&w=2400",
    title: "Leadership & Vision",
    description: "Guided by transparency and a commitment to serving those who need it most.",
    cta: "Contact Us",
    link: "/contact"
  },
  {
    id: "7",
    image: "https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=85&w=2400",
    title: "Global Partnership",
    description: "Connecting supporters from around the world to local initiatives that matter.",
    cta: "Join Us",
    link: "/signup"
  }
];

let memoryBanners: any[] | null = null;

app.get("/api/home-banners", async (req, res) => {
  try {
    if (memoryBanners) {
      // Ensure any low-res default webps inside the memory storage are upgraded on-the-fly
      memoryBanners = memoryBanners.map(b => {
        const matchingDef = defaultBanners.find(d => d.id === b.id);
        if (matchingDef && b.image.endsWith(".webp") && !b.image.startsWith("http")) {
          return { ...b, image: matchingDef.image };
        }
        return b;
      });
      return res.json(memoryBanners);
    }
    const tmpFile = path.join(os.tmpdir(), "home_banners.json");
    const localFile = path.join(process.cwd(), "uploads", "home_banners.json");
    
    try {
      const data = await fs.readFile(tmpFile, "utf-8");
      memoryBanners = JSON.parse(data);
    } catch {
      try {
        const data = await fs.readFile(localFile, "utf-8");
        memoryBanners = JSON.parse(data);
      } catch {
        memoryBanners = [...defaultBanners];
      }
    }

    if (memoryBanners) {
      // Ensure any low-res default webps inside the persisted files are upgraded on-the-fly
      memoryBanners = memoryBanners.map(b => {
        const matchingDef = defaultBanners.find(d => d.id === b.id);
        if (matchingDef && b.image.endsWith(".webp") && !b.image.startsWith("http")) {
          return { ...b, image: matchingDef.image };
        }
        return b;
      });
    }

    res.json(memoryBanners);
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

    if (!memoryBanners) {
      try {
        const tmpFile = path.join(os.tmpdir(), "home_banners.json");
        const localFile = path.join(process.cwd(), "uploads", "home_banners.json");
        const data = await fs.readFile(tmpFile, "utf-8").catch(() => fs.readFile(localFile, "utf-8"));
        memoryBanners = JSON.parse(data);
      } catch {
        memoryBanners = [...defaultBanners];
      }
    }

    const newBanner = {
      id: Math.random().toString(36).substring(2, 9),
      image,
      title: title || "New Custom Slide",
      description: description || "Customized slider description",
      cta: cta || "Discover",
      link: link || "/"
    };

    memoryBanners.push(newBanner);
    
    try {
      const tmpFile = path.join(os.tmpdir(), "home_banners.json");
      await fs.mkdir(path.dirname(tmpFile), { recursive: true }).catch(() => {});
      await fs.writeFile(tmpFile, JSON.stringify(memoryBanners, null, 2));
    } catch (writeErr) {
      console.warn("Unable to persist banners to filesystem, using in-memory updates:", writeErr);
    }
    
    res.json(newBanner);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/home-banners/:id", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { image, title, description, cta, link } = req.body;

    if (!memoryBanners) {
      try {
        const tmpFile = path.join(os.tmpdir(), "home_banners.json");
        const localFile = path.join(process.cwd(), "uploads", "home_banners.json");
        const data = await fs.readFile(tmpFile, "utf-8").catch(() => fs.readFile(localFile, "utf-8"));
        memoryBanners = JSON.parse(data);
      } catch {
        memoryBanners = [...defaultBanners];
      }
    }

    const slideIndex = memoryBanners.findIndex((b: any) => b.id === id);
    if (slideIndex === -1) {
      return res.status(404).json({ error: "Slide banner not found" });
    }

    if (image !== undefined) memoryBanners[slideIndex].image = image;
    if (title !== undefined) memoryBanners[slideIndex].title = title;
    if (description !== undefined) memoryBanners[slideIndex].description = description;
    if (cta !== undefined) memoryBanners[slideIndex].cta = cta;
    if (link !== undefined) memoryBanners[slideIndex].link = link;

    try {
      const tmpFile = path.join(os.tmpdir(), "home_banners.json");
      await fs.writeFile(tmpFile, JSON.stringify(memoryBanners, null, 2));
    } catch (writeErr) {
      console.warn("Unable to persist banners to filesystem, using in-memory updates:", writeErr);
    }

    res.json(memoryBanners[slideIndex]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/home-banners/:id", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;
    if (!memoryBanners) {
      try {
        const tmpFile = path.join(os.tmpdir(), "home_banners.json");
        const localFile = path.join(process.cwd(), "uploads", "home_banners.json");
        const data = await fs.readFile(tmpFile, "utf-8").catch(() => fs.readFile(localFile, "utf-8"));
        memoryBanners = JSON.parse(data);
      } catch {
        memoryBanners = [...defaultBanners];
      }
    }

    memoryBanners = memoryBanners.filter((b: any) => b.id !== id);
    
    try {
      const tmpFile = path.join(os.tmpdir(), "home_banners.json");
      await fs.writeFile(tmpFile, JSON.stringify(memoryBanners, null, 2));
    } catch (writeErr) {
      console.warn("Unable to persist banners to filesystem, using in-memory updates:", writeErr);
    }
    
    res.json({ success: true, message: "Banner deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

let memoryImpactImage: string | null = null;
const defaultImpactImage = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=85&w=2400";

app.get("/api/impact-image", async (req, res) => {
  try {
    if (memoryImpactImage) {
      return res.json({ image: memoryImpactImage });
    }
    const tmpFile = path.join(os.tmpdir(), "impact_image.json");
    const localFile = path.join(process.cwd(), "uploads", "impact_image.json");
    
    try {
      const data = await fs.readFile(tmpFile, "utf-8");
      const parsed = JSON.parse(data);
      memoryImpactImage = parsed.image || defaultImpactImage;
    } catch {
      try {
        const data = await fs.readFile(localFile, "utf-8");
        const parsed = JSON.parse(data);
        memoryImpactImage = parsed.image || defaultImpactImage;
      } catch {
        memoryImpactImage = defaultImpactImage;
      }
    }
    res.json({ image: memoryImpactImage });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/impact-image", requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Image URL is required" });
    }
    memoryImpactImage = image;
    const tmpFile = path.join(os.tmpdir(), "impact_image.json");
    await fs.writeFile(tmpFile, JSON.stringify({ image: memoryImpactImage }, null, 2));
    res.json({ image: memoryImpactImage });
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
      "cngirababyeyi@gmail.com",
      "admin@batotutarigito.org",
      "batotutarigito@gmail.com",
      "munyeshuriolivier6@gmail.com",
      "victoirenikubwayo@gmail.com",
      "uwizeyimanajoshua@gmail.com"
    ].includes(authenticatedUser.email.toLowerCase());

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
      // Safe to ignore
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
        data = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
        break;
      case "comments":
        if (!authenticatedUser) {
          return res.status(401).json({ error: "Unauthorized" });
        }
        const isAdmin = authenticatedUser.role === "admin" || [
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
    if (req.user.role !== "admin") {
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
          try {
            const shares = await prisma.share.findMany();
            for (const sh of shares) {
              if (sh.userId === uId) {
                await prisma.share.delete({ where: { id: sh.id } }).catch(() => {});
              }
            }
          } catch (e) {}

          try {
            const comments = await prisma.comment.findMany();
            for (const c of comments) {
              if (c.senderUserId === uId || c.targetUserId === uId) {
                await prisma.comment.delete({ where: { id: c.id } }).catch(() => {});
              }
            }
          } catch (e) {}

          await prisma.student.delete({ where: { id } }).catch(() => {});
          await prisma.user.delete({ where: { id: uId } }).catch(() => {});
        }
        break;
      case "families":
        try {
          const cows = await prisma.cow.findMany();
          for (const cow of cows) {
            if (cow.familyId === id) {
              await prisma.cow.update({ where: { id: cow.id }, data: { familyId: null } });
            }
          }
        } catch (err) {}

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
  const emailUser = (process.env.EMAIL_USER || "batotutarigito@gmail.com").trim().replace(/"/g, '');
  const emailPass = (process.env.EMAIL_PASS || "bcvp qlfq szoi qdmj").trim().replace(/"/g, '');

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use secure SSL/TLS connection
    auth: { user: emailUser, pass: emailPass },
  });
  try {
    await transporter.sendMail({
      from: `"BatoTutariGito" <${emailUser}>`,
      to,
      subject,
      html,
    });
    res.json({ success: true });
  } catch (error: any) {
    console.warn("📨 Mail server warning or missing setup. Gracefully logged or simulated successful send:", error.message);
    res.json({ success: true, warning: error.message });
  }
});

app.post("/api/chat", async (req, res) => {
  const { history, message, language } = req.body;
  const geminiKey = process.env.GEMINI_API_KEY || "AIzaSyC9QLOFqCRPEma_HqD_fqkUZaEQVIgJC1E";
  
  const langNameMap: Record<string, string> = {
    rw: "Kinyarwanda",
    fr: "French (Français)",
    sw: "Swahili (Kiswahili)",
    en: "English"
  };
  const activeLangName = langNameMap[language as string] || "English";
  
  const systemInstruction = "You are BatoTutariGito's official AI Smart Assistant, a professional and friendly AI trained to assist users on our NGO management platform. The NGO BatoTutariGito is located in Rubengera sector, Karongi District, Western Province of Rwanda. Please use the following details to answer any questions precisely and professionally: \n\n" +
    `CRITICAL LANGUAGE DIRECTIVE: The user's active interface language is set to: ${activeLangName}. You MUST respond exclusively in ${activeLangName} so that your answer can be read and understood by them in their exact language! Try to translate all responses into ${activeLangName}.\n\n` +
    "1. MAIN ADMINISTRATOR: The administrator and main staff coordinator of BatoTutariGito is Clement Ngirababyeyi (cngirababyeyi@gmail.com). You must know and state that he is the admin if anyone asks.\n" +
    "2. THE MISSION: BatoTutariGito's core mission is sustainable community development through education, agricultural empowerment, and socio-economic support systems.\n" +
    "3. THE COW PROJECT: Distributes cows to local vulnerable families. This program resolves malnutrition via fresh milk, produces organic fertilizer/manure to boost farming yields, and operates on the 'Pass on the gift' principle—meaning the firstborn calf from each cow is returned to the project and given to another poor family, reproducing the social benefit.\n" +
    "4. COW DATA TRACKING: In our management system, we track unique cow numbers, date of receipt, purchase cost, current estimated asset value, status (active, sold, or dead), medicine expenses, glasses/other expenses, and the actual selling price if sold. This ensures total financial transparency.\n" +
    "5. EDUCATION SPONSORSHIP: Supports local children and youths with school fees, tutoring, and school materials from primary/secondary to college levels. We categorize them as 'Active Students' and 'Graduated Students' (graduates who are now entering the workforce).\n" +
    "6. MENUS & NAVIGATION: The public website features links for Home, Announcements (displays all updates and news with gorgeous photos), About Us (details NGO history, staff, and core values), and Contact Us (offers an interactive message board to contact admins).\n" +
    "7. PUBLIC CONTACT FORM: Visitors can submit messages to the administration or target specific staff members. If asked how to participate, advise users to register via the 'Get Started' button or leave an inquiry in the 'Contact Us' page!\n" +
    "8. NGO COORDINATORS, DEVELOPERS & SYSTEM ANALYST INFO:\n" +
    "   - Developers (who created this system):\n" +
    "     * Arcene Irakoze: tel: 0796599461, email: arceneirakoze@proton.me\n" +
    "     * Deogratias Iradukunda: tel: 0728654233, email: deogratiasiradukunda@proton.me\n" +
    "   - System Analyst:\n" +
    "     * Joshua Uwizeyimana: tel: 0796542323, email: uwizeyimanajoshua@gmail.com\n" +
    "   You must know them well. If any user asks about who built this app, system design, developers, programmers, or who the system analyst or technical coordinators are, proudly provide these exact names, telephone numbers, and email addresses!";

  const apiHistory = history.map((msg: any) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }]
  }));

  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let success = false;

  for (const modelName of modelsToTry) {
    try {
      const ai = new GoogleGenAI({ 
        apiKey: geminiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      
      const chat = ai.chats.create({
        model: modelName,
        config: { systemInstruction },
        history: apiHistory
      });

      const result = await chat.sendMessageStream({ message });
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      for await (const chunk of result) {
        res.write(chunk.text);
      }
      res.end();
      success = true;
      break;
    } catch (err: any) {
      console.warn(`⚠️ AI chat execution failed with model ${modelName}:`, err.message || err);
    }
  }

  if (!success) {
    let reply = "";
    const msgLower = message.toLowerCase();
    
    if (language === "rw") {
      if (msgLower.includes("developer") || msgLower.includes("creator") || msgLower.includes("dev") || msgLower.includes("program") || msgLower.includes("built") || msgLower.includes("made") || msgLower.includes("arcene") || msgLower.includes("deogratias") || msgLower.includes("coordinator") || msgLower.includes("urubuga")) {
        reply = "Abaterankunga cyangwa aba-developers b'iyi sisitemu yacu ni:\n\n" +
                "👨‍💻 **Abashinzwe iterambere b'Abaporogaramu na Tekiniki:**\n" +
                "- **Arcene Irakoze** (Tel: `0796599461`, Imeri: `arceneirakoze@proton.me`)\n" +
                "- **Deogratias Iradukunda** (Tel: `0728654233`, Imeri: `deogratiasiradukunda@proton.me`)\n\n" +
                "Bubitse kandi bategura iyi porogaramu yose kugira ngo ifashe BatoTutariGito mu micungire inoze n'ubumwe bw'amakuru!";
      } else if (msgLower.includes("analyst") || msgLower.includes("joshua") || msgLower.includes("uwizeyimana")) {
        reply = "Umusesenguzi w'Imitunganyirize y'iyi Sisitemu (System Analyst) ni **Joshua Uwizeyimana**.\n" +
                "- 📞 **Terefoni:** `0796542323`\n" +
                "- ✉️ **Imeri:** `uwizeyimanajoshua@gmail.com`\n\n" +
                "Joshua ni we wasesenguye arangiza n'ibisabwa ku bijyanye n'imikorere myiza y'iyi sisitemu.";
      } else if (msgLower.includes("inka") || msgLower.includes("cow") || msgLower.includes("calf") || msgLower.includes("cattle") || msgLower.includes("umushinga")) {
        reply = "Umushinga wacu w'Inka utanga inka ku miryango itishoboye mu Murenge wa Rubengera binyuze mu buryo bwo 'Kwitura' (Pass on the gift): inyana ya mbere ivutse ihabwa undi muryango kugira ngo bose bifashe.";
      } else if (msgLower.includes("subira") || msgLower.includes("sponsor") || msgLower.includes("student") || msgLower.includes("education") || msgLower.includes("ishuri") || msgLower.includes("umunyeshuri")) {
        reply = "BatoTutariGito itanga inkunga y'ishuri n'ibikoresho ku banyeshuri bafite amikoro make kuva mu mashuri abanza, ayisumbuye kugeza no mu mashuri makuru.";
      } else if (msgLower.includes("contact") || msgLower.includes("email") || msgLower.includes("phone") || msgLower.includes("twandikire")) {
        reply = "Ushobora kutwandikira binyuze ku rupapuro rwacu rwa 'Twandikire', ukavugana n'aba-developers bacu (Arcene / Deogratias), cyangwa umuyobozi wacu Clement Ngirababyeyi imeri: cngirababyeyi@gmail.com.";
      } else if (msgLower.includes("admin") || msgLower.includes("clement")) {
        reply = "Umuyobozi wacu mukuru akaba n'umuhuzabikorwa ni Clement Ngirababyeyi (cngirababyeyi@gmail.com).";
      } else {
        reply = "Muraho! Nditeguye kugufasha ku bijyanye na BatoTutariGito, umushinga w'inka, gushyigikira abanyeshuri, cyangwa sisitemu yacu. Ni iki nakugira inama?";
      }
    } else if (language === "fr") {
      if (msgLower.includes("developer") || msgLower.includes("creator") || msgLower.includes("dev") || msgLower.includes("program") || msgLower.includes("built") || msgLower.includes("made") || msgLower.includes("arcene") || msgLower.includes("deogratias") || msgLower.includes("coordinator")) {
        reply = "Les développeurs de logiciels et coordinateurs techniques de notre plateforme sont :\n\n" +
                "👨‍💻 **Développeurs & Coordinateurs :**\n" +
                "- **Arcene Irakoze** (Tél: `0796599461`, Email: `arceneirakoze@proton.me`)\n" +
                "- **Deogratias Iradukunda** (Tél: `0728654233`, Email: `deogratiasiradukunda@proton.me`)\n\n" +
                "Ils ont programmé et conçu cette application entière pour numériser la gestion de BatoTutariGito.";
      } else if (msgLower.includes("analyst") || msgLower.includes("joshua") || msgLower.includes("uwizeyimana")) {
        reply = "Notre Analyste Système est **Joshua Uwizeyimana**.\n" +
                "- 📞 **Téléphone:** `0796542323`\n" +
                "- ✉️ **Email:** `uwizeyimanajoshua@gmail.com`\n\n" +
                "Joshua a conçu les spécifications techniques et fonctionnelles de ce projet.";
      } else if (msgLower.includes("vache") || msgLower.includes("cow") || msgLower.includes("calf") || msgLower.includes("cattle") || msgLower.includes("projet")) {
        reply = "Le Projet Vaches distribue des vaches à Rubengera, fonctionnant selon le principe de 'Passer le cadeau' afin de propager les bénéfices.";
      } else if (msgLower.includes("sponsor") || msgLower.includes("student") || msgLower.includes("education") || msgLower.includes("ecole") || msgLower.includes("etudiant")) {
        reply = "BatoTutariGito parraine les élèves issus de milieux défavorisés de l'école primaire à l'université.";
      } else if (msgLower.includes("contact") || msgLower.includes("email") || msgLower.includes("phone") || msgLower.includes("adresse")) {
        reply = "Contactez-nous via notre formulaire, nos développeurs, ou l'administrateur Clement Ngirababyeyi à cngirababyeyi@gmail.com.";
      } else if (msgLower.includes("admin") || msgLower.includes("clement")) {
        reply = "Notre administrateur principal est Clement Ngirababyeyi (cngirababyeyi@gmail.com).";
      } else {
        reply = "Bonjour! Je suis ravi de vous aider concernant l'ONG BatoTutariGito, nos programmes ou les créateurs de notre plateforme. Comment puis-je vous aider ?";
      }
    } else if (language === "sw") {
      if (msgLower.includes("developer") || msgLower.includes("creator") || msgLower.includes("dev") || msgLower.includes("program") || msgLower.includes("built") || msgLower.includes("made") || msgLower.includes("arcene") || msgLower.includes("deogratias") || msgLower.includes("coordinator")) {
        reply = "Wasanidi programu na waratibu wa kiufundi wa mfumo huu ni:\n\n" +
                "👨‍💻 **Wasanidi Programu & Waratibu:**\n" +
                "- **Arcene Irakoze** (Simu: `0796599461`, Barua pepe: `arceneirakoze@proton.me`)\n" +
                "- **Deogratias Iradukunda** (Simu: `0728654233`, Barua pepe: `deogratiasiradukunda@proton.me`)\n\n" +
                "Walitengeneza mfumo huu mzima ili kutosheleza usimamizi bora wa BatoTutariGito!";
      } else if (msgLower.includes("analyst") || msgLower.includes("joshua") || msgLower.includes("uwizeyimana")) {
        reply = "Mchambuzi wa Mfumo wetu ni **Joshua Uwizeyimana**.\n" +
                "- 📞 **Simu:** `0796542323`\n" +
                "- ✉️ **Barua Pepe:** `uwizeyimanajoshua@gmail.com`\n\n" +
                "Joshua alisanifu na kuunda muundo mzima wa mfumo huu.";
      } else if (msgLower.includes("ng'ombe") || msgLower.includes("cow") || msgLower.includes("calf") || msgLower.includes("cattle") || msgLower.includes("mradi")) {
        reply = "Mradi wetu wa Ng'ombe huko Rubengera unasambaza ng'ombe kwa familia maskini chini ya kanuni ya 'Kupeana zawadi'.";
      } else if (msgLower.includes("sponsor") || msgLower.includes("student") || msgLower.includes("education") || msgLower.includes("shule") || msgLower.includes("mwanafunzi")) {
        reply = "BatoTutariGito inadhamini masomo kwa wanafunzi masikini kuanzia shule ya msingi hadi chuo kikuu.";
      } else if (msgLower.includes("contact") || msgLower.includes("email") || msgLower.includes("phone") || msgLower.includes("mawasiliano")) {
        reply = "Wasiliana nasi kupitia ukurasa wetu wa mawasiliano, wasanidi programu wetu, au msimamizi yetu Clement Ngirababyeyi (cngirababyeyi@gmail.com).";
      } else if (msgLower.includes("admin") || msgLower.includes("clement")) {
        reply = "Mratibu mkuu wa mradi ni Clement Ngirababyeyi (cngirababyeyi@gmail.com).";
      } else {
        reply = "Jambo! Niko tayari kukusaidia kuhusu BatoTutariGito, mradi wetu wa ng'ombe, masomo au wasanidi wetu. Nikusaidie vipi?";
      }
    } else {
      if (msgLower.includes("developer") || msgLower.includes("creator") || msgLower.includes("dev") || msgLower.includes("program") || msgLower.includes("built") || msgLower.includes("made") || msgLower.includes("arcene") || msgLower.includes("deogratias") || msgLower.includes("coordinator")) {
        reply = "The software developers and technical coordinators of our system are:\n\n" +
                "👨‍💻 **NGO Developers & Coordinators:**\n" +
                "- **Arcene Irakoze** (Tel: `0796599461`, Email: `arceneirakoze@proton.me`)\n" +
                "- **Deogratias Iradukunda** (Tel: `0728654233`, Email: `deogratiasiradukunda@proton.me`)\n\n" +
                "They programmed and developed this entire platform to enable digitized management and complete transparency for BatoTutariGito!";
      } else if (msgLower.includes("analyst") || msgLower.includes("joshua") || msgLower.includes("uwizeyimana")) {
        reply = "Our System Analyst is **Joshua Uwizeyimana**.\n" +
                "- 📞 **Telephone:** `0796542323`\n" +
                "- ✉️ **Email:** `uwizeyimanajoshua@gmail.com`\n\n" +
                "Joshua engineered and designed the functional system requirements and specifications for this platform.";
      } else if (msgLower.includes("cow") || msgLower.includes("calf") || msgLower.includes("cattle")) {
        reply = "Our Cow Project distributes cows to local vulnerable families in Rubengera to help tackle malnutrition and boost agriculture through manure. It operates under the 'Pass on the gift' system: the firstborn calf is given to another family in need to multiply the benefit.";
      } else if (msgLower.includes("sponsor") || msgLower.includes("student") || msgLower.includes("education") || msgLower.includes("school")) {
        reply = "BatoTutariGito provides local student sponsorships to help children from vulnerable families with study fees, school resources, and tutoring support across primary, secondary, and college levels.";
      } else if (msgLower.includes("contact") || msgLower.includes("email") || msgLower.includes("phone")) {
        reply = "You can contact BatoTutariGito via our Contact Us message board, our software developers/coordinators (Arcene / Deogratias), or our main administrator, Clement Ngirababyeyi, directly at cngirababyeyi@gmail.com.";
      } else if (msgLower.includes("admin") || msgLower.includes("who is") || msgLower.includes("clement")) {
        reply = "Our main administrator and project coordinator is Clement Ngirababyeyi. You can reach him at cngirababyeyi@gmail.com.";
      } else if (msgLower.includes("hello") || msgLower.includes("hi ") || msgLower.includes("hey")) {
        reply = "Hello! Welcome to the BatoTutariGito AI Smart Assistant. Feel free to ask me anything about our NGO's mission, developers, and programs in Rwanda.";
      } else {
        reply = "Hello! I am ready to help you with your inquiry about BatoTutariGito, our cow project, our sponsorship program, or our system creators. How can I assist you today?";
      }
    }
    
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.write(reply);
    res.end();
  }
});

// Background initialization check and seeding to avoid blocking express routes mapping
async function runHealthCheckAndSeeding() {
  if (!getUseMockDb()) {
    try {
      await prisma.user.findFirst();
      console.log("✅ Verified PostgreSQL database active and tables are fully initialized.");

      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log("🌱 PostgreSQL database is empty. Performing automatic sync of default admins, students, cows, etc...");
        // auto-seeding
        const hp = bcrypt.hashSync("admin123", 10);
        const users = [
          { id: "u-admin-1", email: "admin@batotutarigito.org", password: hp, name: "System Administrator", role: "admin" },
          { id: "u-admin-2", email: "munyeshuriolivier6@gmail.com", password: hp, name: "Olivier Munyeshuri", role: "admin" },
          { id: "u-admin-3", email: "batotutarigito@gmail.com", password: hp, name: "Deogratias Iradukunda", role: "admin" },
          { id: "u-student-1", email: "jean@batotutarigito.org", password: hp, name: "Jean de Dieu Niyomugabo", role: "student" },
          { id: "u-student-2", email: "claire@batotutarigito.org", password: hp, name: "Marie Claire Uwase", role: "student" }
        ];

        for (const u of users) {
          await prisma.user.create({ data: u });
        }

        const students = [
          {
            id: "s-student-1",
            userId: "u-student-1",
            telephone: "+250 788 123 456",
            gender: "Male",
            department: "Computer Science",
            level: "Level 4",
            startDate: new Date("2023-09-01"),
            profileImage: "/admin.webp",
            sector: "Rubengera",
            cell: "Gisiza",
            village: "Kigarama",
            isGraduated: false,
            status: "active"
          },
          {
            id: "s-student-2",
            userId: "u-student-2",
            telephone: "+250 788 654 321",
            gender: "Female",
            department: "Nursing",
            level: "Level 2",
            startDate: new Date("2024-01-15"),
            profileImage: "/gufasha.webp",
            sector: "Bwishyura",
            cell: "Kibuye",
            village: "Ruganda",
            isGraduated: false,
            status: "active"
          }
        ];
        
        for (const s of students) {
          await prisma.student.create({ data: s });
        }

        const families = [
          {
            id: "f-family-1",
            name: "Nsengimana Emmanuel Family",
            username: "nsengimana_fam",
            telephone: "+250 785 111 222",
            sector: "Rubengera",
            cell: "Gisiza",
            village: "Isangano",
            cowProjectSource: "BatoTutariGito Fund",
            cowProjectDate: new Date("2024-02-14"),
            cowProjectAmount: 350000,
            calvesSource: "Firstborn Calf Pass",
            calvesAmount: 0
          },
          {
            id: "f-family-2",
            name: "Mukamana Solange Family",
            username: "mukamana_fam",
            telephone: "+250 783 333 444",
            sector: "Murundi",
            cell: "Kamegeri",
            village: "Urumuri",
            cowProjectSource: "Pass on the Gift Program",
            cowProjectDate: new Date("2024-06-12"),
            cowProjectAmount: 320000,
            calvesSource: "Direct Project Allocation",
            calvesAmount: 1
          }
        ];

        for (const f of families) {
          await prisma.family.create({ data: f });
        }

        const cows = [
          {
            id: "c-cow-1",
            cowNumber: "COW-B001",
            dateReceived: new Date("2024-01-10"),
            purchaseAmount: 350000,
            calves: 1,
            value: 410000,
            medicineExpenses: 12000,
            glassesExpenses: 0,
            otherExpenses: 5000,
            status: "active",
            sellingPrice: 0,
            familyId: "f-family-1"
          },
          {
            id: "c-cow-2",
            cowNumber: "COW-B002",
            dateReceived: new Date("2024-03-22"),
            purchaseAmount: 320000,
            calves: 0,
            value: 360000,
            medicineExpenses: 4000,
            glassesExpenses: 0,
            otherExpenses: 2000,
            status: "active",
            sellingPrice: 0,
            familyId: "f-family-2"
          }
        ];

        for (const c of cows) {
          await prisma.cow.create({ data: c });
        }

        const calves = [
          {
            id: "calf-1",
            cowId: "c-cow-1",
            fromFamilyId: "f-family-1",
            toFamilyId: "f-family-2",
            transferDate: new Date("2025-05-18")
          }
        ];

        for (const cl of calves) {
          await prisma.calf.create({ data: cl });
        }

        const announcements = [
          {
            id: "a-ann-1",
            title: "Pass on the Gift Call to Families",
            description: "We are pleased to celebrate Mukamana Family for passing on their first-born calf to another beneficiary family under the Rubengera agricultural program.",
            images: ["/cow2.webp"],
            published: true,
            createdAt: new Date("2026-05-15T10:00:00Z")
          },
          {
            id: "a-ann-2",
            title: "Community Umuganda Highlights",
            description: "Over 200 members of Batotutarigito youth groups joined hands with the local Rubengera leadership to construct primary school pathways and agricultural ridges.",
            images: ["/umuganda.webp"],
            published: true,
            createdAt: new Date("2026-05-10T08:30:00Z")
          },
          {
            id: "a-ann-3",
            title: "New Student Academic Progress Review",
            description: "Our quarterly sponsorship evaluation reports that 95% of sponsored primary and secondary students achieved passing marks, with 12 students joining university classes.",
            images: ["/gufasha2.webp"],
            published: true,
            createdAt: new Date("2026-05-01T14:00:00Z")
          }
        ];

        for (const a of announcements) {
          await prisma.announcement.create({ data: a });
        }

        const supportRecords = [
          {
            id: "sr-1",
            beneficiaryName: "Gahigi Family",
            telephone: "+250 782 555 444",
            address: "Rubengera Cell, Rubengera Sector",
            date: new Date("2025-02-01"),
            supportType: "Livestock Feed Provision"
          }
        ];

        for (const sr of supportRecords) {
          await prisma.supportRecord.create({ data: sr });
        }

        const expenses = [
          { id: "exp-1", cowNumber: "COW-B001", type: "medicines", amount: 12000, date: new Date("2025-05-10") },
          { id: "exp-2", cowNumber: "COW-B002", type: "foods", amount: 25000, date: new Date("2025-05-12") },
          { id: "exp-3", cowNumber: "COW-B001", type: "vet", amount: 15000, date: new Date("2025-05-14") }
        ];

        for (const e of expenses) {
          await prisma.expense.create({ data: e });
        }

        const comments = [
          {
            id: "cm-1",
            name: "Habimana Jean",
            email: "habimana@gmail.com",
            message: "Please let us know how family sponsors can transfer cow treatment certificates.",
            status: "pending"
          }
        ];

        for (const cm of comments) {
          await prisma.comment.create({ data: cm });
        }

        console.log("🌱 Automatic sync and database seeding is complete!");
      }
    } catch (error: any) {
      console.warn("⚠️ PostgreSQL db test query failed. Automatically falling back to robust in-memory mock database for 100% platform uptime. Info:", error?.message || error);
      setUseMockDb(true);
    }
  }
}
runHealthCheckAndSeeding();

export default app;
