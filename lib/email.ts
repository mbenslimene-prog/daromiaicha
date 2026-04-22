import { Resend } from "resend"
import type { Booking, Property } from "./types"
import type { DateWindow } from "./availability"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const fromEmail = process.env.EMAIL_FROM ?? "reservations@daromiaicha.com"
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

function header() {
  return `
    <div style="background:#4a4e69;padding:32px;text-align:center;">
      <h1 style="color:#d4af37;margin:0;font-size:28px;font-family:Georgia,serif;">Dar Omi Aicha</h1>
      <p style="color:#f4ebd0;margin:8px 0 0;font-size:13px;letter-spacing:2px;">KERKOUANE · CAP BON · TUNISIE</p>
    </div>`
}

function footer() {
  return `
    <div style="background:#f4ebd0;padding:20px 32px;text-align:center;">
      <p style="color:#888;font-size:12px;margin:0;">Kerkouane, Hammam Ghézez, Cap Bon, Tunisie</p>
    </div>`
}

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[email] RESEND_API_KEY non configuré — email ignoré. Destinataire: ${to}`)
    return
  }
  try {
    await resend.emails.send({ from: fromEmail, to, subject, html })
  } catch (err) {
    console.error("[email] Échec d'envoi :", err)
  }
}

// ── Email 1 : Confirmation de réservation ────────────────────────────────────

export async function sendBookingConfirmation(
  booking: Booking,
  property: Property
): Promise<void> {
  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
      ${header()}
      <div style="padding:40px 32px;">
        <h2 style="color:#4a4e69;margin-top:0;">Votre réservation est confirmée !</h2>
        <p style="color:#666;">Bonjour <strong>${booking.guest_name}</strong>,</p>
        <p style="color:#666;">Nous avons bien reçu votre acompte. Voici le récapitulatif de votre séjour :</p>
        <div style="background:#f9f7f1;border-left:4px solid #d4af37;padding:20px 24px;margin:24px 0;border-radius:4px;">
          <p style="margin:0 0 8px;"><strong>Logement :</strong> ${property.title}</p>
          <p style="margin:0 0 8px;"><strong>Arrivée :</strong> ${booking.check_in}</p>
          <p style="margin:0 0 8px;"><strong>Départ :</strong> ${booking.check_out}</p>
          <p style="margin:0 0 8px;"><strong>Durée :</strong> ${booking.nights} nuit${booking.nights > 1 ? "s" : ""}</p>
          <p style="margin:0 0 8px;"><strong>Acompte réglé :</strong> ${booking.deposit_amount}€</p>
          <p style="margin:0;"><strong>Solde à régler sur place :</strong> ${booking.total_amount - booking.deposit_amount}€</p>
        </div>
        <p style="color:#666;">
          Votre numéro de réservation : <strong style="font-family:monospace;">#${booking.id.slice(0, 8).toUpperCase()}</strong>
        </p>
        <p style="color:#666;">Nous avons hâte de vous accueillir à Kerkouane !</p>
        <p style="color:#666;margin-top:32px;">Chaleureusement,<br/><strong>L'équipe Dar Omi Aicha</strong></p>
      </div>
      ${footer()}
    </div>`

  await send(
    booking.guest_email,
    `Confirmation de réservation – ${property.title}`,
    html
  )
}

// ── Email 2 : Annulation (conflit détecté à la confirmation) ─────────────────

export async function sendCancellationNotification(
  booking: Record<string, unknown>,
  property: Property,
  source: "direct" | "external"
): Promise<void> {
  const guestName   = booking.guest_name   as string
  const guestEmail  = booking.guest_email  as string
  const checkIn     = booking.check_in     as string
  const checkOut    = booking.check_out    as string
  const nights      = booking.nights       as number

  const reason = source === "external"
    ? `Ces dates ont été réservées sur une plateforme partenaire (Airbnb / Booking.com) pendant le traitement de votre demande.`
    : `Ces dates ont été réservées simultanément par un autre voyageur sur notre site.`

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
      ${header()}
      <div style="padding:40px 32px;">
        <h2 style="color:#c0392b;margin-top:0;">Réservation annulée</h2>
        <p style="color:#666;">Bonjour <strong>${guestName}</strong>,</p>
        <p style="color:#666;">
          Nous sommes navrés de vous informer que votre réservation n'a pas pu être confirmée.
          ${reason}
        </p>
        <div style="background:#fff5f5;border-left:4px solid #c0392b;padding:16px 20px;margin:20px 0;border-radius:4px;">
          <p style="margin:0 0 6px;"><strong>Logement :</strong> ${property.title}</p>
          <p style="margin:0 0 6px;"><strong>Arrivée :</strong> ${checkIn}</p>
          <p style="margin:0 0 6px;"><strong>Départ :</strong> ${checkOut}</p>
          <p style="margin:0;"><strong>Durée :</strong> ${nights} nuit${nights > 1 ? "s" : ""}</p>
        </div>
        <p style="color:#666;">
          <strong>Aucun montant n'a été débité.</strong> Si un pré-autorisation apparaît sur votre compte,
          elle sera automatiquement annulée dans les 5 à 7 jours ouvrés.
        </p>
        <div style="text-align:center;margin:32px 0;">
          <a href="${appUrl}/#logements"
             style="background:#0077b6;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;display:inline-block;">
            Voir les disponibilités →
          </a>
        </div>
        <p style="color:#666;margin-top:32px;">
          Toutes nos excuses pour la gêne occasionnée.<br/>
          <strong>L'équipe Dar Omi Aicha</strong>
        </p>
      </div>
      ${footer()}
    </div>`

  await send(
    guestEmail,
    `Annulation de votre demande – ${property.title}`,
    html
  )
}

// ── Email 3 : Dates indisponibles + alternatives ──────────────────────────────

export interface UnavailabilityAlternative {
  property: Property
  window: DateWindow
  label: string // ex: "Mêmes dates" | "Prochaines dates disponibles"
}

export async function sendUnavailabilityNotification(
  booking: Booking,
  originalProperty: Property,
  alternatives: UnavailabilityAlternative[]
): Promise<void> {
  const altHtml = alternatives.length > 0
    ? `
      <p style="color:#666;margin-top:24px;">
        Voici les disponibilités que nous vous proposons en remplacement :
      </p>
      ${alternatives.map((alt, i) => `
        <div style="background:#f9f7f1;border-left:4px solid #0077b6;padding:16px 20px;margin:12px 0;border-radius:4px;">
          <p style="margin:0 0 6px;font-size:13px;color:#0077b6;font-weight:bold;">Option ${i + 1} — ${alt.label}</p>
          <p style="margin:0 0 4px;"><strong>${alt.property.title}</strong></p>
          <p style="margin:0 0 4px;color:#555;">Du ${alt.window.check_in} au ${alt.window.check_out}</p>
          <a href="${appUrl}/bien/${alt.property.slug}"
             style="display:inline-block;margin-top:8px;background:#0077b6;color:#fff;text-decoration:none;padding:8px 16px;border-radius:6px;font-size:13px;">
            Voir et réserver →
          </a>
        </div>`).join("")}
    `
    : `<p style="color:#666;margin-top:16px;">
        Nous vous invitons à consulter nos disponibilités sur
        <a href="${appUrl}" style="color:#0077b6;">${appUrl}</a>.
      </p>`

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#333;">
      ${header()}
      <div style="padding:40px 32px;">
        <h2 style="color:#c0392b;margin-top:0;">Dates non disponibles</h2>
        <p style="color:#666;">Bonjour <strong>${booking.guest_name}</strong>,</p>
        <p style="color:#666;">
          Nous sommes désolés de vous informer que les dates que vous aviez sélectionnées
          ne sont plus disponibles — un autre voyageur vient de finaliser sa réservation
          sur <strong>${originalProperty.title}</strong> pour ces mêmes dates.
        </p>
        <div style="background:#fff5f5;border-left:4px solid #c0392b;padding:16px 20px;margin:20px 0;border-radius:4px;">
          <p style="margin:0 0 4px;"><strong>Logement demandé :</strong> ${originalProperty.title}</p>
          <p style="margin:0 0 4px;"><strong>Arrivée :</strong> ${booking.check_in}</p>
          <p style="margin:0;"><strong>Départ :</strong> ${booking.check_out}</p>
        </div>
        <p style="color:#666;">
          Votre option (réf. <strong style="font-family:monospace;">#${booking.id.slice(0, 8).toUpperCase()}</strong>)
          a été automatiquement annulée. Aucun paiement n'a été prélevé.
        </p>
        ${altHtml}
        <p style="color:#666;margin-top:32px;">
          Toutes nos excuses pour la gêne occasionnée.<br/>
          <strong>L'équipe Dar Omi Aicha</strong>
        </p>
      </div>
      ${footer()}
    </div>`

  await send(
    booking.guest_email,
    `Dates non disponibles – alternatives pour votre séjour`,
    html
  )
}
