import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, isNull } from "drizzle-orm";
import { db } from "@/db";
import { members, checkInLogs, memberSubscriptions } from "@/db/schema";
import { manualCheckInSchema } from "@/lib/validations/attendance";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { memberId, notes } = manualCheckInSchema.parse(body);

    // Find member by ID
    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
      with: {
        membershipPlan: true,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    if (!member.isActive) {
      return NextResponse.json(
        { error: "Member account is inactive" },
        { status: 403 }
      );
    }

    // Check for active membership
    const activeSubscription = await db.query.memberSubscriptions.findFirst({
      where: and(
        eq(memberSubscriptions.memberId, member.id),
        eq(memberSubscriptions.status, "active")
      ),
      orderBy: [desc(memberSubscriptions.createdAt)],
    });

    if (!activeSubscription) {
      return NextResponse.json(
        { error: "No active membership found" },
        { status: 403 }
      );
    }

    // Check if membership is expired
    if (activeSubscription.endDate && new Date(activeSubscription.endDate) < new Date()) {
      return NextResponse.json(
        { error: "Membership has expired" },
        { status: 403 }
      );
    }

    // Check for duplicate check-in (already checked in and not checked out)
    const existingCheckIn = await db.query.checkInLogs.findFirst({
      where: and(
        eq(checkInLogs.memberId, member.id),
        isNull(checkInLogs.checkOutTime)
      ),
      orderBy: [desc(checkInLogs.checkInTime)],
    });

    if (existingCheckIn) {
      return NextResponse.json(
        {
          error: "Member already checked in",
          checkInTime: existingCheckIn.checkInTime,
        },
        { status: 409 }
      );
    }

    // Create check-in log
    const [checkIn] = await db.insert(checkInLogs).values({
      memberId: member.id,
      processedBy: session.user.id,
      notes: notes || null,
    }).returning();

    return NextResponse.json({
      success: true,
      message: "Manual check-in successful",
      member: {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        membershipPlan: member.membershipPlan,
      },
      checkIn: {
        id: checkIn.id,
        checkInTime: checkIn.checkInTime,
      },
    });

  } catch (error) {
    console.error("Error processing manual check-in:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to process manual check-in" },
      { status: 500 }
    );
  }
}