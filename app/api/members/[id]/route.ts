import { NextRequest, NextResponse } from 'next/server';
import { db, members, memberMemberships, membershipPlans } from '@/db';
import { eq, and, desc } from 'drizzle-orm';
import {
  updateMemberSchema,
  type MemberResponse
} from '@/lib/types/gym';

// GET /api/members/[id] - Get a specific member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = parseInt(params.id);

    if (isNaN(memberId)) {
      return NextResponse.json(
        { error: 'Invalid member ID' },
        { status: 400 }
      );
    }

    // Get member details
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Get member's current membership
    const [currentMembership] = await db
      .select({
        id: memberMemberships.id,
        planId: memberMemberships.planId,
        planName: membershipPlans.name,
        startDate: memberMemberships.startDate,
        endDate: memberMemberships.endDate,
        status: memberMemberships.status,
        remainingVisits: memberMemberships.remainingVisits,
        price: memberMemberships.price
      })
      .from(memberMemberships)
      .innerJoin(membershipPlans, eq(memberMemberships.planId, membershipPlans.id))
      .where(
        and(
          eq(memberMemberships.memberId, memberId),
          eq(memberMemberships.status, 'active')
        )
      )
      .orderBy(desc(memberMemberships.endDate))
      .limit(1);

    return NextResponse.json({
      member,
      currentMembership
    });
  } catch (error) {
    console.error('Error fetching member:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member' },
      { status: 500 }
    );
  }
}

// PUT /api/members/[id] - Update a member
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = parseInt(params.id);

    if (isNaN(memberId)) {
      return NextResponse.json(
        { error: 'Invalid member ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = updateMemberSchema.parse(body);

    // Check if member exists
    const [existingMember] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Check if email already exists (if email is being updated)
    if (validatedData.email && validatedData.email !== existingMember.email) {
      const [emailCheck] = await db
        .select()
        .from(members)
        .where(eq(members.email, validatedData.email))
        .limit(1);

      if (emailCheck) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    // Update member
    const [updatedMember] = await db
      .update(members)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(members.id, memberId))
      .returning();

    return NextResponse.json({
      message: 'Member updated successfully',
      member: updatedMember
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }

    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

// DELETE /api/members/[id] - Delete a member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const memberId = parseInt(params.id);

    if (isNaN(memberId)) {
      return NextResponse.json(
        { error: 'Invalid member ID' },
        { status: 400 }
      );
    }

    // Check if member exists
    const [existingMember] = await db
      .select()
      .from(members)
      .where(eq(members.id, memberId))
      .limit(1);

    if (!existingMember) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Soft delete by updating status or actually delete
    // For now, we'll soft delete by marking as cancelled in memberships
    await db
      .update(memberMemberships)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(memberMemberships.memberId, memberId));

    // Optionally, you could also add a 'deletedAt' field to members table

    return NextResponse.json({
      message: 'Member deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting member:', error);
    return NextResponse.json(
      { error: 'Failed to delete member' },
      { status: 500 }
    );
  }
}