import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { membershipPlans } from "@/db/schema";
import { z } from "zod";

const createPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required").max(100, "Plan name must be less than 100 characters"),
  description: z.string().optional(),
  price: z.string().transform((val) => parseFloat(val)).refine((val) => !isNaN(val) && val >= 0, "Price must be a positive number"),
  durationDays: z.string().transform((val) => parseInt(val)).refine((val) => !isNaN(val) && val > 0, "Duration must be a positive integer"),
  isActive: z.boolean().default(true),
});

const updatePlanSchema = createPlanSchema.partial().extend({
  id: z.string().uuid("Invalid plan ID"),
});

const planIdSchema = z.object({
  id: z.string().uuid("Invalid plan ID"),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get("isActive");

    const conditions = [];

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(membershipPlans.isActive, isActive === "true"));
    }

    const plans = await db.query.membershipPlans.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [membershipPlans.name],
    });

    return NextResponse.json({
      data: plans,
    });
  } catch (error) {
    console.error("Error fetching membership plans:", error);
    return NextResponse.json(
      { error: "Failed to fetch membership plans" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createPlanSchema.parse(body);

    const [newPlan] = await db.insert(membershipPlans).values({
      ...validatedData,
    }).returning();

    return NextResponse.json(newPlan);
  } catch (error) {
    console.error("Error creating membership plan:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create membership plan" },
      { status: 500 }
    );
  }
}