import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import crypto from "crypto";
import session from "express-session";
import MemoryStore from "memorystore";
import { 
  adminLoginSchema, 
  resellerLoginSchema, 
  resellerRegistrationSchema,
  addCreditsSchema,
  generateKeySchema,
  verifyKeySchema
} from "@shared/schema";

const generateToken = (length: number = 16) => {
  return crypto.randomBytes(length).toString("hex");
};

const generateKey = (customKey?: string) => {
  if (customKey) return customKey;
  
  const parts = [];
  for (let i = 0; i < 4; i++) {
    parts.push(crypto.randomBytes(4).toString("hex").toUpperCase());
  }
  return parts.join("-");
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Set up session middleware
  const SessionStore = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "key-management-system-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 }, // 1 day
      store: new SessionStore({
        checkPeriod: 86400000, // 24 hours
      }),
    })
  );
  
  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.session.userId) {
      return next();
    }
    res.status(401).json({ status: "error", message: "Unauthorized" });
  };
  
  // Middleware to check if user is admin
  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.session.isAdmin) {
      return next();
    }
    res.status(403).json({ status: "error", message: "Forbidden" });
  };
  
  // Admin login
  app.post("/api/admin/login", async (req, res) => {
    try {
      const validatedData = adminLoginSchema.parse(req.body);
      console.log(`Login attempt for admin: ${validatedData.username}`);
      
      const admin = await storage.getAdmin(validatedData.username);
      if (!admin) {
        console.log(`Admin not found: ${validatedData.username}`);
        return res.status(401).json({ status: "error", message: "Invalid credentials" });
      }
      
      const hashedPassword = crypto
        .createHash("sha256")
        .update(validatedData.password)
        .digest("hex");
      
      console.log(`Password check: ${admin.password === hashedPassword ? 'match' : 'mismatch'}`);
      
      if (admin.password !== hashedPassword) {
        return res.status(401).json({ status: "error", message: "Invalid credentials" });
      }
      
      // Set session data
      req.session.userId = admin.id;
      req.session.username = admin.username;
      req.session.isAdmin = true;
      
      res.status(200).json({
        status: "success",
        user: {
          id: admin.id,
          username: admin.username,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ status: "error", message: error.message });
      } else {
        res.status(500).json({ status: "error", message: "Internal server error" });
      }
    }
  });
  
  // Reseller login
  app.post("/api/reseller/login", async (req, res) => {
    try {
      const validatedData = resellerLoginSchema.parse(req.body);
      
      const reseller = await storage.getResellerByUsername(validatedData.username);
      if (!reseller) {
        return res.status(401).json({ status: "error", message: "Invalid credentials" });
      }
      
      const hashedPassword = crypto
        .createHash("sha256")
        .update(validatedData.password)
        .digest("hex");
      
      if (reseller.password !== hashedPassword) {
        return res.status(401).json({ status: "error", message: "Invalid credentials" });
      }
      
      // Set session data
      req.session.userId = reseller.id;
      req.session.username = reseller.username;
      req.session.isAdmin = false;
      
      res.status(200).json({
        status: "success",
        user: {
          id: reseller.id,
          username: reseller.username,
          credits: reseller.credits,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ status: "error", message: error.message });
      } else {
        res.status(500).json({ status: "error", message: "Internal server error" });
      }
    }
  });
  
  // Reseller registration
  app.post("/api/reseller/register", async (req, res) => {
    try {
      const validatedData = resellerRegistrationSchema.parse(req.body);
      
      // Check if username already exists
      const existingReseller = await storage.getResellerByUsername(validatedData.username);
      if (existingReseller) {
        return res.status(400).json({ status: "error", message: "Username already taken" });
      }
      
      // Check if referral token is valid
      const token = await storage.getReferralToken(validatedData.referralToken);
      if (!token) {
        return res.status(400).json({ status: "error", message: "Invalid referral token" });
      }
      
      // Create new reseller
      const newReseller = await storage.createReseller({
        username: validatedData.username,
        email: validatedData.email,
        password: validatedData.password,
      });
      
      // Mark token as used
      await storage.markReferralTokenAsUsed(token.id);
      
      res.status(201).json({
        status: "success",
        message: "Reseller account created successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ status: "error", message: error.message });
      } else {
        res.status(500).json({ status: "error", message: "Internal server error" });
      }
    }
  });
  
  // Logout
  app.post("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ status: "error", message: "Failed to logout" });
      }
      res.status(200).json({ status: "success", message: "Logged out successfully" });
    });
  });
  
  // Get current user
  app.get("/api/me", isAuthenticated, async (req, res) => {
    try {
      if (req.session.isAdmin) {
        const admin = await storage.getAdmin(req.session.username);
        if (!admin) {
          req.session.destroy(() => {});
          return res.status(404).json({ status: "error", message: "User not found" });
        }
        
        return res.status(200).json({
          status: "success",
          user: {
            id: admin.id,
            username: admin.username,
            isAdmin: true,
          },
        });
      } else {
        const reseller = await storage.getResellerByUsername(req.session.username);
        if (!reseller) {
          req.session.destroy(() => {});
          return res.status(404).json({ status: "error", message: "User not found" });
        }
        
        return res.status(200).json({
          status: "success",
          user: {
            id: reseller.id,
            username: reseller.username,
            email: reseller.email,
            credits: reseller.credits,
            keysGenerated: reseller.keysGenerated,
            isAdmin: false,
          },
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ status: "error", message: error.message });
      } else {
        res.status(500).json({ status: "error", message: "Internal server error" });
      }
    }
  });
  
  // ADMIN ROUTES
  
  // Generate referral tokens
  app.post("/api/admin/generate-tokens", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { count = 1 } = req.body;
      
      const tokens = [];
      for (let i = 0; i < count; i++) {
        const token = generateToken();
        const newToken = await storage.createReferralToken({ token });
        tokens.push(newToken);
      }
      
      res.status(201).json({
        status: "success",
        tokens: tokens.map(t => ({ token: t.token, used: t.used })),
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ status: "error", message: error.message });
      } else {
        res.status(500).json({ status: "error", message: "Internal server error" });
      }
    }
  });
  
  // Get all tokens
  app.get("/api/admin/tokens", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const tokens = await storage.getAllReferralTokens();
      
      res.status(200).json({
        status: "success",
        tokens: tokens.map(t => ({ 
          id: t.id, 
          token: t.token, 
          used: t.used, 
          createdAt: t.createdAt 
        })),
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ status: "error", message: error.message });
      } else {
        res.status(500).json({ status: "error", message: "Internal server error" });
      }
    }
  });
  
  // Get all resellers
  app.get("/api/admin/resellers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const resellers = await storage.getAllResellers();
      
      res.status(200).json({
        status: "success",
        resellers: resellers.map(r => ({
          id: r.id,
          username: r.username,
          email: r.email,
          credits: r.credits,
          keysGenerated: r.keysGenerated,
          createdAt: r.createdAt,
        })),
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ status: "error", message: error.message });
      } else {
        res.status(500).json({ status: "error", message: "Internal server error" });
      }
    }
  });
  
  // Add credits to reseller
  app.post("/api/admin/add-credits", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = addCreditsSchema.parse(req.body);
      
      const reseller = await storage.getReseller(validatedData.resellerId);
      if (!reseller) {
        return res.status(404).json({ status: "error", message: "Reseller not found" });
      }
      
      const updatedReseller = await storage.updateResellerCredits(
        reseller.id, 
        reseller.credits + validatedData.amount
      );
      
      res.status(200).json({
        status: "success",
        reseller: {
          id: updatedReseller.id,
          username: updatedReseller.username,
          email: updatedReseller.email,
          credits: updatedReseller.credits,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ status: "error", message: error.message });
      } else {
        res.status(500).json({ status: "error", message: "Internal server error" });
      }
    }
  });
  
  // Delete reseller
  app.delete("/api/admin/resellers/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const resellerId = parseInt(req.params.id);
      
      const reseller = await storage.getReseller(resellerId);
      if (!reseller) {
        return res.status(404).json({ status: "error", message: "Reseller not found" });
      }
      
      await storage.deleteReseller(resellerId);
      
      res.status(200).json({
        status: "success",
        message: "Reseller deleted successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ status: "error", message: error.message });
      } else {
        res.status(500).json({ status: "error", message: "Internal server error" });
      }
    }
  });
  
  // Get stats for admin dashboard
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const resellers = await storage.getAllResellers();
      
      let totalKeys = 0;
      let totalCredits = 0;
      
      resellers.forEach(reseller => {
        totalKeys += reseller.keysGenerated;
        totalCredits += reseller.credits;
      });
      
      res.status(200).json({
        status: "success",
        stats: {
          totalResellers: resellers.length,
          totalKeys,
          totalCredits,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ status: "error", message: error.message });
      } else {
        res.status(500).json({ status: "error", message: "Internal server error" });
      }
    }
  });
  
  // RESELLER ROUTES
  
  // Generate a new key
  app.post("/api/reseller/generate-key", isAuthenticated, async (req, res) => {
    try {
      if (req.session.isAdmin) {
        return res.status(403).json({ status: "error", message: "Admin cannot generate keys" });
      }
      
      const validatedData = generateKeySchema.parse(req.body);
      
      const reseller = await storage.getReseller(req.session.userId);
      if (!reseller) {
        return res.status(404).json({ status: "error", message: "Reseller not found" });
      }
      
      // Check if reseller has enough credits
      if (reseller.credits < 1) {
        return res.status(400).json({ status: "error", message: "Insufficient credits" });
      }
      
      // Check if custom key already exists
      if (validatedData.customKey) {
        const existingKey = await storage.getKeyByValue(validatedData.customKey);
        if (existingKey) {
          return res.status(400).json({ status: "error", message: "Custom key already exists" });
        }
      }
      
      // Generate key
      const keyValue = generateKey(validatedData.customKey);
      
      // Create key
      const newKey = await storage.createKey({
        key: keyValue,
        game: validatedData.game,
        deviceLimit: validatedData.deviceLimit,
        expiryDate: new Date(validatedData.expiryDate),
        resellerId: reseller.id,
      });
      
      // Deduct credit
      await storage.updateResellerCredits(reseller.id, reseller.credits - 1);
      
      res.status(201).json({
        status: "success",
        key: {
          id: newKey.id,
          key: newKey.key,
          game: newKey.game,
          deviceLimit: newKey.deviceLimit,
          devicesUsed: newKey.devicesUsed,
          expiryDate: newKey.expiryDate,
          status: newKey.status,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ status: "error", message: error.message });
      } else {
        res.status(500).json({ status: "error", message: "Internal server error" });
      }
    }
  });
  
  // Get all keys for a reseller
  app.get("/api/reseller/keys", isAuthenticated, async (req, res) => {
    try {
      if (req.session.isAdmin) {
        return res.status(403).json({ status: "error", message: "Admin cannot access reseller keys" });
      }
      
      const keys = await storage.getKeysByResellerId(req.session.userId);
      
      // Check for expired keys and update their status
      const now = new Date();
      for (const key of keys) {
        if (key.status !== "expired" && new Date(key.expiryDate) < now) {
          await storage.updateKeyStatus(key.id, "expired");
          key.status = "expired";
        }
      }
      
      res.status(200).json({
        status: "success",
        keys: keys.map(k => ({
          id: k.id,
          key: k.key,
          game: k.game,
          deviceLimit: k.deviceLimit,
          devicesUsed: k.devicesUsed,
          expiryDate: k.expiryDate,
          status: k.status,
        })),
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ status: "error", message: error.message });
      } else {
        res.status(500).json({ status: "error", message: "Internal server error" });
      }
    }
  });
  
  // Delete a key
  app.delete("/api/reseller/keys/:id", isAuthenticated, async (req, res) => {
    try {
      if (req.session.isAdmin) {
        return res.status(403).json({ status: "error", message: "Admin cannot delete reseller keys" });
      }
      
      const keyId = parseInt(req.params.id);
      
      const key = await storage.getKey(keyId);
      if (!key) {
        return res.status(404).json({ status: "error", message: "Key not found" });
      }
      
      // Ensure reseller owns the key
      if (key.resellerId !== req.session.userId) {
        return res.status(403).json({ status: "error", message: "You don't own this key" });
      }
      
      await storage.deleteKey(keyId);
      
      res.status(200).json({
        status: "success",
        message: "Key deleted successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ status: "error", message: error.message });
      } else {
        res.status(500).json({ status: "error", message: "Internal server error" });
      }
    }
  });
  
  // Get reseller stats
  app.get("/api/reseller/stats", isAuthenticated, async (req, res) => {
    try {
      if (req.session.isAdmin) {
        return res.status(403).json({ status: "error", message: "Admin cannot access reseller stats" });
      }
      
      const reseller = await storage.getReseller(req.session.userId);
      if (!reseller) {
        return res.status(404).json({ status: "error", message: "Reseller not found" });
      }
      
      const keys = await storage.getKeysByResellerId(reseller.id);
      
      // Count active and expired keys
      let activeKeys = 0;
      let expiredKeys = 0;
      
      const now = new Date();
      for (const key of keys) {
        if (new Date(key.expiryDate) < now) {
          expiredKeys++;
        } else {
          activeKeys++;
        }
      }
      
      res.status(200).json({
        status: "success",
        stats: {
          totalKeys: keys.length,
          activeKeys,
          expiredKeys,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ status: "error", message: error.message });
      } else {
        res.status(500).json({ status: "error", message: "Internal server error" });
      }
    }
  });
  
  // PUBLIC API ROUTES
  
  // Verify key (POST method)
  app.post("/api/verify", async (req, res) => {
    try {
      const validatedData = verifyKeySchema.parse(req.body);
      
      const key = await storage.getKeyByValue(validatedData.key);
      if (!key) {
        return res.status(404).json({ status: "error", message: "Invalid key" });
      }
      
      // Check if key is expired
      if (new Date(key.expiryDate) < new Date()) {
        return res.status(400).json({ status: "error", message: "Key has expired" });
      }
      
      // Check if device is already registered
      let device = await storage.getDeviceByHwid(key.id, validatedData.hwid);
      
      // If device is not registered and limit is reached, return error
      if (!device && key.devicesUsed >= key.deviceLimit) {
        return res.status(400).json({ status: "error", message: "Device limit reached" });
      }
      
      // Register device if not already registered
      if (!device) {
        device = await storage.createDevice({
          keyId: key.id,
          hwid: validatedData.hwid,
        });
        
        // Update devices used count
        await storage.updateKeyDevicesUsed(key.id, key.devicesUsed + 1);
      }
      
      res.status(200).json({
        status: "success",
        message: "Key verified successfully",
        data: {
          game: key.game,
          deviceLimit: key.deviceLimit,
          devicesUsed: key.devicesUsed + (!device ? 1 : 0),
          expiryDate: key.expiryDate,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ status: "error", message: error.message });
      } else {
        res.status(500).json({ status: "error", message: "Internal server error" });
      }
    }
  });
  
  // Check key status (GET method)
  app.get("/api/key-status/:key", async (req, res) => {
    try {
      const keyValue = req.params.key;
      
      const key = await storage.getKeyByValue(keyValue);
      if (!key) {
        return res.status(200).json({
          status: "success",
          data: {
            isValid: false,
            message: "Invalid key",
          },
        });
      }
      
      // Check if key is expired
      const isExpired = new Date(key.expiryDate) < new Date();
      
      res.status(200).json({
        status: "success",
        data: {
          isValid: !isExpired && key.devicesUsed < key.deviceLimit,
          game: key.game,
          deviceLimit: key.deviceLimit,
          devicesUsed: key.devicesUsed,
          expiryDate: key.expiryDate,
          status: isExpired ? "expired" : (key.devicesUsed >= key.deviceLimit ? "full" : "active")
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ status: "error", message: error.message });
      } else {
        res.status(500).json({ status: "error", message: "Internal server error" });
      }
    }
  });

  return httpServer;
}
