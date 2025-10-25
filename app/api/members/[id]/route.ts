import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { members } from "@/db/schema";
import { updateMemberSchema, memberIdSchema } from "@/lib/validations/member";
import QRCode from "qrcode";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = memberIdSchema.parse(params);

    const member = await db.query.members.findFirst({
      where: eq(members.id, id),
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

    // Generate QR code image on the fly
    const qrCodeImage = await QRCode.toDataURL(member.qrCode);

    return NextResponse.json({
      ...member,
      qrCodeImage,
    });
  } catch (error) {
    console.error("Error fetching member:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid member ID" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch member" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = memberIdSchema.parse(params);
    const body = await request.json();
    const validatedData = updateMemberSchema.parse({ ...body, id });

    const [updatedMember] = await db
      .update(members)
      .set({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        membershipPlanId: validatedData.membershipPlanId || null,
        isActive: validatedData.isActive,
        updatedAt: new Date(),
      })
      .where(eq(members.id, id))
      .returning();

    if (!updatedMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedMember);
  } catch (error) {
    console.error("Error updating member:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = memberIdSchema.parse(params);

    const [deletedMember] = await db
      .delete(members)
      .where(eq(members.id, id))
      .returning();

    if (!deletedMember) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Member deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting member:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid member ID" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 }
    );
  }
}