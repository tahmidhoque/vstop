"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/store/ProductCard";
import Basket from "@/components/store/Basket";
import { getProducts, getOffers } from "@/lib/actions";
import type { BasketItem } from "@/types";
import type { Offer } from "@/lib/offer-utils";
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { useSnackbar } from '@/components/common/SnackbarProvider';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function StorePageClient() {
  const [products, setProducts] = useState<
    Array<{
      id: string;
      name: string;
      price: number;
      stock: number;
      variants?: Array<{ id: string; flavour: string; stock: number }>;
      offers?: Array<{
        id: string;
        name: string;
        description?: string | null;
        quantity: number;
        price: number;
        active: boolean;
      }>;
    }>
  >([]);
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    // Load products and offers
    async function loadData() {
      try {
        const [productsData, offersData] = await Promise.all([
          getProducts(),
          getOffers(),
        ]);

        setProducts(
          productsData.map(
            (p: {
              id: string;
              name: string;
              price: number;
              stock: number;
              variants?: Array<{ id: string; flavour: string; stock: number }>;
              offers?: Array<{
                id: string;
                name: string;
                description?: string | null;
                quantity: number;
                price: number;
                active: boolean;
              }>;
            }) => ({
              id: p.id,
              name: p.name,
              price: Number(p.price),
              stock: p.stock,
              variants: p.variants?.map((v) => ({
                id: v.id,
                flavour: v.flavour,
                stock: v.stock,
              })),
              offers: p.offers || [],
            }),
          ),
        );

        setOffers(offersData);
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();

    // Load basket from localStorage
    const savedBasket = localStorage.getItem("basket");
    if (savedBasket) {
      try {
        setBasket(JSON.parse(savedBasket));
      } catch (err) {
        console.error("Failed to load basket:", err);
      }
    }

    // Show success message if order was placed
    if (searchParams.get("success") === "true") {
      localStorage.removeItem("basket");
      setBasket([]);
      showSnackbar("Order placed successfully!", "success");
      router.replace("/store");
    }
  }, [router, searchParams, showSnackbar]);

  useEffect(() => {
    // Sync basket with products to update stock
    setBasket((currentBasket) => {
      return currentBasket
        .map((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) return null;

          // If item has a variant, find and use variant stock
          if (item.variantId && product.variants) {
            const variant = product.variants.find(
              (v) => v.id === item.variantId,
            );
            if (variant) {
              return {
                ...item,
                stock: variant.stock,
                price: product.price,
                quantity: Math.min(item.quantity, variant.stock),
              };
            }
          }

          // Use base product stock or sum of variant stocks
          const stock =
            product.variants && product.variants.length > 0
              ? product.variants.reduce((sum, v) => sum + v.stock, 0)
              : product.stock;

          return {
            ...item,
            stock,
            price: product.price,
            quantity: Math.min(item.quantity, stock),
          };
        })
        .filter((item): item is BasketItem => item !== null);
    });
  }, [products]);

  useEffect(() => {
    // Save basket to localStorage
    if (basket.length > 0) {
      localStorage.setItem("basket", JSON.stringify(basket));
    } else {
      localStorage.removeItem("basket");
    }
  }, [basket]);

  const handleAddToBasket = (item: BasketItem) => {
    setBasket((current) => {
      // Find existing item - match by productId and variantId
      const existing = current.find(
        (i) => i.productId === item.productId && i.variantId === item.variantId,
      );
      if (existing) {
        return current.map((i) =>
          i.productId === item.productId && i.variantId === item.variantId
            ? {
                ...i,
                quantity: Math.min(i.quantity + 1, i.stock),
              }
            : i,
        );
      }
      return [...current, item];
    });
  };

  const handleUpdateQuantity = (
    productId: string,
    quantity: number,
    variantId?: string,
  ) => {
    if (quantity === 0) {
      handleRemove(productId, variantId);
      return;
    }
    setBasket((current) =>
      current.map((item) =>
        item.productId === productId && item.variantId === variantId
          ? { ...item, quantity }
          : item,
      ),
    );
  };

  const handleRemove = (productId: string, variantId?: string) => {
    setBasket((current) =>
      current.filter(
        (item) =>
          !(item.productId === productId && item.variantId === variantId),
      ),
    );
  };

  const handleCheckout = () => {
    router.push("/store/checkout");
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading products..." />;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: { xs: 10, md: 0 }, overflowX: 'hidden' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 0 }}>
        <Box sx={{ flexGrow: 1, width: '100%', overflowX: 'hidden' }}>
          <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, md: 4 } }}>
            <Typography variant="h4" component="h1" fontWeight={700} gutterBottom sx={{ mb: { xs: 2, sm: 3 } }}>
              Products
            </Typography>
            {products.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: { xs: 8, sm: 12 } }}>
                <Typography variant="body1" color="text.secondary">
                  No products available
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mx: 0 }}>
                {products.map((product) => (
                  <Grid item xs={12} sm={6} lg={4} key={product.id} sx={{ width: '100%' }}>
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      stock={product.stock}
                      variants={product.variants}
                      offers={product.offers || []}
                      onAddToBasket={handleAddToBasket}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Container>
        </Box>
        <Basket
          items={basket}
          offers={offers}
          onUpdateQuantity={handleUpdateQuantity}
          onRemove={handleRemove}
          onCheckout={handleCheckout}
        />
      </Box>
    </Box>
  );
}
