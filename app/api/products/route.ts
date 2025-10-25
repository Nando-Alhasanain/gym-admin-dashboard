import { NextRequest, NextResponse } from 'next/server';
import { db, products } from '@/db';
import { eq, desc, and, ilike, lte } from 'drizzle-orm';
import {
  createProductSchema,
  updateProductSchema
} from '@/lib/types/gym';

// GET /api/products - List all products with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const lowStock = searchParams.get('lowStock') === 'true';
    const isActive = searchParams.get('isActive');

    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        ilike(products.name, `%${search}%`),
        ilike(products.description, `%${search}%`),
        ilike(products.sku, `%${search}%`)
      );
    }

    if (category) {
      conditions.push(eq(products.category, category));
    }

    if (lowStock) {
      conditions.push(
        lte(products.stockQuantity, products.minStockLevel)
      );
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(products.isActive, isActive === 'true'));
    }

    // Query products
    const productsData = await db
      .select()
      .from(products)
      .where(
        conditions.length > 0 ? conditions.reduce((acc, condition) => acc ? and(acc, condition) : condition) : undefined
      )
      .orderBy(desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count for pagination
    const totalCount = await db
      .select({ count: products.id })
      .from(products)
      .where(
        conditions.length > 0 ? conditions.reduce((acc, condition) => acc ? and(acc, condition) : condition) : undefined
      );

    return NextResponse.json({
      products: productsData,
      pagination: {
        page,
        limit,
        total: totalCount.length,
        totalPages: Math.ceil(totalCount.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = createProductSchema.parse(body);

    // Check if SKU already exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.sku, validatedData.sku))
      .limit(1);

    if (existingProduct) {
      return NextResponse.json(
        { error: 'SKU already exists' },
        { status: 409 }
      );
    }

    // Insert new product
    const [newProduct] = await db
      .insert(products)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return NextResponse.json(
      { message: 'Product created successfully', product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }

    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}