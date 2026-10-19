/**
 * i18n configuration for Matoshree Fruits.
 * Simple locale routing: /hi (default), /mr, /en — messages live in
 * src/messages/<locale>.json and are passed to pages from the [locale] layout.
 */
import mr from "@/messages/mr.json";
import hi from "@/messages/hi.json";
import en from "@/messages/en.json";

export const LOCALES = ["hi", "mr", "en"];
export const DEFAULT_LOCALE = "hi";

export const LOCALE_NAMES = {
  mr: "मराठी",
  hi: "हिन्दी",
  en: "English",
};

const MESSAGES = { mr, hi, en };

export function isValidLocale(locale) {
  return LOCALES.includes(locale);
}

export function getMessages(locale) {
  return MESSAGES[locale] || MESSAGES[DEFAULT_LOCALE];
}
