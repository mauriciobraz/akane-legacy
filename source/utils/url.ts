import { parse as parseURL } from "url";

/** Array of media extensions that are supported by the bot. */
export const ACCEPTED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "mp4", "mp3"];

/** Array of trusted sources for images/videos/etc. */
export const IMAGE_SOURCE_DOMAINS = [
  "https://i.ibb.co",
  "https://i.imgur.com",

  // Discord's CDN
  "https://media.discordapp.net",
  "https://cdn.discordapp.com",

  // Giphy
  "https://media.giphy.com/",
  "https://media1.giphy.com/",
  "https://media2.giphy.com/",
  "https://media3.giphy.com/",
  "https://media4.giphy.com/",
];

export function isImageURL(url: string): boolean {
  return new RegExp(`\\.(${ACCEPTED_IMAGE_EXTENSIONS.join("|")})$`, "i").test(url);
}

export function isURLFrom(url: string, sources: string[]): boolean {
  const parsedURL = parseURL(url);
  return sources.some(source => parsedURL.host === parseURL(source).host);
}

export function isTrustedMediaURL(url: string): boolean {
  return isImageURL(url) && isURLFrom(url, IMAGE_SOURCE_DOMAINS);
}
