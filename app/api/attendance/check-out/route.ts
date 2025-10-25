import { NextRequest, NextResponse } from "next/server";
import { eq, and, isNull } from "drizzle-orm";
import { db } from "@/db";
import { checkInLogs } from "@/db/schema";
import { checkOutSchema } from "@/lib/validations/attendance";
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
    const { checkInId, notes } = checkOutSchema.parse(body);

    // Find active check-in
    const existingCheckIn = await db.query.checkInLogs.findFirst({
      where: and(
        eq(checkInLogs.id, checkInId),
        isNull(checkInLogs.checkOutTime)
      ),
    });

    if (!existingCheckIn) {
      return NextResponse.json(
        { error: "Active check-in not found or already checked out" },
        { status: 404 }
      );
    }

    // Update check-in with check-out time
    const [updatedCheckIn] = await db
      .update(checkInLogs)
      .set({
        checkOutTime: new Date(),
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(checkInLogs.id, checkInId))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Check-out successful",
      checkIn: {
        id: updatedCheckIn.id,
        checkInTime: updatedCheckIn.checkInTime,
        checkOutTime: updatedCheckIn.checkOutTime,
      },
    });

  } catch (error) {
    console.error("Error processing check-out:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to process check-out" },
      { status: 500 }
    );
  }
}