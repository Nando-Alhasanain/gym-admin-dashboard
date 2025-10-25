import { z } from "zod";

// Member validation schemas
export const memberSchema = z.object({
  id: z.number().optional(),
  memberId: z.string().min(1, "Member ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  dateOfBirth: z.date().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  qrCode: z.string().min(1, "QR code is required"),
  photo: z.string().optional(),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const createMemberSchema = memberSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const updateMemberSchema = createMemberSchema.partial();

// Membership Plan validation schemas
export const membershipPlanSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Plan name is required"),
  description: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 day"),
  price: z.number().min(0, "Price must be non-negative"),
  features: z.string().optional(), // JSON string
  isActive: z.boolean().default(true),
  maxVisits: z.number().min(1).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const createMembershipPlanSchema = membershipPlanSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const updateMembershipPlanSchema = createMembershipPlanSchema.partial();

// Member Membership validation schemas
export const memberMembershipSchema = z.object({
  id: z.number().optional(),
  memberId: z.number().min(1, "Member ID is required"),
  planId: z.number().min(1, "Plan ID is required"),
  startDate: z.date(),
  endDate: z.date(),
  status: z.enum(["active", "expired", "suspended", "cancelled"]),
  remainingVisits: z.number().min(0).optional(),
  price: z.number().min(0, "Price must be non-negative"),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const createMemberMembershipSchema = memberMembershipSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const updateMemberMembershipSchema = createMemberMembershipSchema.partial();

// Product validation schemas
export const productSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Product name is required"),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  sku: z.string().min(1, "SKU is required"),
  price: z.number().min(0, "Price must be non-negative"),
  cost: z.number().min(0, "Cost must be non-negative").optional(),
  stockQuantity: z.number().min(0, "Stock quantity must be non-negative").default(0),
  minStockLevel: z.number().min(0, "Min stock level must be non-negative").default(5),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const createProductSchema = productSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const updateProductSchema = createProductSchema.partial();

// Sale validation schemas
export const saleSchema = z.object({
  id: z.number().optional(),
  saleNumber: z.string().min(1, "Sale number is required"),
  memberId: z.number().optional(),
  totalAmount: z.number().min(0, "Total amount must be non-negative"),
  discountAmount: z.number().min(0, "Discount amount must be non-negative").default(0),
  finalAmount: z.number().min(0, "Final amount must be non-negative"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  paymentStatus: z.enum(["pending", "completed", "failed", "refunded"]).default("pending"),
  staffId: z.number().optional(),
  notes: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export const createSaleSchema = saleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const updateSaleSchema = createSaleSchema.partial();

// Sale Item validation schemas
export const saleItemSchema = z.object({
  id: z.number().optional(),
  saleId: z.number().min(1, "Sale ID is required"),
  productId: z.number().min(1, "Product ID is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be non-negative"),
  totalPrice: z.number().min(0, "Total price must be non-negative")
});

export const createSaleItemSchema = saleItemSchema.omit({
  id: true
});

export const updateSaleItemSchema = createSaleItemSchema.partial();

// Attendance Log validation schemas
export const attendanceLogSchema = z.object({
  id: z.number().optional(),
  memberId: z.number().min(1, "Member ID is required"),
  checkInTime: z.date(),
  checkOutTime: z.date().optional(),
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
  staffId: z.number().optional(),
  createdAt: z.date().optional()
});

export const createAttendanceLogSchema = attendanceLogSchema.omit({
  id: true,
  createdAt: true
});

export const updateAttendanceLogSchema = createAttendanceLogSchema.partial();

// API Request/Response types
export type CreateMemberRequest = z.infer<typeof createMemberSchema>;
export type UpdateMemberRequest = z.infer<typeof updateMemberSchema>;
export type MemberResponse = z.infer<typeof memberSchema>;

export type CreateMembershipPlanRequest = z.infer<typeof createMembershipPlanSchema>;
export type UpdateMembershipPlanRequest = z.infer<typeof updateMembershipPlanSchema>;
export type MembershipPlanResponse = z.infer<typeof membershipPlanSchema>;

export type CreateProductRequest = z.infer<typeof createProductSchema>;
export type UpdateProductRequest = z.infer<typeof updateProductSchema>;
export type ProductResponse = z.infer<typeof productSchema>;

export type CreateSaleRequest = z.infer<typeof createSaleSchema> & {
  items: z.infer<typeof createSaleItemSchema>[];
};
export type UpdateSaleRequest = z.infer<typeof updateSaleSchema>;
export type SaleResponse = z.infer<typeof saleSchema> & {
  items: z.infer<typeof saleItemSchema>[];
  member?: z.infer<typeof memberSchema>;
  staff?: z.infer<typeof memberSchema>;
};

export type CreateAttendanceLogRequest = z.infer<typeof createAttendanceLogSchema>;
export type UpdateAttendanceLogRequest = z.infer<typeof updateAttendanceLogSchema>;
export type AttendanceLogResponse = z.infer<typeof attendanceLogSchema> & {
  member?: z.infer<typeof memberSchema>;
  staff?: z.infer<typeof memberSchema>;
};

// Dashboard statistics types
export interface DashboardStats {
  totalMembers: number;
  activeMembers: number;
  totalRevenue: number;
  monthlyRevenue: number;
  todayCheckIns: number;
  lowStockProducts: number;
  popularPlans: Array<{
    name: string;
    count: number;
  }>;
  recentActivity: Array<{
    type: 'checkin' | 'sale' | 'new_member';
    description: string;
    timestamp: Date;
  }>;
}

// QR Code validation
export const checkInRequestSchema = z.object({
  memberId: z.string().min(1, "Member ID is required"),
  staffId: z.number().optional()
});

export type CheckInRequest = z.infer<typeof checkInRequestSchema>;

export interface CheckInResponse {
  success: boolean;
  message: string;
  member?: {
    id: number;
    name: string;
    membershipStatus: string;
    membershipEndDate?: Date;
  };
  attendanceLog?: AttendanceLogResponse;
}