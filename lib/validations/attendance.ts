import { z } from "zod";

export const checkInSchema = z.object({
  qrCode: z.string().min(1, "QR code is required"),
  notes: z.string().optional(),
});

export const manualCheckInSchema = z.object({
  memberId: z.string().uuid("Invalid member ID"),
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  checkInId: z.string().uuid("Invalid check-in ID"),
  notes: z.string().optional(),
});

export const attendanceQuerySchema = z.object({
  memberId: z.string().uuid("Invalid member ID").optional(),
  startDate: z.string().datetime("Invalid start date").optional(),
  endDate: z.string().datetime("Invalid end date").optional(),
  page: z.string().transform((val) => parseInt(val) || 1),
  limit: z.string().transform((val) => parseInt(val) || 10),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
export type ManualCheckInInput = z.infer<typeof manualCheckInSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>;