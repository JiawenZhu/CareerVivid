
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
  
  // Check URL for common patterns (priority)
  if (urlLower.includes('linkedin.com')) return 'linkedin';
  if (urlLower.includes('github.com')) return 'github';
  if (urlLower.includes('facebook.com')) return 'facebook';
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'twitter';
  if (urlLower.includes('instagram.com')) return 'instagram';
  if (urlLower.includes('youtube.com')) return 'youtube';
  if (urlLower.includes('tiktok.com')) return 'video';
  if (urlLower.includes('gmail.com') || urlLower.includes('google.com/mail')) return 'at-sign';
  if (urlLower.includes('yahoo.com')) return 'yahoo';
  if (urlLower.includes('t.me') || urlLower.includes('telegram')) return 'send';
  
  // Check label as fallback
  if (labelLower.includes('linkedin')) return 'linkedin';
  if (labelLower.includes('github')) return 'github';
  if (labelLower.includes('facebook')) return 'facebook';
  if (labelLower.includes('twitter') || labelLower.includes('x')) return 'twitter';
  if (labelLower.includes('instagram')) return 'instagram';
  if (labelLower.includes('youtube')) return 'youtube';
  if (labelLower.includes('tiktok')) return 'video';
  if (labelLower.includes('gmail')) return 'at-sign';
  if (labelLower.includes('yahoo')) return 'yahoo';
  if (labelLower.includes('telegram')) return 'send';
  if (labelLower.includes('email') || labelLower.includes('mail')) return 'mail';
  if (labelLower.includes('phone')) return 'phone';
  if (labelLower.includes('portfolio') || labelLower.includes('website')) return 'briefcase';
  
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
