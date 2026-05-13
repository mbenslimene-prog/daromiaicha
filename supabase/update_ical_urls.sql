-- Mise à jour des URLs iCal — à exécuter dans l'éditeur SQL Supabase
-- Jolie Maison (slug: dar-omi-aicha-moderne)
UPDATE properties SET
  airbnb_ical_url  = 'https://www.airbnb.fr/calendar/ical/1186279764933082101.ics?t=6d453672b7274943863a6be0902bd153',
  booking_ical_url = 'https://ical.booking.com/v1/export?t=774725b1-0d5b-43e8-8121-548568563cc1'
WHERE slug = 'dar-omi-aicha-moderne';

-- Maison Cosy (slug: dar-omi-aicha-cosy)
UPDATE properties SET
  airbnb_ical_url  = 'https://www.airbnb.fr/calendar/ical/1459350478849178276.ics?t=9c283d4aab9c4bdfbec1436e536c087a',
  booking_ical_url = 'https://ical.booking.com/v1/export?t=2839f53e-7e1c-455f-b1b6-eec7f8894f49'
WHERE slug = 'dar-omi-aicha-cosy';

-- Vérification
SELECT slug, airbnb_ical_url, booking_ical_url FROM properties ORDER BY slug;
