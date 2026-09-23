-- ==============================================================================
-- AI PRINTING SOLUTIONS — SUPABASE POSTGRESQL SCHEMA
-- Commercial Printing E-Commerce Platform
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY DEFAULT 'cat-' || uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT 'prod-' || uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    short_description TEXT,
    long_description TEXT,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    base_price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_variable BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    is_hot BOOLEAN DEFAULT FALSE,
    delivery_note TEXT DEFAULT 'Island-wide delivery within 1–2 days, Rs. 400 extra.',
    size_note TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PRODUCT IMAGES TABLE
CREATE TABLE IF NOT EXISTS public.product_images (
    id TEXT PRIMARY KEY DEFAULT 'img-' || uuid_generate_v4(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE
);

-- 4. OPTION GROUPS TABLE (e.g. Paper, Quantity, Copies)
CREATE TABLE IF NOT EXISTS public.option_groups (
    id TEXT PRIMARY KEY DEFAULT 'grp-' || uuid_generate_v4(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    input_type TEXT NOT NULL CHECK (input_type IN ('select', 'radio')),
    is_required BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);

-- 5. OPTION VALUES TABLE
CREATE TABLE IF NOT EXISTS public.option_values (
    id TEXT PRIMARY KEY DEFAULT 'opt-' || uuid_generate_v4(),
    option_group_id TEXT NOT NULL REFERENCES public.option_groups(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- 6. PRICE MATRIX TABLE
-- Generates distinct prices for options (e.g. 9 paper options × 14 quantity options = 126 cells)
CREATE TABLE IF NOT EXISTS public.price_matrix (
    id TEXT PRIMARY KEY DEFAULT 'pm-' || uuid_generate_v4(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    option_value_a TEXT NOT NULL REFERENCES public.option_values(id) ON DELETE CASCADE,
    option_value_b TEXT REFERENCES public.option_values(id) ON DELETE CASCADE,
    price NUMERIC(12, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT uq_product_option_matrix UNIQUE (product_id, option_value_a, option_value_b)
);

-- 7. ADDONS TABLE (e.g. "Artwork design" +Rs. 500)
CREATE TABLE IF NOT EXISTS public.addons (
    id TEXT PRIMARY KEY DEFAULT 'adn-' || uuid_generate_v4(),
    product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN DEFAULT FALSE,
    description TEXT
);

-- 8. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT 'ord-' || uuid_generate_v4(),
    order_number TEXT UNIQUE NOT NULL, -- e.g. AIP-2026-0142
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    delivery_fee NUMERIC(12, 2) NOT NULL DEFAULT 400.00,
    addon_total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('payhere', 'bank_transfer', 'cod')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'verification_needed', 'failed')),
    order_status TEXT NOT NULL DEFAULT 'new' CHECK (order_status IN ('new', 'confirmed', 'in_production', 'ready', 'delivered', 'cancelled')),
    bank_slip_url TEXT,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.order_items (
    id TEXT PRIMARY KEY DEFAULT 'item-' || uuid_generate_v4(),
    order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES public.products(id),
    product_name_snapshot TEXT NOT NULL,
    selected_options JSONB NOT NULL DEFAULT '[]'::jsonb,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(12, 2) NOT NULL,
    line_total NUMERIC(12, 2) NOT NULL
);

-- 10. ARTWORK FILES TABLE
CREATE TABLE IF NOT EXISTS public.artwork_files (
    id TEXT PRIMARY KEY DEFAULT 'art-' || uuid_generate_v4(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE CASCADE,
    order_item_id TEXT REFERENCES public.order_items(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. QUOTATIONS TABLE
CREATE TABLE IF NOT EXISTS public.quotations (
    id TEXT PRIMARY KEY DEFAULT 'quote-' || uuid_generate_v4(),
    quote_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    company TEXT,
    product_type TEXT NOT NULL,
    quantity TEXT NOT NULL,
    specifications TEXT NOT NULL,
    deadline DATE,
    attachment_url TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'quoted', 'won', 'lost')),
    admin_notes TEXT,
    quoted_amount NUMERIC(12, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.contact_messages (
    id TEXT PRIMARY KEY DEFAULT 'msg-' || uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. TESTIMONIALS TABLE
CREATE TABLE IF NOT EXISTS public.testimonials (
    id TEXT PRIMARY KEY DEFAULT 'test-' || uuid_generate_v4(),
    customer_name TEXT NOT NULL,
    customer_title TEXT NOT NULL,
    content TEXT NOT NULL,
    avatar_url TEXT,
    rating INTEGER DEFAULT 5,
    is_published BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);

-- 14. CLIENT LOGOS TABLE
CREATE TABLE IF NOT EXISTS public.client_logos (
    id TEXT PRIMARY KEY DEFAULT 'clogo-' || uuid_generate_v4(),
    company_name TEXT NOT NULL,
    logo_url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

-- 15. SITE SETTINGS TABLE (key / jsonb value)
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- STORAGE BUCKETS CONFIGURATION (SQL helper)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES 
    ('product-images', 'product-images', true, 10485760),
    ('site-assets', 'site-assets', true, 10485760),
    ('artwork-uploads', 'artwork-uploads', false, 134217728), -- 128MB limit
    ('quote-attachments', 'quote-attachments', false, 52428800) -- 50MB limit
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artwork_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_logos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- 1. PUBLIC READ POLICIES
CREATE POLICY "Public can view active categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view product images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Public can view option groups" ON public.option_groups FOR SELECT USING (true);
CREATE POLICY "Public can view active option values" ON public.option_values FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active price matrix" ON public.price_matrix FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view addons" ON public.addons FOR SELECT USING (true);
CREATE POLICY "Public can view published testimonials" ON public.testimonials FOR SELECT USING (is_published = true);
CREATE POLICY "Public can view active client logos" ON public.client_logos FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view site settings" ON public.site_settings FOR SELECT USING (true);

-- 2. PUBLIC INSERT POLICIES (Checkout, Quotations, Contact form)
CREATE POLICY "Public can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can create order items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can upload artwork file references" ON public.artwork_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can submit quotations" ON public.quotations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can send contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- 3. ORDERS VIEW POLICY (by phone/email lookup or authenticated user)
CREATE POLICY "Users can view their order by id or email" ON public.orders FOR SELECT 
USING (true);

-- 4. ADMIN POLICIES (Full CRUD for admin_users)
CREATE POLICY "Admin full access on categories" ON public.categories FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
CREATE POLICY "Admin full access on products" ON public.products FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
CREATE POLICY "Admin full access on orders" ON public.orders FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
CREATE POLICY "Admin full access on quotations" ON public.quotations FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
CREATE POLICY "Admin full access on settings" ON public.site_settings FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.admin_users WHERE id = auth.uid()));
