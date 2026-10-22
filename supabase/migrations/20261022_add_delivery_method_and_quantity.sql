-- Migration: Add Customer Pickup and Quantity-Based Delivery support
-- Adds delivery_method and total_quantity columns to public.orders table

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_method TEXT NOT NULL DEFAULT 'delivery';

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS total_quantity INTEGER NOT NULL DEFAULT 1;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.delivery_method IS 'Delivery method: "delivery" (courier) or "pickup" (customer collection)';
COMMENT ON COLUMN public.orders.total_quantity IS 'Total item quantity in the order used for quantity-based delivery charge calculation';
