import { NextResponse } from "next/server";
import { getProducts } from "@/lib/actions";

export async function GET() {
  try {
    const products = await getProducts(true); // Include hidden products for admin
    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
