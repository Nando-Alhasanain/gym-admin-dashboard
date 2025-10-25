import {
  pgTable,
  text,
  integer,
  decimal,
  timestamp,
  boolean,
  serial,
  varchar,
  pgEnum,
  index
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums for status fields
export const membershipStatusEnum = pgEnum('membership_status', ['active', 'expired', 'suspended', 'cancelled']);
export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'failed', 'refunded']);

// Members table - stores gym member information
export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  memberId: text('member_id').notNull().unique(), // Unique member ID for QR codes
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  dateOfBirth: timestamp('date_of_birth', { mode: 'date' }),
  gender: genderEnum('gender'),
  address: text('address'),
  emergencyContact: text('emergency_contact'),
  emergencyPhone: text('emergency_phone'),
  qrCode: text('qr_code').notNull().unique(), // Base64 encoded QR code
  photo: text('photo'), // Base64 encoded profile photo
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  memberIdIdx: index('members_member_id_idx').on(table.memberId),
  emailIdx: index('members_email_idx').on(table.email),
}));

// Membership Plans table - stores different membership tiers
export const membershipPlans = pgTable('membership_plans', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  duration: integer('duration').notNull(), // Duration in days
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  features: text('features'), // JSON string of features
  isActive: boolean('is_active').default(true).notNull(),
  maxVisits: integer('max_visits'), // Optional: maximum visits allowed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Member Memberships table - links members to membership plans
export const memberMemberships = pgTable('member_memberships', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id').references(() => members.id, { onDelete: 'cascade' }).notNull(),
  planId: integer('plan_id').references(() => membershipPlans.id).notNull(),
  startDate: timestamp('start_date').defaultNow().notNull(),
  endDate: timestamp('end_date').notNull(),
  status: membershipStatusEnum('status').default('active').notNull(),
  remainingVisits: integer('remaining_visits'), // For plans with visit limits
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  memberIdIdx: index('member_memberships_member_id_idx').on(table.memberId),
  planIdIdx: index('member_memberships_plan_id_idx').on(table.planId),
}));

// Products table - stores gym products (supplements, merchandise, etc.)
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category').notNull(),
  sku: text('sku').notNull().unique(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  cost: decimal('cost', { precision: 10, scale: 2 }), // Cost price for profit calculation
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  minStockLevel: integer('min_stock_level').default(5).notNull(), // Alert level
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  skuIdx: index('products_sku_idx').on(table.sku),
  categoryIdx: index('products_category_idx').on(table.category),
}));

// Sales table - records all sales transactions
export const sales = pgTable('sales', {
  id: serial('id').primaryKey(),
  saleNumber: text('sale_number').notNull().unique(),
  memberId: integer('member_id').references(() => members.id, { onDelete: 'set null' }),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  discountAmount: decimal('discount_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  finalAmount: decimal('final_amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(), // cash, card, etc.
  paymentStatus: paymentStatusEnum('payment_status').default('pending').notNull(),
  staffId: integer('staff_id').references(() => members.id, { onDelete: 'set null' }), // Staff who made the sale
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  saleNumberIdx: index('sales_sale_number_idx').on(table.saleNumber),
  memberIdIdx: index('sales_member_id_idx').on(table.memberId),
  createdAtIdx: index('sales_created_at_idx').on(table.createdAt),
}));

// Sale Items table - individual items in a sale
export const saleItems = pgTable('sale_items', {
  id: serial('id').primaryKey(),
  saleId: integer('sale_id').references(() => sales.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull()
}, (table) => ({
  saleIdIdx: index('sale_items_sale_id_idx').on(table.saleId),
  productIdIdx: index('sale_items_product_id_idx').on(table.productId),
}));

// Attendance Logs table - records member check-ins
export const attendanceLogs = pgTable('attendance_logs', {
  id: serial('id').primaryKey(),
  memberId: integer('member_id').references(() => members.id, { onDelete: 'cascade' }).notNull(),
  checkInTime: timestamp('check_in_time').defaultNow().notNull(),
  checkOutTime: timestamp('check_out_time'),
  status: text('status').notNull(), // 'checked_in', 'checked_out', 'no_show'
  notes: text('notes'),
  staffId: integer('staff_id').references(() => members.id, { onDelete: 'set null' }), // Staff who checked them in
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  memberIdIdx: index('attendance_logs_member_id_idx').on(table.memberId),
  checkInTimeIdx: index('attendance_logs_check_in_time_idx').on(table.checkInTime),
}));

// Define relations
export const membersRelations = relations(members, ({ many }) => ({
  memberships: many(memberMemberships),
  sales: many(sales),
  attendanceLogs: many(attendanceLogs),
}));

export const membershipPlansRelations = relations(membershipPlans, ({ many }) => ({
  memberMemberships: many(memberMemberships),
}));

export const memberMembershipsRelations = relations(memberMemberships, ({ one }) => ({
  member: one(members, {
    fields: [memberMemberships.memberId],
    references: [members.id],
  }),
  plan: one(membershipPlans, {
    fields: [memberMemberships.planId],
    references: [membershipPlans.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  saleItems: many(saleItems),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  member: one(members, {
    fields: [sales.memberId],
    references: [members.id],
  }),
  staff: one(members, {
    fields: [sales.staffId],
    references: [members.id],
  }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export const attendanceLogsRelations = relations(attendanceLogs, ({ one }) => ({
  member: one(members, {
    fields: [attendanceLogs.memberId],
    references: [members.id],
  }),
  staff: one(members, {
    fields: [attendanceLogs.staffId],
    references: [members.id],
  }),
}));

// Export types for TypeScript
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type MembershipPlan = typeof membershipPlans.$inferSelect;
export type NewMembershipPlan = typeof membershipPlans.$inferInsert;
export type MemberMembership = typeof memberMemberships.$inferSelect;
export type NewMemberMembership = typeof memberMemberships.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
export type SaleItem = typeof saleItems.$inferSelect;
export type NewSaleItem = typeof saleItems.$inferInsert;
export type AttendanceLog = typeof attendanceLogs.$inferSelect;
export type NewAttendanceLog = typeof attendanceLogs.$inferInsert;