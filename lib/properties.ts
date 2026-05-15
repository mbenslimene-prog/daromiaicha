import type { Property } from "./types"

// Photos partagées – plages de Kerkouane et environs
const PLAGES_KERKOUANE = [
  "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTQ1OTM1MDQ3ODg0OTE3ODI3Ng==/original/aabf5844-06c6-4874-9a51-aceaa50c177b.jpeg?im_w=1200",
  "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTE4NjI3OTc2NDkzMzA4MjEwMQ==/original/ac152487-2858-4115-aa88-75c21bde7630.jpeg?im_w=1200",
  "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/5fd17a06-2d71-48ca-a33b-e7a7cda06c32.jpeg?im_w=1200",
  "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/a3d79d2b-c611-4cba-b4fe-f3ab622be1b7.jpeg?im_w=1200",
  "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/3e11b0c5-daf0-4218-87b8-c305a327f36e.jpeg?im_w=1200",
  "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTE4NjI3OTc2NDkzMzA4MjEwMQ%3D%3D/original/1116a0b1-91e8-4337-ba25-02f488903d16.jpeg?im_w=1200",
  "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTE4NjI3OTc2NDkzMzA4MjEwMQ==/original/ab4be381-e768-4996-9514-a223894524e5.jpeg?im_w=1200",
  "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTQ1OTM1MDQ3ODg0OTE3ODI3Ng==/original/f8fe007d-cbf0-4413-bf9e-c3f1db4b9f8d.jpeg?im_w=1200",
  "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTQ1OTM1MDQ3ODg0OTE3ODI3Ng==/original/ce7d39e4-8c9d-4c0b-b6b9-d6bd685b35cc.jpeg?im_w=1200",
]

const PLAGES_AVOISINANTES = [
  "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/efdc7447-50e4-4613-b90c-89c00089cb59.jpeg?im_w=1200",
  "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/d9de3a97-a704-4382-b2a3-216d7d970b67.jpeg?im_w=1200",
  "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/2d3f6ec6-a30d-4320-9637-726ae2307016.jpeg?im_w=1200",
  "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTQ1OTM1MDQ3ODg0OTE3ODI3Ng==/original/fc887d45-9c4d-4c27-976d-bd23dd0ede61.jpeg?im_w=1200",
]

const DESCRIPTION_COMMUNE =
  "Bienvenue dans notre petite maison de bord de mer à Kerkouane, un coin secret et paisible de la côte tunisienne. Située à seulement 100 mètres de la plage, entre Hammam Ghézez et Dar Allouche, cette maison au style moderne et oriental est parfaite pour un séjour relaxant en couple, entre amis ou en famille. Cuisine excellemment équipée, salon lumineux, douche à l'italienne. À deux pas des ruines de Kerkouane (UNESCO), à 10 minutes de Kélibia et El Houaria, dans un quartier paisible. Confort, calme et dépaysement garantis."

const AMENITIES_COMMUNES = [
  "Wi-Fi",
  "Climatisation (chambres + salon)",
  "Parking",
  "Vue jardin",
  "100m de la plage",
  "Cuisine équipée",
  "Salon lumineux",
  "Douche à l'italienne",
  "Smart TV",
  "Enfants bienvenus (-12 ans)",
]

export const PROPERTIES: Property[] = [
  {
    id: "1",
    slug: "dar-omi-aicha-cosy",
    title: "Dar Omi Aicha – Maison Cosy",
    type: "Maison entière",
    description: DESCRIPTION_COMMUNE,
    capacity_guests: 4,
    capacity_bedrooms: 2,
    capacity_bathrooms: 1,
    size_m2: 120,
    beds_breakdown: "3 lits dont 1 double et 2 simples",
    price_per_night_weekday: 80,
    price_per_night_weekend: 90,
    photos: [
      // Hero
      "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTQ1OTM1MDQ3ODg0OTE3ODI3Ng==/original/d3ed2053-87f2-4e13-b620-dd8b0b800532.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/bc09636e-af9f-4077-8271-c7ba200a37ac.jpeg?im_w=960",
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/2f2e9ff9-d357-4d0d-9bef-618044091847.jpeg?im_w=1200",
      // Extérieurs
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/348edec3-4250-4067-bc52-ac8b81f29ac1.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/b20e730e-c920-4b7b-8373-d5a6d30e04f3.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/1c8fd97f-f283-451c-843c-3ded41d22841.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/3612911d-a2f0-41a6-a589-f2f3625b1214.jpeg?im_w=1200",
      // Salon
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/87d73b5d-adec-4ff5-8acb-e08b24f49349.jpeg?im_w=480",
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/71e310b7-87a6-4d15-9a84-215d9e1793f8.jpeg?im_w=480",
      // Espace repas
      "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTE4NjI3OTc2NDkzMzA4MjEwMQ%3D%3D/original/6e74b487-455a-456b-8504-c020154fd37a.jpeg?im_w=1200",
      // Cuisine
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/d3811ad4-eacf-4c44-98d9-2d0ab65cfe8f.jpeg?im_w=480",
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/7fc78e1b-0185-420b-8781-6b82ba472871.jpeg?im_w=480",
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/48175b5c-6994-4a98-bf6b-1c54e52f46fd.jpeg?im_w=1200",
      // Chambres
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/8cb74bf7-81b9-4e9b-8ec5-4bf1d3402ea8.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/f1282432-41ed-4af1-aeb6-c64201010905.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/e21ee128-ffd9-40ed-af27-3c21e608b7e6.jpeg?im_w=1200",
      // Douche & toilette
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/44a70716-89a8-4b29-97d8-279bc30e7861.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/3f90fcb1-89fa-4698-b680-3ed8a4b37450.jpeg?im_w=1200",
      // Plages
      ...PLAGES_KERKOUANE,
      ...PLAGES_AVOISINANTES,
    ],
    amenities: AMENITIES_COMMUNES,
    airbnb_ical_url: "https://www.airbnb.fr/calendar/ical/1459350478849178276.ics?t=9c283d4aab9c4bdfbec1436e536c087a",
    booking_ical_url: "https://ical.booking.com/v1/export?t=2839f53e-7e1c-455f-b1b6-eec7f8894f49",
    active: true,
  },
  {
    id: "2",
    slug: "dar-omi-aicha-moderne",
    title: "Maison Moderne Bord de Mer – Kerkouane",
    type: "Maison entière",
    description: DESCRIPTION_COMMUNE,
    capacity_guests: 4,
    capacity_bedrooms: 2,
    capacity_bathrooms: 1,
    size_m2: 120,
    beds_breakdown: "3 lits dont 1 double et 2 simples",
    price_per_night_weekday: 80,
    price_per_night_weekend: 90,
    rating: 5.0,
    review_count: 6,
    photos: [
      // Hero
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/1c8fd97f-f283-451c-843c-3ded41d22841.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTE4NjI3OTc2NDkzMzA4MjEwMQ==/original/f4ddc483-0ff8-4ee6-8908-1189d7b93df3.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/0d78d42e-0ed0-459d-853b-1f97db7635bc.jpeg?im_w=1200",
      // Extérieur
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/3612911d-a2f0-41a6-a589-f2f3625b1214.jpeg?im_w=1200",
      // Salon
      "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTE4NjI3OTc2NDkzMzA4MjEwMQ==/original/e27edd25-97d0-420c-b12f-42f90ae449c4.jpeg?im_w=720",
      "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTE4NjI3OTc2NDkzMzA4MjEwMQ==/original/4e6e45b8-ea9b-4c6c-a9ee-b32ed5cd1e91.jpeg?im_w=480",
      "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/ad0cb3db-ec68-4feb-92af-65e933a8c2f1.jpeg?im_w=480",
      "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/7a5139e4-005f-46ab-8a61-6c4f975a019c.jpeg?im_w=480",
      "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/a593642d-03c3-420b-8c8f-d9d6ddcd7ebb.jpeg?im_w=480",
      "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/aaaf5dde-941a-4e65-a06f-76536c2234d7.jpeg?im_w=1200",
      // Cuisine
      "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/2cf70921-3239-4f39-a133-c6c600d9f49c.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/7d89b83d-a31e-4598-85be-32556c55b1ea.jpeg?im_w=1200",
      // Espace repas
      "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTE4NjI3OTc2NDkzMzA4MjEwMQ%3D%3D/original/6e74b487-455a-456b-8504-c020154fd37a.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTE4NjI3OTc2NDkzMzA4MjEwMQ==/original/576d913e-e83f-4833-82fd-6d8373c8352f.jpeg?im_w=1200",
      // Chambres
      "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/5ab94fcc-e668-4f84-a024-1215268eac97.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTE4NjI3OTc2NDkzMzA4MjEwMQ==/original/837c0fb0-7881-4bc4-8305-0f58c315dc6c.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/1167179d-2d3a-4927-a8a9-cf68fa22293c.jpeg?im_w=1200",
      // Douche
      "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/c56e4908-f7e9-4f05-8ac7-8c39e82a9eed.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/hosting/Hosting-1186279764933082101/original/37b25977-cd1b-45ac-b4bf-577df70a919f.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/hosting/Hosting-U3RheVN1cHBseUxpc3Rpbmc6MTE4NjI3OTc2NDkzMzA4MjEwMQ==/original/75382e70-d5f1-4877-a58c-2edd6b11bc94.jpeg?im_w=1200",
      // BBQ
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/b20e730e-c920-4b7b-8373-d5a6d30e04f3.jpeg?im_w=1200",
      "https://a0.muscache.com/im/pictures/miso/Hosting-1459350478849178276/original/348edec3-4250-4067-bc52-ac8b81f29ac1.jpeg?im_w=1200",
      // Plages
      ...PLAGES_KERKOUANE,
      ...PLAGES_AVOISINANTES,
    ],
    amenities: AMENITIES_COMMUNES,
    airbnb_ical_url: "https://www.airbnb.fr/calendar/ical/1186279764933082101.ics?t=6d453672b7274943863a6be0902bd153",
    booking_ical_url: "https://ical.booking.com/v1/export?t=774725b1-0d5b-43e8-8121-548568563cc1",
    active: true,
  },
]
