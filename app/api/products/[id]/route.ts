import { NextRequest, NextResponse } from 'next/server';
import { db, products } from '@/db';
import { eq } from 'drizzle-orm';
import { updateProductSchema } from '@/lib/types/gym';

// GET /api/products/[id] - Get a specific product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if stock is low
    const isLowStock = product.stockQuantity <= product.minStockLevel;

    return NextResponse.json({
      ...product,
      isLowStock
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Update a product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validatedData = updateProductSchema.parse(body);

    // Check if product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if SKU already exists (if SKU is being updated)
    if (validatedData.sku && validatedData.sku !== existingProduct.sku) {
      const [skuCheck] = await db
        .select()
        .from(products)
        .where(eq(products.sku, validatedData.sku))
        .limit(1);

      if (skuCheck) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 409 }
        );
      }
    }

    // Update product
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(products.id, productId))
      .returning();

    // Check if stock is low
    const isLowStock = updatedProduct.stockQuantity <= updatedProduct.minStockLevel;

    return NextResponse.json({
      message: 'Product updated successfully',
      product: {
        ...updatedProduct,
        isLowStock
      }
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error },
        { status: 400 }
      );
    }

    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Delete a product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Check if product exists
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Soft delete by deactivating
    const [deactivatedProduct] = await db
      .update(products)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(products.id, productId))
      .returning();

    return NextResponse.json({
      message: 'Product deactivated successfully',
      product: deactivatedProduct
    });
  } catch (error) {
    console.error('Error deactivating product:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate product' },
      { status: 500 }
    );
  }
}