import React from 'react';
import { useLocation } from 'react-router-dom';
import { DEFAULT_SITE_SETTINGS } from '../../data/seedData';

export const StructuredData: React.FC = () => {
  const location = useLocation();

  // LocalBusiness schema on all pages
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: DEFAULT_SITE_SETTINGS.siteName,
    description: DEFAULT_SITE_SETTINGS.tagline,
    url: 'https://aiprinting.lk',
    telephone: DEFAULT_SITE_SETTINGS.hotline,
    email: DEFAULT_SITE_SETTINGS.email,
    priceRange: 'LKR 100 - 105,000',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '11/A Gangarama Rd, Werahara',
      addressLocality: 'Boralesgamuwa',
      addressRegion: 'Western Province',
      postalCode: '10290',
      addressCountry: 'LK',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 6.81929,
      longitude: 79.89832,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:30',
        closes: '17:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '08:30',
        closes: '13:00',
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
    />
  );
};
