import {
  users,
  userMachines,
  miningSessions,
  withdrawalRequests,
  type User,
  type InsertUser,
  type UserMachine,
  type InsertUserMachine,
  type MiningSession,
  type WithdrawalRequest,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserBalance(id: string, balance: number): Promise<User | undefined>;
  updateUserMiners(id: string, totalMiners: number): Promise<User | undefined>;

  getUserMachines(userId: string): Promise<UserMachine[]>;
  addUserMachine(data: InsertUserMachine): Promise<UserMachine>;

  getActiveMiningSession(userId: string): Promise<MiningSession | undefined>;
  createMiningSession(userId: string, endsAt: Date): Promise<MiningSession>;
  claimMiningSession(sessionId: string): Promise<MiningSession | undefined>;

  getUserWithdrawals(userId: string): Promise<WithdrawalRequest[]>;
  createWithdrawal(userId: string, amount: number, accountNumber: string): Promise<WithdrawalRequest>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, balance: 0, totalMiners: 0 })
      .returning();
    return user;
  }

  async updateUserBalance(id: string, balance: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ balance })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserMiners(id: string, totalMiners: number): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ totalMiners })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUserMachines(userId: string): Promise<UserMachine[]> {
    return await db.select().from(userMachines).where(eq(userMachines.userId, userId));
  }

  async addUserMachine(data: InsertUserMachine): Promise<UserMachine> {
    const [machine] = await db
      .insert(userMachines)
      .values(data)
      .returning();
    return machine;
  }

  async getActiveMiningSession(userId: string): Promise<MiningSession | undefined> {
    const [session] = await db
      .select()
      .from(miningSessions)
      .where(and(eq(miningSessions.userId, userId), eq(miningSessions.claimed, false)))
      .orderBy(desc(miningSessions.startedAt))
      .limit(1);
    return session || undefined;
  }

  async createMiningSession(userId: string, endsAt: Date): Promise<MiningSession> {
    const [session] = await db
      .insert(miningSessions)
      .values({ userId, endsAt })
      .returning();
    return session;
  }

  async claimMiningSession(sessionId: string): Promise<MiningSession | undefined> {
    const [session] = await db
      .update(miningSessions)
      .set({ claimed: true })
      .where(eq(miningSessions.id, sessionId))
      .returning();
    return session || undefined;
  }

  async getUserWithdrawals(userId: string): Promise<WithdrawalRequest[]> {
    return await db
      .select()
      .from(withdrawalRequests)
      .where(eq(withdrawalRequests.userId, userId))
      .orderBy(desc(withdrawalRequests.createdAt));
  }

  async createWithdrawal(userId: string, amount: number, accountNumber: string): Promise<WithdrawalRequest> {
    const [withdrawal] = await db
      .insert(withdrawalRequests)
      .values({ userId, amount, accountNumber, status: "pending" })
      .returning();
    return withdrawal;
  }
}

export const storage = new DatabaseStorage();
