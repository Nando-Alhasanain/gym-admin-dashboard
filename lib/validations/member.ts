import { z } from "zod";

export const createMemberSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100, "First name must be less than 100 characters"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name must be less than 100 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  membershipPlanId: z.string().uuid("Invalid membership plan ID").optional(),
});

export const updateMemberSchema = createMemberSchema.partial().extend({
  id: z.string().uuid("Invalid member ID"),
  isActive: z.boolean().optional(),
});

export const memberIdSchema = z.object({
  id: z.string().uuid("Invalid member ID"),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type MemberIdInput = z.infer<typeof memberIdSchema>;