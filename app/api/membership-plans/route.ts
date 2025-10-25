import { NextRequest, NextResponse } from 'next/server';
import { db, membershipPlans } from '@/db';
import { eq, desc, and, ilike } from 'drizzle-orm';
import {
  createMembershipPlanSchema,
  updateMembershipPlanSchema
} from '@/lib/types/gym';

// GET /api/membership-plans - List all membership plans
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive');

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (search) {
      conditions.push(
        ilike(membershipPlans.name, `%${search}%`),
        ilike(membershipPlans.description, `%${search}%`)
      );
    }
    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(membershipPlans.isActive, isActive === 'true'));
    }

    // Query membership plans
    const plansData = await db
      .select()
      .from(membershipPlans)
      .where(
        conditions.length > 0 ? conditions.reduce((acc, condition) => acc ? and(acc, condition) : condition) : undefined
      )
      .orderBy(desc(membershipPlans.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: membershipPlans.id })
      .from(membershipPlans)
      .where(
        conditions.length > 0 ? conditions.reduce((acc, condition) => acc ? and(acc, condition) : condition) : undefined
      );

    return NextResponse.json({
      plans: plansData,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching membership plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch membership plans' },
      { status: 500 }
    );
  }
}

// POST /api/membership-plans - Create a new membership plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = createMembershipPlanSchema.parse(body);

    // Check if plan name already exists
    const existingPlan = await db
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.name, validatedData.name))
      .limit(1);

    if (existingPlan.length > 0) {
      return NextResponse.json(
        { error: 'Plan name already exists' },
        { status: 409 }
      );
    }

    // Insert new membership plan
    const [newPlan] = await db
      .insert(membershipPlans)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return NextResponse.json(
      { message: 'Membership plan created successfully', plan: newPlan },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }

    console.error('Error creating membership plan:', error);
    return NextResponse.json(
      { error: 'Failed to create membership plan' },
      { status: 500 }
    );
  }
}