import { CONTACT } from "@/lib/site";

/**
 * WhatsApp enquiry helpers.
 * Every enquiry on the site goes through WhatsApp — pricing is NEVER included
 * in public pages, only "ask for rates" style messages.
 */

/** wa.me deep link with an optional pre-filled message. */
export function buildWhatsAppLink(message = "") {
  const base = CONTACT.whatsapp
    ? `https://wa.me/${CONTACT.whatsapp}`
    : "https://wa.me/";
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
