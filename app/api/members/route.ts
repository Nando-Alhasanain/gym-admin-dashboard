import { NextRequest, NextResponse } from "next/server";
import { eq, and, ilike, desc } from "drizzle-orm";
import { db } from "@/db";
import { members, membershipPlans } from "@/db/schema";
import { createMemberSchema, updateMemberSchema, memberIdSchema } from "@/lib/validations/member";
import { nanoid } from "nanoid";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive");

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        and(
          ilike(members.firstName, `%${search}%`),
          ilike(members.lastName, `%${search}%`)
        )
      );
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(members.isActive, isActive === "true"));
    }

    // Get members with pagination
    const membersData = await db.query.members.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        membershipPlan: true,
      },
      orderBy: [desc(members.createdAt)],
      limit,
      offset,
    });

    // Get total count for pagination
    const totalCount = await db
      .select({ count: members.id })
      .from(members)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return NextResponse.json({
      data: membersData,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        pages: Math.ceil(totalCount.length / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createMemberSchema.parse(body);

    // Generate unique QR code
    const qrCodeValue = nanoid(16);

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(qrCodeValue);

    const [newMember] = await db.insert(members).values({
      ...validatedData,
      qrCode: qrCodeValue,
    }).returning();

    return NextResponse.json({
      ...newMember,
      qrCodeImage, // Include QR code image for immediate display
    });
  } catch (error) {
    console.error("Error creating member:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid input data", details: error },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}