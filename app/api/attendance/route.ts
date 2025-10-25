import { NextRequest, NextResponse } from 'next/server';
import { db, attendanceLogs, members, memberMemberships, membershipPlans } from '@/db';
import { eq, and, desc, gte, lte, ilike } from 'drizzle-orm';
import {
  createAttendanceLogSchema,
  checkInRequestSchema,
  type CheckInResponse
} from '@/lib/types/gym';

// GET /api/attendance - List all attendance logs with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const date = searchParams.get('date');
    const memberId = searchParams.get('memberId');

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      conditions.push(
        gte(attendanceLogs.checkInTime, startDate),
        lte(attendanceLogs.checkInTime, endDate)
      );
    }

    if (memberId) {
      conditions.push(eq(attendanceLogs.memberId, parseInt(memberId)));
    }

    // Query attendance logs with member details
    const attendanceData = await db
      .select({
        id: attendanceLogs.id,
        memberId: attendanceLogs.memberId,
        checkInTime: attendanceLogs.checkInTime,
        checkOutTime: attendanceLogs.checkOutTime,
        status: attendanceLogs.status,
        notes: attendanceLogs.notes,
        staffId: attendanceLogs.staffId,
        createdAt: attendanceLogs.createdAt,
        member: {
          id: members.id,
          memberId: members.memberId,
          firstName: members.firstName,
          lastName: members.lastName,
          email: members.email
        }
      })
      .from(attendanceLogs)
      .innerJoin(members, eq(attendanceLogs.memberId, members.id))
      .where(
        conditions.length > 0 ? conditions.reduce((acc, condition) => acc ? and(acc, condition) : condition) : undefined
      )
      .orderBy(desc(attendanceLogs.checkInTime))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: attendanceLogs.id })
      .from(attendanceLogs)
      .where(
        conditions.length > 0 ? conditions.reduce((acc, condition) => acc ? and(acc, condition) : condition) : undefined
      );

    return NextResponse.json({
      attendance: attendanceData,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching attendance logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance logs' },
      { status: 500 }
    );
  }
}

// POST /api/attendance - Check in a member (QR code or manual)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = checkInRequestSchema.parse(body);

    // Find member by member_id (from QR code) or member ID
    const [member] = await db
      .select()
      .from(members)
      .where(eq(members.memberId, validatedData.memberId))
      .limit(1);

    if (!member) {
      const response: CheckInResponse = {
        success: false,
        message: 'Member not found'
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Check if member has active membership
    const [activeMembership] = await db
      .select({
        id: memberMemberships.id,
        planName: membershipPlans.name,
        endDate: memberMemberships.endDate,
        status: memberMemberships.status,
        remainingVisits: memberMemberships.remainingVisits
      })
      .from(memberMemberships)
      .innerJoin(membershipPlans, eq(memberMemberships.planId, membershipPlans.id))
      .where(
        and(
          eq(memberMemberships.memberId, member.id),
          eq(memberMemberships.status, 'active')
        )
      )
      .orderBy(desc(memberMemberships.endDate))
      .limit(1);

    if (!activeMembership) {
      const response: CheckInResponse = {
        success: false,
        message: 'No active membership found'
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if membership has expired
    const now = new Date();
    if (activeMembership.endDate < now) {
      const response: CheckInResponse = {
        success: false,
        message: 'Membership has expired'
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if member has remaining visits (if applicable)
    if (activeMembership.remainingVisits !== null && activeMembership.remainingVisits <= 0) {
      const response: CheckInResponse = {
        success: false,
        message: 'No remaining visits'
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if member already checked in today (and not checked out)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [existingCheckIn] = await db
      .select()
      .from(attendanceLogs)
      .where(
        and(
          eq(attendanceLogs.memberId, member.id),
          gte(attendanceLogs.checkInTime, today),
          eq(attendanceLogs.status, 'checked_in')
        )
      )
      .limit(1);

    if (existingCheckIn) {
      const response: CheckInResponse = {
        success: false,
        message: 'Member already checked in today'
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Create attendance log
    const [attendanceLog] = await db
      .insert(attendanceLogs)
      .values({
        memberId: member.id,
        checkInTime: new Date(),
        status: 'checked_in',
        staffId: validatedData.staffId,
        createdAt: new Date()
      })
      .returning();

    // Update remaining visits if applicable
    if (activeMembership.remainingVisits !== null) {
      await db
        .update(memberMemberships)
        .set({
          remainingVisits: activeMembership.remainingVisits - 1,
          updatedAt: new Date()
        })
        .where(eq(memberMemberships.id, activeMembership.id));
    }

    const response: CheckInResponse = {
      success: true,
      message: 'Check-in successful',
      member: {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        membershipStatus: activeMembership.status,
        membershipEndDate: activeMembership.endDate
      },
      attendanceLog: {
        ...attendanceLog,
        member: {
          id: member.id,
          memberId: member.memberId,
          firstName: member.firstName,
          lastName: member.lastName,
          email: member.email
        }
      }
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error during check-in:', error);

    const response: CheckInResponse = {
      success: false,
      message: 'Check-in failed'
    };

    return NextResponse.json(response, { status: 500 });
  }
}