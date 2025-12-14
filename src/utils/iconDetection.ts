
import { WebsiteLink } from '../types';

/**
 * Detects the appropriate icon based on URL or label
 * 
 * @param url - Website URL to analyze
 * @param label - Website label to analyze
 * @returns Icon ID matching AVAILABLE_ICONS
 */
export function detectIconFromUrl(url: string, label: string): string {
  const urlLower = url.toLowerCase();
  const labelLower = label.toLowerCase();

  // Check URL for common patterns first (highest priority)
  if (urlLower.includes('linkedin.com')) return 'linkedin';
  if (urlLower.includes('github.com')) return 'github';
  if (urlLower.includes('facebook.com')) return 'facebook';
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter';
  if (urlLower.includes('instagram.com')) return 'instagram';
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'youtube';
  if (urlLower.includes('tiktok.com')) return 'video';
  if (urlLower.includes('gmail.com') || urlLower.includes('google.com/mail')) return 'at-sign';
  if (urlLower.includes('yahoo.com')) return 'yahoo';
  if (urlLower.includes('t.me') || urlLower.includes('telegram')) return 'send';

  // Check label as fallback - match whole words or common patterns
  // Use word boundary checks to avoid partial matches
  const labelWords = labelLower.split(/[\s\-_\/\.]+/); // Split by common delimiters

  // Check for exact word matches first
  if (labelWords.includes('github')) return 'github';
  if (labelWords.includes('linkedin')) return 'linkedin';
  if (labelWords.includes('facebook')) return 'facebook';
  if (labelWords.includes('twitter') || labelWords.includes('x')) return 'twitter';
  if (labelWords.includes('instagram')) return 'instagram';
  if (labelWords.includes('youtube')) return 'youtube';
  if (labelWords.includes('tiktok')) return 'video';
  if (labelWords.includes('gmail')) return 'at-sign';
  if (labelWords.includes('yahoo')) return 'yahoo';
  if (labelWords.includes('telegram')) return 'send';
  if (labelWords.includes('email') || labelWords.includes('mail')) return 'mail';
  if (labelWords.includes('phone')) return 'phone';
  if (labelWords.includes('portfolio') || labelWords.includes('website')) return 'briefcase';

  // Default to globe for generic links
  return 'globe';
}

/**
 * Creates a new website link with auto-detected icon
 * 
 * @param label - Default label for new link
 * @param url - Default URL for new link
 * @returns WebsiteLink object with auto-detected icon
 */
export function createWebsiteLink(label: string = 'Website', url: string = ''): WebsiteLink {
  const icon = url ? detectIconFromUrl(url, label) : 'link';
  return {
    id: crypto.randomUUID(),
    label,
    url,
    icon
  };
}

import { AVAILABLE_ICONS } from '../constants';

/**
 * Gets the display label for a given icon ID
 * 
 * @param iconId - The ID of the icon
 * @returns The display label (e.g., 'LinkedIn') or empty string if not found
 */
export function getLabelFromIcon(iconId: string): string {
  const icon = AVAILABLE_ICONS.find(i => i.id === iconId);
  return icon ? icon.label : '';
}
