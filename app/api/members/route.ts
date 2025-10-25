import { NextRequest, NextResponse } from 'next/server';
import { db, members, memberMemberships, membershipPlans } from '@/db';
import { eq, and, desc, ilike } from 'drizzle-orm';
import {
  createMemberSchema,
  updateMemberSchema,
  type MemberResponse
} from '@/lib/types/gym';
import QRCode from 'qrcode';
import { nanoid } from 'nanoid';

// GET /api/members - List all members with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];
    if (search) {
      conditions.push(
        ilike(members.firstName, `%${search}%`),
        ilike(members.lastName, `%${search}%`),
        ilike(members.email, `%${search}%`),
        ilike(members.memberId, `%${search}%`)
      );
    }

    // Query members
    const membersData = await db
      .select({
        id: members.id,
        memberId: members.memberId,
        firstName: members.firstName,
        lastName: members.lastName,
        email: members.email,
        phone: members.phone,
        dateOfBirth: members.dateOfBirth,
        gender: members.gender,
        address: members.address,
        emergencyContact: members.emergencyContact,
        emergencyPhone: members.emergencyPhone,
        qrCode: members.qrCode,
        photo: members.photo,
        notes: members.notes,
        createdAt: members.createdAt,
        updatedAt: members.updatedAt
      })
      .from(members)
      .where(
        conditions.length > 0 ? conditions.length === 1 ? conditions[0] : conditions.reduce((acc, condition) => acc ? and(acc, condition) : condition) : undefined
      )
      .orderBy(desc(members.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: members.id })
      .from(members)
      .where(
        conditions.length > 0 ? conditions.length === 1 ? conditions[0] : conditions.reduce((acc, condition) => acc ? and(acc, condition) : condition) : undefined
      );

    return NextResponse.json({
      members: membersData,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// POST /api/members - Create a new member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = createMemberSchema.parse(body);

    // Check if email already exists
    const existingMember = await db
      .select()
      .from(members)
      .where(eq(members.email, validatedData.email))
      .limit(1);

    if (existingMember.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Generate unique member ID and QR code
    const memberId = `GYM${Date.now()}${nanoid(4)}`;
    const qrCodeData = {
      memberId,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email
    };

    const qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData));

    // Insert new member
    const [newMember] = await db
      .insert(members)
      .values({
        ...validatedData,
        memberId,
        qrCode,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return NextResponse.json(
      { message: 'Member created successfully', member: newMember },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }

    console.error('Error creating member:', error);
    return NextResponse.json(
      { error: 'Failed to create member' },
      { status: 500 }
    );
  }
}