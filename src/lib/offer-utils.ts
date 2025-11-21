import type { BasketItem } from "@/types";

export interface Offer {
  id: string;
  name: string;
  description?: string | null;
  quantity: number; // e.g., 2 for "Any 2 for £X"
  price: number; // e.g., £15 for 2 items
  active: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  productIds: string[]; // Products eligible for this offer
}

export interface OfferCalculation {
  offerId: string;
  offerName: string;
  appliedQuantity: number;
  discount: number;
  items: BasketItem[];
}

export interface BasketTotal {
  subtotal: number;
  discounts: number;
  total: number;
  appliedOffers: OfferCalculation[];
}

/**
 * Check if an offer is currently active based on dates
 */
export function isOfferActive(offer: Offer): boolean {
  if (!offer.active) return false;

  const now = new Date();

  if (offer.startDate && new Date(offer.startDate) > now) {
    return false;
  }

  if (offer.endDate && new Date(offer.endDate) < now) {
    return false;
  }

  return true;
}

/**
 * Calculate offers for basket items
 * Applies "Any N for £X" type offers
 */
export function calculateOffers(
  items: BasketItem[],
  offers: Offer[],
): BasketTotal {
  // Filter to active offers only
  const activeOffers = offers.filter(isOfferActive);

  // Group items by product ID and variant ID
  const itemMap = new Map<string, BasketItem>();
  items.forEach((item) => {
    const key = `${item.productId}-${item.variantId || "base"}`;
    if (itemMap.has(key)) {
      const existing = itemMap.get(key)!;
      itemMap.set(key, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      });
    } else {
      itemMap.set(key, { ...item });
    }
  });

  const basketItems = Array.from(itemMap.values());

  // Calculate subtotal (all items at regular price)
  const subtotal = basketItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  let totalDiscount = 0;
  const appliedOffers: OfferCalculation[] = [];

  // Process each offer
  for (const offer of activeOffers) {
    // Get items eligible for this offer
    const eligibleItems = basketItems.filter((item) =>
      offer.productIds.includes(item.productId),
    );

    if (eligibleItems.length === 0) continue;

    // Calculate total quantity of eligible items
    const totalEligibleQuantity = eligibleItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    // Calculate how many times this offer can be applied
    const offerMultiplier = Math.floor(totalEligibleQuantity / offer.quantity);

    if (offerMultiplier === 0) continue;

    // Calculate the discount
    // For "Any 2 for £15", if we have 2 items worth £20 total, discount is £5
    // We need to calculate the cheapest way to apply the offer
    const itemsUsedInOffer = offerMultiplier * offer.quantity;

    // Sort items by price (lowest first) to maximize discount
    const sortedEligibleItems = [...eligibleItems].sort(
      (a, b) => a.price - b.price,
    );

    let remainingQuantity = itemsUsedInOffer;
    let originalPriceForOffer = 0;

    for (const item of sortedEligibleItems) {
      const quantityToUse = Math.min(remainingQuantity, item.quantity);
      originalPriceForOffer += item.price * quantityToUse;
      remainingQuantity -= quantityToUse;
      if (remainingQuantity <= 0) break;
    }

    // Discounted price
    const discountedPrice = offer.price * offerMultiplier;

    // Calculate discount
    const discount = originalPriceForOffer - discountedPrice;

    if (discount > 0) {
      totalDiscount += discount;
      appliedOffers.push({
        offerId: offer.id,
        offerName: offer.name,
        appliedQuantity: itemsUsedInOffer,
        discount,
        items: eligibleItems,
      });
    }
  }

  const total = subtotal - totalDiscount;

  return {
    subtotal,
    discounts: totalDiscount,
    total: Math.max(0, total), // Ensure total is never negative
    appliedOffers,
  };
}

/**
 * Calculate discounted price per item when offers are applied
 * Returns a map of item keys to their discounted price and offer ID
 */
export function calculateDiscountedPrices(
  items: BasketItem[],
  offers: Offer[],
): Map<string, { price: number; offerId: string | null }> {
  const result = new Map<string, { price: number; offerId: string | null }>();

  // Filter to active offers only
  const activeOffers = offers.filter(isOfferActive);

  // Group items by product ID and variant ID
  const itemMap = new Map<string, BasketItem>();
  items.forEach((item) => {
    const key = `${item.productId}-${item.variantId || "base"}`;
    if (itemMap.has(key)) {
      const existing = itemMap.get(key)!;
      itemMap.set(key, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      });
    } else {
      itemMap.set(key, { ...item });
    }
  });

  const basketItems = Array.from(itemMap.values());

  // Initialize all items with their original price and no offer
  basketItems.forEach((item) => {
    const key = `${item.productId}-${item.variantId || "base"}`;
    result.set(key, { price: item.price, offerId: null });
  });

  // Process each offer
  for (const offer of activeOffers) {
    // Get items eligible for this offer
    const eligibleItems = basketItems.filter((item) =>
      offer.productIds.includes(item.productId),
    );

    if (eligibleItems.length === 0) continue;

    // Calculate total quantity of eligible items
    const totalEligibleQuantity = eligibleItems.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    // Calculate how many times this offer can be applied
    const offerMultiplier = Math.floor(totalEligibleQuantity / offer.quantity);

    if (offerMultiplier === 0) continue;

    // Calculate the discount
    const itemsUsedInOffer = offerMultiplier * offer.quantity;

    // Sort items by price (lowest first) to maximize discount
    const sortedEligibleItems = [...eligibleItems].sort(
      (a, b) => a.price - b.price,
    );

    // Calculate original price for items in offer
    let remainingQuantity = itemsUsedInOffer;
    let originalPriceForOffer = 0;
    const itemQuantitiesUsed: Array<{ item: BasketItem; quantity: number }> = [];

    for (const item of sortedEligibleItems) {
      const quantityToUse = Math.min(remainingQuantity, item.quantity);
      originalPriceForOffer += item.price * quantityToUse;
      itemQuantitiesUsed.push({ item, quantity: quantityToUse });
      remainingQuantity -= quantityToUse;
      if (remainingQuantity <= 0) break;
    }

    // Discounted price for the offer
    const discountedPrice = offer.price * offerMultiplier;

    // Calculate discount
    const discount = originalPriceForOffer - discountedPrice;

    if (discount > 0) {
      // Distribute the discount proportionally across items in the offer
      // Calculate effective price per unit for items in the offer
      const effectivePricePerUnit = discountedPrice / itemsUsedInOffer;

      // Update prices for items that are part of the offer
      for (const { item, quantity } of itemQuantitiesUsed) {
        const key = `${item.productId}-${item.variantId || "base"}`;
        const existing = result.get(key)!;

        // Calculate how much of this item's quantity is in the offer
        const quantityInOffer = quantity;
        const quantityNotInOffer = item.quantity - quantityInOffer;

        // Calculate weighted average price
        // Use existing.price (which may already be discounted) for items not in this offer
        const priceInOffer = effectivePricePerUnit;
        const priceNotInOffer = existing.price;

        // If all items are in the offer, use the discounted price
        // Otherwise, calculate weighted average
        const newPrice =
          quantityNotInOffer > 0
            ? (priceInOffer * quantityInOffer +
                priceNotInOffer * quantityNotInOffer) /
              item.quantity
            : priceInOffer;

        // Only apply discount if it results in a lower price (best offer wins)
        if (newPrice < existing.price) {
          result.set(key, { price: newPrice, offerId: offer.id });
        }
      }
    }
  }

  return result;
}
