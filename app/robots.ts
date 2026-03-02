import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            // If there are specific private routes you want to hide later, 
            // you can add a disallow array:
            // disallow: ['/private/', '/admin/'], 
        },
        sitemap: 'https://careervivid.app/sitemap.xml',
    };
}
