-- ==============================================================================
-- AI PRINTING SOLUTIONS — SEED DATA SCRIPT
-- ==============================================================================

-- 1. SEED SITE SETTINGS
INSERT INTO public.site_settings (key, value)
VALUES 
    ('general', '{
        "siteName": "Ai Printing Solutions",
        "tagline": "Commercial printing in Sri Lanka — pre-press to fulfilment",
        "address": "11/A Gangarama Rd, Werahara, Boralesgamuwa, Sri Lanka",
        "hotline": "077 323 3533",
        "landline": "011 215 0859",
        "whatsapp": "+94 77 323 3533",
        "email": "contactus@aiprintingsolutions.com",
        "artworkEmail": "digital4ai@gmail.com",
        "hoursWeekday": "Mon–Fri: 8.30 AM – 5.00 PM",
        "hoursSaturday": "Saturday: 8.30 AM – 1.00 PM",
        "hoursSunday": "Sunday: Closed",
        "deliveryFee": 400,
        "announcementText": "Island-wide delivery in 1–2 days · Free proofing check on all orders"
    }'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. SEED CATEGORIES (10)
INSERT INTO public.categories (id, slug, name, description, image_url, sort_order, is_active)
VALUES
    ('cat-visiting-cards', 'visiting-cards', 'Visiting Cards', 'Premium business cards in 9 speciality boards', 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80', 1, true),
    ('cat-bill-books', 'bill-books', 'Bill Books', 'Custom NCR carbonless invoice, cash receipt, and delivery challan books', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80', 2, true),
    ('cat-leaflets', 'leaflets', 'Leaflets', 'Vibrant promotional flyers and marketing leaflets on premium art paper', 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80', 3, true),
    ('cat-invitations', 'invitations', 'Invitations', 'Elegant wedding, corporate gala, and celebration cards', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80', 4, true),
    ('cat-letterheads', 'letterheads', 'Letterheads', 'Professional corporate stationery printed on laser-compatible offset bond', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80', 5, true),
    ('cat-posters', 'posters', 'Posters', 'High-impact full-colour posters in A3, A2, and bespoke formats', 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80', 6, true),
    ('cat-stickers', 'stickers', 'Stickers', 'Die-cut product labels and barcode stickers (coming soon)', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', 7, true),
    ('cat-certificates', 'certificates', 'Certificates', 'Official diploma and award certificates on thick parchment stock', 'https://images.unsplash.com/photo-1589330694653-dad6bc01cf0f?auto=format&fit=crop&w=600&q=80', 8, true),
    ('cat-black-laser', 'black-laser-printouts', 'Black Laser Printouts', 'Crisp monochrome high-speed digital laser printing', 'https://images.unsplash.com/photo-1562564055-71e051d33c19?auto=format&fit=crop&w=600&q=80', 9, true),
    ('cat-colour-print', 'colour-print-outs', 'Colour Print Outs', 'Photographic quality digital laser colour outputs up to A3+', 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80', 10, true)
ON CONFLICT (id) DO NOTHING;

-- 3. SEED INITIAL PRODUCTS
INSERT INTO public.products (id, slug, name, short_description, long_description, category_id, base_price, is_variable, is_featured, is_hot, delivery_note, size_note, is_active, sort_order)
VALUES
    ('prod-vc-double', 'double-sided-visiting-cards', 'Double Sided Visiting Cards', 'Full colour printing on both sides on 9 luxury imported paper boards.', 'Make an unforgettable impression with high definition commercial grade double-sided visiting cards.', 'cat-visiting-cards', 1300.00, true, true, true, 'Island-wide delivery within 1–2 days, Rs. 400 extra.', 'Card sizes 90 × 50 mm or 90 × 55 mm.', true, 1),
    ('prod-vc-single', 'single-sided-visiting-cards', 'Single Sided Visiting Cards', 'Classic sharp front-only commercial print with clean unprinted back.', 'Economical yet exceptionally sharp business cards printed on premium art boards.', 'cat-visiting-cards', 1000.00, true, true, true, 'Island-wide delivery within 1–2 days, Rs. 400 extra.', 'Standard 90 × 50 mm or 90 × 55 mm.', true, 2),
    ('prod-bill-ncr', 'carbonized-ncr-bill-books', 'Carbonized (NCR) Bill Books', 'Multi-part carbonless duplicate & triplicate books with perforations and sequential numbering.', 'No messy carbon paper needed! Clean chemical transfer paper.', 'cat-bill-books', 3500.00, true, true, false, 'Island-wide delivery within 2–3 days, Rs. 400 extra.', 'A4, A5, or 1/3 A4 standard formats.', true, 3),
    ('prod-letterheads', 'letter-heads', 'Letter Heads', 'Corporate stationery on 80gsm/100gsm executive bond compatible with laser printers.', 'Establish your brand credibility with sharp corporate letterheads.', 'cat-letterheads', 100.00, true, true, true, 'Island-wide delivery within 1–2 days, Rs. 400 extra.', 'A4 size (210 × 297 mm).', true, 4)
ON CONFLICT (id) DO NOTHING;
