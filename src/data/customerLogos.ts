export interface CustomerLogoItem {
  id: string;
  name: string;
  category: 'Banking & Finance' | 'Corporates & Conglomerates' | 'Higher Education' | 'Institutions & Global' | 'Industry & Commercial';
  logoUrl: string;
}

export const CUSTOMER_LOGOS: CustomerLogoItem[] = [
  // Banking & Financial Leaders
  { id: 'sampath-bank', name: 'Sampath Bank', category: 'Banking & Finance', logoUrl: '/recustomerlogos/sampath%20bank.png' },
  { id: 'hnb', name: 'Hatton National Bank (HNB)', category: 'Banking & Finance', logoUrl: '/recustomerlogos/HNB.png' },
  { id: 'mastercard', name: 'Mastercard', category: 'Banking & Finance', logoUrl: '/recustomerlogos/Master%20Card.jpg' },
  { id: 'fintrex', name: 'Fintrex Finance', category: 'Banking & Finance', logoUrl: '/recustomerlogos/Fintrex.png' },
  { id: 'adb', name: 'Asian Development Bank (ADB)', category: 'Banking & Finance', logoUrl: '/recustomerlogos/ADB.jpg' },

  // Higher Education & Academic Institutions
  { id: 'nsbm', name: 'NSBM Green University', category: 'Higher Education', logoUrl: '/recustomerlogos/NSBM%20Green%20University.jpg' },
  { id: 'kdu', name: 'Kotelawala Defence University (KDU)', category: 'Higher Education', logoUrl: '/recustomerlogos/KDU.jpg' },
  { id: 'uovt', name: 'University of Vocational Technology (UOVT)', category: 'Higher Education', logoUrl: '/recustomerlogos/UOVT.png' },
  { id: 'slim', name: 'Sri Lanka Institute of Marketing (SLIM)', category: 'Higher Education', logoUrl: '/recustomerlogos/SLIM.jpg' },
  { id: 'ibsl', name: 'Institute of Bankers of Sri Lanka (IBSL)', category: 'Higher Education', logoUrl: '/recustomerlogos/IBSL.jpg' },
  { id: 'iihe', name: 'Imperial Institute of Higher Education (IIHE)', category: 'Higher Education', logoUrl: '/recustomerlogos/IIHE.png' },
  { id: 'stanford-college', name: 'Stanford College', category: 'Higher Education', logoUrl: '/recustomerlogos/Stanford%20College-01.jpg' },
  { id: 'metropolitan-college', name: 'Metropolitan College', category: 'Higher Education', logoUrl: '/recustomerlogos/METROPOLITAN%20COLLEGE.png' },

  // Corporates & Conglomerates
  { id: 'singer', name: 'Singer Sri Lanka', category: 'Corporates & Conglomerates', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(12).jpeg' },
  { id: 'aitken-spence', name: 'Aitken Spence Travels', category: 'Corporates & Conglomerates', logoUrl: '/recustomerlogos/Aithkenspence%20travels.jpg' },
  { id: 'hayleys', name: 'Hayleys Consumer', category: 'Corporates & Conglomerates', logoUrl: '/recustomerlogos/Hayles%20Consumer.jpg' },
  { id: 'abb', name: 'ABB', category: 'Corporates & Conglomerates', logoUrl: '/recustomerlogos/ABB.jpg' },
  { id: 'schneider', name: 'Schneider Electric', category: 'Corporates & Conglomerates', logoUrl: '/recustomerlogos/Schneider%20Electric.jpg' },
  { id: 'regus', name: 'Regus', category: 'Corporates & Conglomerates', logoUrl: '/recustomerlogos/Regus.jpg' },
  { id: 'berjaya', name: 'Berjaya Hotel Colombo', category: 'Corporates & Conglomerates', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.19.jpeg' },
  { id: 'star-holdings', name: 'Star Holdings', category: 'Corporates & Conglomerates', logoUrl: '/recustomerlogos/Star%20holdings.jpg' },
  { id: 'limra', name: 'Limra Holdings', category: 'Corporates & Conglomerates', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(5).jpeg' },
  { id: 'wickrama', name: 'Wickrama Holdings', category: 'Corporates & Conglomerates', logoUrl: '/recustomerlogos/Wickrama%20Holdings.jpg' },
  { id: 'ncg-holding', name: 'NCG Holding', category: 'Corporates & Conglomerates', logoUrl: '/recustomerlogos/NCG%20HOLDING.png' },
  { id: 'pan-asian-power', name: 'Pan Asian Power', category: 'Corporates & Conglomerates', logoUrl: '/recustomerlogos/PAN%20ASIAN%20POWER.png' },

  // Global & Sri Lankan Institutions
  { id: 'ccc', name: 'Ceylon Chamber of Commerce (CCC)', category: 'Institutions & Global', logoUrl: '/recustomerlogos/CCC.jpg' },
  { id: 'jica', name: 'Japan International Cooperation Agency (JICA)', category: 'Institutions & Global', logoUrl: '/recustomerlogos/JICA.png' },
  { id: 'iwmi', name: 'International Water Management Institute (IWMI)', category: 'Institutions & Global', logoUrl: '/recustomerlogos/IWMI.jpg' },
  { id: 'jll', name: 'JLL (Jones Lang LaSalle)', category: 'Institutions & Global', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(3).jpeg' },
  { id: 'qacert', name: 'QA Cert', category: 'Institutions & Global', logoUrl: '/recustomerlogos/QACERT-01.jpg' },
  { id: 'slam', name: 'SLAM', category: 'Institutions & Global', logoUrl: '/recustomerlogos/SLAM.png' },

  // Creative, Tech & Media
  { id: 'rootcode', name: 'Rootcode Labs', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(11).jpeg' },
  { id: 'digibrush', name: 'Digibrush', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/DIGIBRUSH.png' },
  { id: 'stein-studios', name: 'Stein Studios', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/Stein%20Studios-01.jpg' },
  { id: 'av-productions', name: 'AV Productions', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/AV%20Productions.jpg' },
  { id: 'evoke', name: 'Evoke', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/Evoke-01.jpg' },
  { id: 'we-make-platforms', name: 'We Make Platforms', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(16).jpeg' },
  { id: 'microsolutions', name: 'MicroSolutions', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(7).jpeg' },
  { id: 'nimbus-venture', name: 'Nimbus Venture', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(10).jpeg' },

  // Manufacturing, Retail & Commercial Brands
  { id: 'unidil', name: 'Unidil Packaging', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/UNIDIL%20PACKAGING.png' },
  { id: 'dhanusha-marine', name: 'Dhanusha Marine', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/dhanusha%20marine.png' },
  { id: 'bio-food-exports', name: 'Bio Food Exports', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20.jpeg' },
  { id: 'natures-only', name: 'Natures Only', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/Natures%20Only.jpg' },
  { id: 'osterberg', name: 'Osterberg', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/Osterberg.jpg' },
  { id: 'kti', name: 'KTI (Kiddies & Toys)', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(4).jpeg' },
  { id: 'watch-lk', name: 'Watch.lk', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(8).jpeg' },
  { id: 'top-gear', name: 'Top Gear Performance', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(15).jpeg' },
  { id: 'smc-auto-parts', name: 'SMC Auto Parts', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(14).jpeg' },
  { id: 'ncg-automotive', name: 'NCG Automotive', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/NCG%20AUTOMOTIVE.png' },
  { id: 'ncg-express', name: 'NCG Express', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/NCG%20EXPRESS-15.png' },
  { id: 'new-city-furnitech', name: 'New City Furnitech', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(9).jpeg' },
  { id: 'sk-interior', name: 'SK Interior Solutions', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(13).jpeg' },
  { id: 'europal', name: 'Europal', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(1).jpeg' },
  { id: 'gismo', name: 'Gismo', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(2).jpeg' },
  { id: 'methg', name: 'MethG Pvt Ltd', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(6).jpeg' },
  { id: 'wow-stop', name: 'Wow Stop', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/WhatsApp%20Image%202026-10-13%20at%2011.27.20%20(17).jpeg' },
  { id: 'ramya-horticulture', name: 'Ramya Horticulture', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/Ramya%20Horticulture.jpg' },
  { id: 'orana', name: 'Orana', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/Orana.jpg' },
  { id: 'tilmax', name: 'Tilmax', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/Tilmax.png' },
  { id: 'b-plus', name: 'B Plus', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/B%20PLUS.png' },
  { id: 'flower-book', name: 'Flower Book', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/Flower%20book.jpg' },
  { id: 'apts', name: 'APTS', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/APTS.jpg' },
  { id: 'lpae', name: 'LPAE', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/LPAE.jpg' },
  { id: 'siudesa', name: 'Siudesa', category: 'Industry & Commercial', logoUrl: '/recustomerlogos/Siudesa-logo.png-New.png' },
];

export const LOGO_CATEGORIES = [
  'All',
  'Banking & Finance',
  'Higher Education',
  'Corporates & Conglomerates',
  'Institutions & Global',
  'Industry & Commercial',
] as const;
