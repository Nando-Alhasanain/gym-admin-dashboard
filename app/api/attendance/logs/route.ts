import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, between, isNull } from "drizzle-orm";
import { db } from "@/db";
import { checkInLogs, members } from "@/db/schema";
import { attendanceQuerySchema } from "@/lib/validations/attendance";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedQuery = attendanceQuerySchema.parse({
      memberId: searchParams.get("memberId"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const { page, limit, memberId, startDate, endDate } = validatedQuery;
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (memberId) {
      conditions.push(eq(checkInLogs.memberId, memberId));
    }

    if (startDate && endDate) {
      conditions.push(
        between(
          checkInLogs.checkInTime,
          new Date(startDate),
          new Date(endDate)
        )
      );
    } else if (startDate) {
      conditions.push(
        eq(checkInLogs.checkInTime, new Date(startDate))
      );
    }

    // Get attendance logs with pagination
    const attendanceLogs = await db.query.checkInLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        member: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [desc(checkInLogs.checkInTime)],
      limit,
      offset,
    });

    // Get total count for pagination
    const totalCount = await db
      .select({ count: checkInLogs.id })
      .from(checkInLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    // Get currently checked-in members
    const currentlyCheckedIn = await db.query.checkInLogs.findMany({
      where: isNull(checkInLogs.checkOutTime),
      with: {
        member: true,
      },
      orderBy: [desc(checkInLogs.checkInTime)],
      limit: 50, // Limit to recent check-ins
    });

    return NextResponse.json({
      data: attendanceLogs,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        pages: Math.ceil(totalCount.length / limit),
      },
      currentlyCheckedIn,
    });
  } catch (error) {
    console.error("Error fetching attendance logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance logs" },
      { status: 500 }
    );
  }
}