-- ============================================================
-- Schéma de base de données – Dar Omi Aicha
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ============================================================

-- 1. Table des propriétés
CREATE TABLE IF NOT EXISTS properties (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug                text UNIQUE NOT NULL,
  title               text NOT NULL,
  type                text NOT NULL DEFAULT 'Maison entière',
  description         text,
  capacity_guests     int  NOT NULL DEFAULT 2,
  capacity_bedrooms   int  NOT NULL DEFAULT 1,
  capacity_bathrooms  int  NOT NULL DEFAULT 1,
  size_m2             int,
  beds_breakdown      text,
  price_per_night_weekday  decimal(10,2) NOT NULL,
  price_per_night_weekend  decimal(10,2) NOT NULL,
  rating              decimal(2,1),
  review_count        int DEFAULT 0,
  photos              text[] DEFAULT '{}',
  amenities           text[] DEFAULT '{}',
  airbnb_ical_url     text,
  booking_ical_url    text,
  host_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  active              boolean DEFAULT true,
  created_at          timestamptz DEFAULT now()
);

-- 2. Table des réservations
CREATE TABLE IF NOT EXISTS bookings (
  id                          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id                 uuid REFERENCES properties(id) ON DELETE CASCADE,
  guest_name                  text NOT NULL,
  guest_email                 text NOT NULL,
  guest_phone                 text,
  check_in                    date NOT NULL,
  check_out                   date NOT NULL,
  nights                      int  NOT NULL,
  total_amount                decimal(10,2) NOT NULL,
  deposit_amount              decimal(10,2) NOT NULL,
  status                      text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  stripe_payment_intent_id    text,
  stripe_session_id           text,
  source                      text DEFAULT 'direct' CHECK (source IN ('direct','airbnb','booking')),
  created_at                  timestamptz DEFAULT now()
);

-- 3. Table des dates bloquées (sync iCal)
CREATE TABLE IF NOT EXISTS blocked_dates (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id  uuid REFERENCES properties(id) ON DELETE CASCADE,
  start_date   date NOT NULL,
  end_date     date NOT NULL,
  source       text NOT NULL,
  external_uid text,
  created_at   timestamptz DEFAULT now()
);

-- 4. Index utiles
CREATE INDEX IF NOT EXISTS bookings_property_id_idx    ON bookings(property_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx         ON bookings(status);
CREATE INDEX IF NOT EXISTS blocked_dates_property_idx  ON blocked_dates(property_id);
CREATE INDEX IF NOT EXISTS blocked_dates_dates_idx     ON blocked_dates(start_date, end_date);

-- 5. Row Level Security (lecture publique des propriétés)
ALTER TABLE properties   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- Propriétés : lecture publique
CREATE POLICY "properties_public_read"
  ON properties FOR SELECT USING (active = true);

-- Blocked dates : lecture publique (pour le calendrier)
CREATE POLICY "blocked_dates_public_read"
  ON blocked_dates FOR SELECT USING (true);

-- Réservations : insertion publique (pour la réservation en ligne)
-- La lecture/modification passe par la service role key (admin/webhook)
CREATE POLICY "bookings_public_insert"
  ON bookings FOR INSERT WITH CHECK (true);

-- 6. Données initiales (les deux biens)
INSERT INTO properties (slug, title, type, description, capacity_guests, capacity_bedrooms, capacity_bathrooms, size_m2, beds_breakdown, price_per_night_weekday, price_per_night_weekend, rating, review_count, photos, amenities)
VALUES
(
  'dar-omi-aicha-moderne',
  'Dar Omi Aicha – Moderne',
  'Maison entière',
  'Une villa au design contemporain, inondée de lumière naturelle. Profitez de ses grands espaces ouverts, de sa terrasse vue sur mer et de son accès direct à la plage de Kerkouane. À deux pas du site archéologique punique classé UNESCO.',
  6, 3, 2, NULL, '4 lits dont 1 double, 2 simples et 1 canapé-lit', 100.00, 120.00, NULL, 0,
  ARRAY['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1600'],
  ARRAY['Wi-Fi haut débit','Climatisation','Parking privé','Accès plage','Terrasse soleil','Jardin','Barbecue','Cuisine équipée','Machine à laver','Smart TV']
),
(
  'dar-omi-aicha-cosy',
  'Maison moderne bord de mer – Kerkouane',
  'Maison entière',
  'Bienvenue dans notre petite maison de bord de mer à Kerkouane, un coin secret et paisible de la côte tunisienne. Située à seulement 100 mètres de la plage, cette maison au style moderne et oriental est parfaite pour un séjour relaxant en couple, entre amis ou en famille. Cuisine excellemment équipée, salon lumineux, douche à l''italienne. À deux pas des ruines de Kerkouane (UNESCO), dans un quartier paisible. Confort, calme et dépaysement garantis.',
  4, 2, 1, 120, '3 lits dont 1 double et 2 simples', 80.00, 90.00, 5.0, 6,
  ARRAY['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600'],
  ARRAY['Wi-Fi','Climatisation (chambres + salon)','Parking','Vue jardin','100m de la plage','Cuisine équipée','Salon lumineux','Douche à l''italienne','Smart TV','Enfants bienvenus (-12 ans)']
)
ON CONFLICT (slug) DO NOTHING;
