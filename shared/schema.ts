import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  phoneNumber: varchar("phone_number", { length: 11 }),
  balance: real("balance").notNull().default(0),
  totalMiners: integer("total_miners").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  referralCode: varchar("referral_code").unique(),
  referredById: varchar("referred_by_id"),
  totalReferralEarnings: real("total_referral_earnings").notNull().default(0),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  phoneNumber: z.string().length(11, "Phone number must be 11 digits"),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const miningMachines = pgTable("mining_machines", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  level: integer("level").notNull(),
  price: integer("price").notNull(),
  dailyProfit: integer("daily_profit").notNull(),
});

export type MiningMachine = typeof miningMachines.$inferSelect;

export const userMachines = pgTable("user_machines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  machineId: varchar("machine_id").notNull(),
  purchasedAt: timestamp("purchased_at").notNull().defaultNow(),
});

export const insertUserMachineSchema = createInsertSchema(userMachines).pick({
  userId: true,
  machineId: true,
});

export type InsertUserMachine = z.infer<typeof insertUserMachineSchema>;
export type UserMachine = typeof userMachines.$inferSelect;

export const miningSessions = pgTable("mining_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endsAt: timestamp("ends_at").notNull(),
  claimed: boolean("claimed").notNull().default(false),
});

export const insertMiningSessionSchema = createInsertSchema(miningSessions).pick({
  userId: true,
  endsAt: true,
});

export type InsertMiningSession = z.infer<typeof insertMiningSessionSchema>;
export type MiningSession = typeof miningSessions.$inferSelect;

export const withdrawalRequests = pgTable("withdrawal_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  amount: real("amount").notNull(),
  taxAmount: real("tax_amount").notNull(),
  netAmount: real("net_amount").notNull(),
  method: text("method").notNull().default("easypaisa"),
  accountHolderName: text("account_holder_name").notNull(),
  accountNumber: text("account_number").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertWithdrawalSchema = createInsertSchema(withdrawalRequests).pick({
  userId: true,
  amount: true,
  taxAmount: true,
  netAmount: true,
  method: true,
  accountHolderName: true,
  accountNumber: true,
});

export const withdrawalFormSchema = z.object({
  amount: z.number().min(500, "Minimum withdrawal is 500 PKR"),
  method: z.enum(["easypaisa", "jazzcash"], { required_error: "Please select a payment method" }),
  accountHolderName: z.string().min(3, "Enter account holder name"),
  accountNumber: z.string().min(11, "Enter a valid account number"),
});

export type InsertWithdrawal = z.infer<typeof insertWithdrawalSchema>;
export type WithdrawalRequest = typeof withdrawalRequests.$inferSelect;

export const depositRequests = pgTable("deposit_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  amount: real("amount").notNull(),
  transactionId: text("transaction_id").notNull(),
  screenshotUrl: text("screenshot_url"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  reviewedBy: varchar("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
});

export const insertDepositSchema = createInsertSchema(depositRequests).pick({
  userId: true,
  amount: true,
  transactionId: true,
  screenshotUrl: true,
});

export const depositFormSchema = z.object({
  amount: z.number().min(100, "Minimum deposit is 100 PKR"),
  transactionId: z.string().min(5, "Enter a valid transaction ID"),
});

export type InsertDeposit = z.infer<typeof insertDepositSchema>;
export type DepositRequest = typeof depositRequests.$inferSelect;

export const referralCommissions = pgTable("referral_commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  fromUserId: varchar("from_user_id").notNull(),
  depositId: varchar("deposit_id").notNull(),
  level: integer("level").notNull(),
  amount: real("amount").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type ReferralCommission = typeof referralCommissions.$inferSelect;

export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  iconType: text("icon_type").notNull().default("sparkles"),
  isActive: boolean("is_active").notNull().default(true),
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by"),
});

export const insertAnnouncementSchema = createInsertSchema(announcements).pick({
  title: true,
  description: true,
  imageUrl: true,
  iconType: true,
  isActive: true,
  priority: true,
});

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = typeof announcements.$inferSelect;

export interface MachineData {
  id: string;
  name: string;
  level: number;
  price: number;
  dailyProfit: number;
  duration: number;
  maxRentals: number;
}

export const MINING_MACHINES_DATA: MachineData[] = [
  { id: "m1", name: "M1", level: 1, price: 1500, dailyProfit: 100, duration: 25, maxRentals: 1 },
  { id: "m2", name: "M2", level: 2, price: 5000, dailyProfit: 200, duration: 60, maxRentals: 1 },
  { id: "m3", name: "M3", level: 3, price: 10000, dailyProfit: 400, duration: 60, maxRentals: 1 },
  { id: "m4", name: "M4", level: 4, price: 20000, dailyProfit: 800, duration: 60, maxRentals: 1 },
  { id: "m5", name: "M5", level: 5, price: 35000, dailyProfit: 1500, duration: 60, maxRentals: 2 },
  { id: "m6", name: "M6", level: 6, price: 50000, dailyProfit: 2200, duration: 60, maxRentals: 2 },
  { id: "m7", name: "M7", level: 7, price: 70000, dailyProfit: 3000, duration: 60, maxRentals: 2 },
  { id: "m8", name: "M8", level: 8, price: 100000, dailyProfit: 4500, duration: 60, maxRentals: 2 },
  { id: "m9", name: "M9", level: 9, price: 150000, dailyProfit: 7000, duration: 60, maxRentals: 2 },
  { id: "m10", name: "M10", level: 10, price: 200000, dailyProfit: 10000, duration: 60, maxRentals: 2 },
];
