import { NextRequest, NextResponse } from 'next/server';
import { db, sales, saleItems, products, members } from '@/db';
import { eq, desc, and, lte, gte, sql } from 'drizzle-orm';
import {
  createSaleSchema,
  type CreateSaleRequest
} from '@/lib/types/gym';

// GET /api/sales - List all sales with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const date = searchParams.get('date');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      conditions.push(
        gte(sales.createdAt, startDate),
        lte(sales.createdAt, endDate)
      );
    }

    if (status) {
      conditions.push(eq(sales.paymentStatus, status));
    }

    // Query sales with details
    const salesData = await db
      .select({
        id: sales.id,
        saleNumber: sales.saleNumber,
        memberId: sales.memberId,
        totalAmount: sales.totalAmount,
        discountAmount: sales.discountAmount,
        finalAmount: sales.finalAmount,
        paymentMethod: sales.paymentMethod,
        paymentStatus: sales.paymentStatus,
        staffId: sales.staffId,
        notes: sales.notes,
        createdAt: sales.createdAt,
        updatedAt: sales.updatedAt,
        member: {
          id: members.id,
          firstName: members.firstName,
          lastName: members.lastName,
          email: members.email
        },
        staff: {
          id: members.id,
          firstName: members.firstName,
          lastName: members.lastName
        }
      })
      .from(sales)
      .leftJoin(members, eq(sales.memberId, members.id))
      .leftJoin(members, eq(sales.staffId, members.id))
      .where(
        conditions.length > 0 ? conditions.reduce((acc, condition) => acc ? and(acc, condition) : condition) : undefined
      )
      .orderBy(desc(sales.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sales.id })
      .from(sales)
      .where(
        conditions.length > 0 ? conditions.reduce((acc, condition) => acc ? and(acc, condition) : condition) : undefined
      );

    // Get sale items for each sale
    const salesWithItems = await Promise.all(
      salesData.map(async (sale) => {
        const items = await db
          .select({
            id: saleItems.id,
            productId: saleItems.productId,
            quantity: saleItems.quantity,
            unitPrice: saleItems.unitPrice,
            totalPrice: saleItems.totalPrice,
            product: {
              id: products.id,
              name: products.name,
              sku: products.sku
            }
          })
          .from(saleItems)
          .innerJoin(products, eq(saleItems.productId, products.id))
          .where(eq(saleItems.saleId, sale.id));

        return {
          ...sale,
          items
        };
      })
    );

    return NextResponse.json({
      sales: salesWithItems,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

// POST /api/sales - Create a new sale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = createSaleSchema.parse(body);

    // Generate unique sale number
    const saleNumber = `SALE${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Validate all products exist and have sufficient stock
    for (const item of validatedData.items) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product) {
        return NextResponse.json(
          { error: `Product with ID ${item.productId} not found` },
          { status: 404 }
        );
      }

      if (!product.isActive) {
        return NextResponse.json(
          { error: `Product ${product.name} is not active` },
          { status: 400 }
        );
      }

      if (product.stockQuantity < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}` },
          { status: 400 }
        );
      }
    }

    // Use a transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      // Create the sale
      const [newSale] = await tx
        .insert(sales)
        .values({
          saleNumber,
          memberId: validatedData.memberId,
          totalAmount: validatedData.totalAmount,
          discountAmount: validatedData.discountAmount,
          finalAmount: validatedData.finalAmount,
          paymentMethod: validatedData.paymentMethod,
          paymentStatus: validatedData.paymentStatus,
          staffId: validatedData.staffId,
          notes: validatedData.notes,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Create sale items and update stock
      const createdItems = await Promise.all(
        validatedData.items.map(async (item) => {
          // Create sale item
          const [saleItem] = await tx
            .insert(saleItems)
            .values({
              saleId: newSale.id,
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice
            })
            .returning();

          // Update product stock
          const [updatedProduct] = await tx
            .update(products)
            .set({
              stockQuantity: sql`${products.stockQuantity} - ${item.quantity}`,
              updatedAt: new Date()
            })
            .where(eq(products.id, item.productId))
            .returning();

          return {
            ...saleItem,
            product: updatedProduct
          };
        })
      );

      return { sale: newSale, items: createdItems };
    });

    return NextResponse.json({
      message: 'Sale created successfully',
      sale: result.sale,
      items: result.items
    }, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }

    console.error('Error creating sale:', error);
    return NextResponse.json(
      { error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}