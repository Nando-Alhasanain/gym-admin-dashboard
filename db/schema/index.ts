import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  timestamp,
  boolean,
  pgEnum
} from "drizzle-orm/pg-core";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "staff"]);

// Members table
export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  qrCode: varchar("qr_code", { length: 255 }).notNull().unique(),
  membershipPlanId: uuid("membership_plan_id").references(() => membershipPlans.id),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Membership plans table
export const membershipPlans = pgTable("membership_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  durationDays: integer("duration_days").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Products table
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").default(0).notNull(),
  sku: varchar("sku", { length: 100 }).unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Check-in logs table
export const checkInLogs = pgTable("check_in_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }),
  checkInTime: timestamp("check_in_time").defaultNow().notNull(),
  checkOutTime: timestamp("check_out_time"),
  processedBy: uuid("processed_by").references(() => users.id),
  notes: text("notes"),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }).default(0).notNull(),
  discountAmount: numeric("discount_amount", { precision: 10, scale: 2 }).default(0).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).default("cash"),
  processedBy: uuid("processed_by").references(() => users.id),
  memberId: uuid("member_id").references(() => members.id),
  status: varchar("status", { length: 20 }).default("completed").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transaction items table
export const transactionItems = pgTable("transaction_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Users table (staff/admin)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Member subscriptions table (for tracking member plan history)
export const memberSubscriptions = pgTable("member_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }),
  membershipPlanId: uuid("membership_plan_id").references(() => membershipPlans.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  status: varchar("status", { length: 20 }).default("active").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  transactionId: uuid("transaction_id").references(() => transactions.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Inventory adjustments table
export const inventoryAdjustments = pgTable("inventory_adjustments", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id, { onDelete: "cascade" }),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  adjustment: integer("adjustment").notNull(),
  reason: text("reason").notNull(),
  adjustedBy: uuid("adjusted_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types for TypeScript
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type NewMembershipPlan = typeof membershipPlans.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type CheckInLog = typeof checkInLogs.$inferSelect;
export type NewCheckInLog = typeof checkInLogs.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type TransactionItem = typeof transactionItems.$inferSelect;
export type NewTransactionItem = typeof transactionItems.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type MemberSubscription = typeof memberSubscriptions.$inferSelect;
export type NewMemberSubscription = typeof memberSubscriptions.$inferInsert;
export type InventoryAdjustment = typeof inventoryAdjustments.$inferSelect;
export type NewInventoryAdjustment = typeof inventoryAdjustments.$inferInsert;