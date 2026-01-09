import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { MINING_MACHINES_DATA, insertUserSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth: Signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const parsed = insertUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: parsed.error.errors[0].message });
      }

      const existing = await storage.getUserByUsername(parsed.data.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(parsed.data);
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Auth: Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Mining: Get active session
  app.get("/api/mining/session/:userId", async (req, res) => {
    try {
      const session = await storage.getActiveMiningSession(req.params.userId);
      res.json(session || null);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Mining: Start session
  app.post("/api/mining/start", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      const existingSession = await storage.getActiveMiningSession(userId);
      if (existingSession) {
        return res.status(400).json({ message: "Mining session already active" });
      }

      const endsAt = new Date();
      endsAt.setHours(endsAt.getHours() + 24);

      const session = await storage.createMiningSession(userId, endsAt);
      res.json(session);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Mining: Claim reward
  app.post("/api/mining/claim", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }

      const session = await storage.getActiveMiningSession(userId);
      if (!session) {
        return res.status(400).json({ message: "No active mining session" });
      }

      const now = new Date();
      if (now < new Date(session.endsAt)) {
        return res.status(400).json({ message: "Mining session not complete" });
      }

      // Calculate reward based on owned machines
      const userMachines = await storage.getUserMachines(userId);
      let dailyReward = 10; // Base reward
      
      for (const um of userMachines) {
        const machine = MINING_MACHINES_DATA.find(m => m.id === um.machineId);
        if (machine) {
          dailyReward += machine.dailyProfit;
        }
      }

      // Update user balance
      const user = await storage.getUser(userId);
      if (user) {
        await storage.updateUserBalance(userId, user.balance + dailyReward);
      }

      // Mark session as claimed
      await storage.claimMiningSession(session.id);

      res.json({ reward: dailyReward, claimed: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Machines: Get user's owned machines
  app.get("/api/machines/owned/:userId", async (req, res) => {
    try {
      const machines = await storage.getUserMachines(req.params.userId);
      res.json(machines);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Machines: Rent a machine
  app.post("/api/machines/rent", async (req, res) => {
    try {
      const { userId, machineId } = req.body;
      if (!userId || !machineId) {
        return res.status(400).json({ message: "User ID and Machine ID required" });
      }

      const machine = MINING_MACHINES_DATA.find(m => m.id === machineId);
      if (!machine) {
        return res.status(404).json({ message: "Machine not found" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.balance < machine.price) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Deduct balance and add machine
      const newBalance = user.balance - machine.price;
      await storage.updateUserBalance(userId, newBalance);
      await storage.updateUserMiners(userId, user.totalMiners + 1);
      await storage.addUserMachine({ userId, machineId });

      const updatedUser = await storage.getUser(userId);
      const { password: _, ...safeUser } = updatedUser!;

      res.json({ success: true, user: safeUser });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Withdrawals: Get user's withdrawals
  app.get("/api/withdrawals/:userId", async (req, res) => {
    try {
      const withdrawals = await storage.getUserWithdrawals(req.params.userId);
      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  // Withdrawals: Request withdrawal
  app.post("/api/withdrawals/request", async (req, res) => {
    try {
      const { userId, amount, accountNumber } = req.body;
      if (!userId || !amount || !accountNumber) {
        return res.status(400).json({ message: "All fields required" });
      }

      if (amount < 500) {
        return res.status(400).json({ message: "Minimum withdrawal is 500 PKR" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.balance < amount) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      // Deduct balance
      await storage.updateUserBalance(userId, user.balance - amount);

      // Create withdrawal request
      const withdrawal = await storage.createWithdrawal(userId, amount, accountNumber);

      res.json(withdrawal);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  });

  return httpServer;
}
