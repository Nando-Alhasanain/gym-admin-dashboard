import { NextRequest, NextResponse } from 'next/server';
import { db, membershipPlans } from '@/db';
import { eq } from 'drizzle-orm';
import { updateMembershipPlanSchema } from '@/lib/types/gym';

// GET /api/membership-plans/[id] - Get a specific membership plan
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = parseInt(params.id);

    if (isNaN(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    const [plan] = await db
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.id, planId))
      .limit(1);

    if (!plan) {
      return NextResponse.json(
        { error: 'Membership plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error fetching membership plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch membership plan' },
      { status: 500 }
    );
  }
}

// PUT /api/membership-plans/[id] - Update a membership plan
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = parseInt(params.id);

    if (isNaN(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = updateMembershipPlanSchema.parse(body);

    // Check if plan exists
    const [existingPlan] = await db
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.id, planId))
      .limit(1);

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Membership plan not found' },
        { status: 404 }
      );
    }

    // Check if name already exists (if name is being updated)
    if (validatedData.name && validatedData.name !== existingPlan.name) {
      const [nameCheck] = await db
        .select()
        .from(membershipPlans)
        .where(eq(membershipPlans.name, validatedData.name))
        .limit(1);

      if (nameCheck) {
        return NextResponse.json(
          { error: 'Plan name already exists' },
          { status: 409 }
        );
      }
    }

    // Update membership plan
    const [updatedPlan] = await db
      .update(membershipPlans)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(membershipPlans.id, planId))
      .returning();

    return NextResponse.json({
      message: 'Membership plan updated successfully',
      plan: updatedPlan
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }

    console.error('Error updating membership plan:', error);
    return NextResponse.json(
      { error: 'Failed to update membership plan' },
      { status: 500 }
    );
  }
}

// DELETE /api/membership-plans/[id] - Delete a membership plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const planId = parseInt(params.id);

    if (isNaN(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    // Check if plan exists
    const [existingPlan] = await db
      .select()
      .from(membershipPlans)
      .where(eq(membershipPlans.id, planId))
      .limit(1);

    if (!existingPlan) {
      return NextResponse.json(
        { error: 'Membership plan not found' },
        { status: 404 }
      );
    }

    // Soft delete by deactivating
    const [deactivatedPlan] = await db
      .update(membershipPlans)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(membershipPlans.id, planId))
      .returning();

    return NextResponse.json({
      message: 'Membership plan deactivated successfully',
      plan: deactivatedPlan
    });
  } catch (error) {
    console.error('Error deactivating membership plan:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate membership plan' },
      { status: 500 }
    );
  }
}