import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BCM Products',
    short_name: 'BCM',
    description: 'Catálogo online BCM',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbfaff',
    theme_color: '#190660',
    icons: [{ src: '/logo.jpg', sizes: 'any', type: 'image/jpeg' }]
  };
}
