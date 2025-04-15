import { 
  Admin, 
  InsertAdmin, 
  Reseller, 
  InsertReseller, 
  ReferralToken, 
  InsertReferralToken,
  Key,
  InsertKey,
  Device,
  InsertDevice 
} from "@shared/schema";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import crypto from "crypto";

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

// Storage interface
export interface IStorage {
  // Admin operations
  getAdmin(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  
  // Referral token operations
  createReferralToken(token: InsertReferralToken): Promise<ReferralToken>;
  getReferralToken(token: string): Promise<ReferralToken | undefined>;
  markReferralTokenAsUsed(id: number): Promise<ReferralToken>;
  getAllReferralTokens(): Promise<ReferralToken[]>;
  
  // Reseller operations
  createReseller(reseller: InsertReseller): Promise<Reseller>;
  getReseller(id: number): Promise<Reseller | undefined>;
  getResellerByUsername(username: string): Promise<Reseller | undefined>;
  getAllResellers(): Promise<Reseller[]>;
  updateResellerCredits(id: number, credits: number): Promise<Reseller>;
  deleteReseller(id: number): Promise<void>;
  
  // Key operations
  createKey(key: InsertKey): Promise<Key>;
  getKey(id: number): Promise<Key | undefined>;
  getKeyByValue(key: string): Promise<Key | undefined>;
  getKeysByResellerId(resellerId: number): Promise<Key[]>;
  updateKeyDevicesUsed(id: number, devicesUsed: number): Promise<Key>;
  updateKeyStatus(id: number, status: string): Promise<Key>;
  deleteKey(id: number): Promise<void>;
  
  // Device operations
  createDevice(device: InsertDevice): Promise<Device>;
  getDevicesByKeyId(keyId: number): Promise<Device[]>;
  getDeviceByHwid(keyId: number, hwid: string): Promise<Device | undefined>;
}

// File paths
const DATA_DIR = path.resolve(process.cwd(), "data");
const ADMINS_FILE = path.join(DATA_DIR, "admin.json");
const TOKENS_FILE = path.join(DATA_DIR, "token.json");
const RESELLERS_FILE = path.join(DATA_DIR, "resellers.json");
const KEYS_DIR = path.join(DATA_DIR, "keys");

// Ensure data directory exists
const ensureDataDir = async () => {
  if (!fs.existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(KEYS_DIR)) {
    await mkdir(KEYS_DIR, { recursive: true });
  }
};

// Memory Storage Implementation
export class MemStorage implements IStorage {
  private admins: Map<string, Admin>;
  private referralTokens: Map<number, ReferralToken>;
  private resellers: Map<number, Reseller>;
  private keys: Map<number, Key>;
  private devices: Map<number, Device>;
  
  private adminId: number;
  private tokenId: number;
  private resellerId: number;
  private keyId: number;
  private deviceId: number;
  
  constructor() {
    this.admins = new Map();
    this.referralTokens = new Map();
    this.resellers = new Map();
    this.keys = new Map();
    this.devices = new Map();
    
    this.adminId = 1;
    this.tokenId = 1;
    this.resellerId = 1;
    this.keyId = 1;
    this.deviceId = 1;
    
    // Initialize with default admin
    this.initializeStorage();
  }
  
  private async initializeStorage() {
    try {
      await ensureDataDir();
      
      // Initialize admin.json if it doesn't exist
      if (!fs.existsSync(ADMINS_FILE)) {
        const defaultAdmin: Admin = {
          id: this.adminId++,
          username: "admin",
          password: this.hashPassword("admin123")
        };
        this.admins.set(defaultAdmin.username, defaultAdmin);
        await writeFile(ADMINS_FILE, JSON.stringify([defaultAdmin], null, 2));
      } else {
        const adminsData = await readFile(ADMINS_FILE, "utf-8");
        const admins: Admin[] = JSON.parse(adminsData);
        for (const admin of admins) {
          this.admins.set(admin.username, admin);
          if (admin.id >= this.adminId) {
            this.adminId = admin.id + 1;
          }
        }
      }
      
      // Initialize token.json if it doesn't exist
      if (!fs.existsSync(TOKENS_FILE)) {
        await writeFile(TOKENS_FILE, JSON.stringify([], null, 2));
      } else {
        const tokensData = await readFile(TOKENS_FILE, "utf-8");
        const tokens: ReferralToken[] = JSON.parse(tokensData);
        for (const token of tokens) {
          this.referralTokens.set(token.id, token);
          if (token.id >= this.tokenId) {
            this.tokenId = token.id + 1;
          }
        }
      }
      
      // Initialize resellers.json if it doesn't exist
      if (!fs.existsSync(RESELLERS_FILE)) {
        await writeFile(RESELLERS_FILE, JSON.stringify([], null, 2));
      } else {
        const resellersData = await readFile(RESELLERS_FILE, "utf-8");
        const resellers: Reseller[] = JSON.parse(resellersData);
        for (const reseller of resellers) {
          this.resellers.set(reseller.id, reseller);
          if (reseller.id >= this.resellerId) {
            this.resellerId = reseller.id + 1;
          }
          
          // Load keys for this reseller
          const resellerKeysFile = path.join(KEYS_DIR, `${reseller.id}.json`);
          if (fs.existsSync(resellerKeysFile)) {
            const keysData = await readFile(resellerKeysFile, "utf-8");
            const keys: Key[] = JSON.parse(keysData);
            for (const key of keys) {
              this.keys.set(key.id, key);
              if (key.id >= this.keyId) {
                this.keyId = key.id + 1;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error initializing storage:", error);
    }
  }
  
  private hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
  }

  // Admin operations
  async getAdmin(username: string): Promise<Admin | undefined> {
    return this.admins.get(username);
  }
  
  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const newAdmin: Admin = {
      id: this.adminId++,
      ...admin,
      password: this.hashPassword(admin.password)
    };
    this.admins.set(newAdmin.username, newAdmin);
    
    // Update admin.json
    const admins = Array.from(this.admins.values());
    await writeFile(ADMINS_FILE, JSON.stringify(admins, null, 2));
    
    return newAdmin;
  }
  
  // Referral token operations
  async createReferralToken(tokenData: InsertReferralToken): Promise<ReferralToken> {
    const token: ReferralToken = {
      id: this.tokenId++,
      ...tokenData,
      used: false,
      createdAt: new Date()
    };
    this.referralTokens.set(token.id, token);
    
    // Update token.json
    const tokens = Array.from(this.referralTokens.values());
    await writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    
    return token;
  }
  
  async getReferralToken(tokenValue: string): Promise<ReferralToken | undefined> {
    return Array.from(this.referralTokens.values()).find(
      token => token.token === tokenValue && !token.used
    );
  }
  
  async markReferralTokenAsUsed(id: number): Promise<ReferralToken> {
    const token = this.referralTokens.get(id);
    if (!token) {
      throw new Error("Token not found");
    }
    
    token.used = true;
    this.referralTokens.set(id, token);
    
    // Update token.json
    const tokens = Array.from(this.referralTokens.values());
    await writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    
    return token;
  }
  
  async getAllReferralTokens(): Promise<ReferralToken[]> {
    return Array.from(this.referralTokens.values());
  }
  
  // Reseller operations
  async createReseller(reseller: InsertReseller): Promise<Reseller> {
    const newReseller: Reseller = {
      id: this.resellerId++,
      ...reseller,
      password: this.hashPassword(reseller.password),
      credits: 0,
      keysGenerated: 0,
      createdAt: new Date()
    };
    this.resellers.set(newReseller.id, newReseller);
    
    // Update resellers.json
    const resellers = Array.from(this.resellers.values());
    await writeFile(RESELLERS_FILE, JSON.stringify(resellers, null, 2));
    
    // Create keys file for reseller
    const resellerKeysFile = path.join(KEYS_DIR, `${newReseller.id}.json`);
    await writeFile(resellerKeysFile, JSON.stringify([], null, 2));
    
    return newReseller;
  }
  
  async getReseller(id: number): Promise<Reseller | undefined> {
    return this.resellers.get(id);
  }
  
  async getResellerByUsername(username: string): Promise<Reseller | undefined> {
    return Array.from(this.resellers.values()).find(
      reseller => reseller.username === username
    );
  }
  
  async getAllResellers(): Promise<Reseller[]> {
    return Array.from(this.resellers.values());
  }
  
  async updateResellerCredits(id: number, credits: number): Promise<Reseller> {
    const reseller = this.resellers.get(id);
    if (!reseller) {
      throw new Error("Reseller not found");
    }
    
    reseller.credits = credits;
    this.resellers.set(id, reseller);
    
    // Update resellers.json
    const resellers = Array.from(this.resellers.values());
    await writeFile(RESELLERS_FILE, JSON.stringify(resellers, null, 2));
    
    return reseller;
  }
  
  async deleteReseller(id: number): Promise<void> {
    if (!this.resellers.has(id)) {
      throw new Error("Reseller not found");
    }
    
    this.resellers.delete(id);
    
    // Update resellers.json
    const resellers = Array.from(this.resellers.values());
    await writeFile(RESELLERS_FILE, JSON.stringify(resellers, null, 2));
    
    // Delete keys file for reseller
    const resellerKeysFile = path.join(KEYS_DIR, `${id}.json`);
    if (fs.existsSync(resellerKeysFile)) {
      fs.unlinkSync(resellerKeysFile);
    }
    
    // Delete all keys for this reseller
    const keysToDelete: number[] = [];
    this.keys.forEach((key, keyId) => {
      if (key.resellerId === id) {
        keysToDelete.push(keyId);
      }
    });
    
    keysToDelete.forEach(keyId => {
      this.keys.delete(keyId);
    });
  }
  
  // Key operations
  async createKey(keyData: InsertKey): Promise<Key> {
    const newKey: Key = {
      id: this.keyId++,
      ...keyData,
      devicesUsed: 0,
      status: "active",
      createdAt: new Date()
    };
    this.keys.set(newKey.id, newKey);
    
    // Update reseller's keys file
    const resellerKeysFile = path.join(KEYS_DIR, `${newKey.resellerId}.json`);
    let resellerKeys: Key[] = [];
    
    if (fs.existsSync(resellerKeysFile)) {
      const keysData = await readFile(resellerKeysFile, "utf-8");
      resellerKeys = JSON.parse(keysData);
    }
    
    resellerKeys.push(newKey);
    await writeFile(resellerKeysFile, JSON.stringify(resellerKeys, null, 2));
    
    // Update reseller's keys generated count
    const reseller = this.resellers.get(newKey.resellerId);
    if (reseller) {
      reseller.keysGenerated += 1;
      this.resellers.set(reseller.id, reseller);
      
      // Update resellers.json
      const resellers = Array.from(this.resellers.values());
      await writeFile(RESELLERS_FILE, JSON.stringify(resellers, null, 2));
    }
    
    return newKey;
  }
  
  async getKey(id: number): Promise<Key | undefined> {
    return this.keys.get(id);
  }
  
  async getKeyByValue(keyValue: string): Promise<Key | undefined> {
    return Array.from(this.keys.values()).find(
      key => key.key === keyValue
    );
  }
  
  async getKeysByResellerId(resellerId: number): Promise<Key[]> {
    return Array.from(this.keys.values()).filter(
      key => key.resellerId === resellerId
    );
  }
  
  async updateKeyDevicesUsed(id: number, devicesUsed: number): Promise<Key> {
    const key = this.keys.get(id);
    if (!key) {
      throw new Error("Key not found");
    }
    
    key.devicesUsed = devicesUsed;
    
    // Update key status if device limit is reached
    if (devicesUsed >= key.deviceLimit) {
      key.status = "full";
    }
    
    this.keys.set(id, key);
    
    // Update reseller's keys file
    const resellerKeysFile = path.join(KEYS_DIR, `${key.resellerId}.json`);
    if (fs.existsSync(resellerKeysFile)) {
      const keysData = await readFile(resellerKeysFile, "utf-8");
      let keys: Key[] = JSON.parse(keysData);
      
      keys = keys.map(k => (k.id === id ? key : k));
      await writeFile(resellerKeysFile, JSON.stringify(keys, null, 2));
    }
    
    return key;
  }
  
  async updateKeyStatus(id: number, status: string): Promise<Key> {
    const key = this.keys.get(id);
    if (!key) {
      throw new Error("Key not found");
    }
    
    key.status = status;
    this.keys.set(id, key);
    
    // Update reseller's keys file
    const resellerKeysFile = path.join(KEYS_DIR, `${key.resellerId}.json`);
    if (fs.existsSync(resellerKeysFile)) {
      const keysData = await readFile(resellerKeysFile, "utf-8");
      let keys: Key[] = JSON.parse(keysData);
      
      keys = keys.map(k => (k.id === id ? key : k));
      await writeFile(resellerKeysFile, JSON.stringify(keys, null, 2));
    }
    
    return key;
  }
  
  async deleteKey(id: number): Promise<void> {
    const key = this.keys.get(id);
    if (!key) {
      throw new Error("Key not found");
    }
    
    this.keys.delete(id);
    
    // Update reseller's keys file
    const resellerKeysFile = path.join(KEYS_DIR, `${key.resellerId}.json`);
    if (fs.existsSync(resellerKeysFile)) {
      const keysData = await readFile(resellerKeysFile, "utf-8");
      let keys: Key[] = JSON.parse(keysData);
      
      keys = keys.filter(k => k.id !== id);
      await writeFile(resellerKeysFile, JSON.stringify(keys, null, 2));
    }
  }
  
  // Device operations
  async createDevice(device: InsertDevice): Promise<Device> {
    const newDevice: Device = {
      id: this.deviceId++,
      ...device,
      createdAt: new Date()
    };
    this.devices.set(newDevice.id, newDevice);
    return newDevice;
  }
  
  async getDevicesByKeyId(keyId: number): Promise<Device[]> {
    return Array.from(this.devices.values()).filter(
      device => device.keyId === keyId
    );
  }
  
  async getDeviceByHwid(keyId: number, hwid: string): Promise<Device | undefined> {
    return Array.from(this.devices.values()).find(
      device => device.keyId === keyId && device.hwid === hwid
    );
  }
}

export const storage = new MemStorage();
