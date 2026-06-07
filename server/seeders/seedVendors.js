require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { User, Vendor, Service, sequelize } = require('../models');

const vendors = [
  {
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma.venue@gmail.com',
    phone: '+919412345601',
    businessName: 'Sharma Marriage Hall',
    categoryId: 1,
    description: 'The most spacious marriage hall in Chandausi with modern amenities, AC banquet, lawn area and parking for 200+ cars. Trusted by families for over 25 years.',
    address: 'Station Road, Near Railway Crossing',
    city: 'Chandausi',
    rating: 4.6,
    totalReviews: 132,
    services: [
      { name: 'Full Hall Booking (Day)', price: 85000, tier: 'premium', duration: '12 hours', items: ['AC Hall', 'Stage Decoration', 'Sound System', 'Generator Backup', 'Parking'] },
      { name: 'Lawn Booking (Evening)', price: 35000, tier: 'standard', duration: '6 hours', items: ['Open Lawn', 'Basic Lights', 'Parking'] }
    ]
  },
  {
    name: 'Mohammad Irfan',
    email: 'irfan.catering.chandausi@gmail.com',
    phone: '+919837456702',
    businessName: 'Irfan Catering Services',
    categoryId: 2,
    description: 'Premium Mughlai and North Indian wedding catering with live counters. Serving aromatic biryanis, kebabs and traditional sweets across Chandausi and nearby towns.',
    address: 'Subhash Road, Near Jama Masjid',
    city: 'Chandausi',
    rating: 4.8,
    totalReviews: 98,
    services: [
      { name: 'Veg + Non-Veg Buffet (per plate)', price: 800, tier: 'premium', duration: 'Per event', items: ['15 Items Buffet', 'Live Counters', 'Dessert Station', 'Welcome Drinks', 'Service Staff'] },
      { name: 'Pure Veg Buffet (per plate)', price: 500, tier: 'standard', duration: 'Per event', items: ['12 Items Buffet', 'Paneer Special', 'Sweets Counter', 'Cold Drinks'] }
    ]
  },
  {
    name: 'Amit Verma',
    email: 'amit.verma.photo@gmail.com',
    phone: '+919058234503',
    businessName: 'Verma Digital Studio',
    categoryId: 3,
    description: 'Professional wedding photography and cinematic videography in Chandausi. Drone shots, pre-wedding shoots and beautiful album design at affordable prices.',
    address: 'Main Market, Opposite SBI Branch',
    city: 'Chandausi',
    rating: 4.5,
    totalReviews: 76,
    services: [
      { name: 'Wedding Photography + Video Package', price: 45000, tier: 'premium', duration: '2 days', items: ['2 Photographers', '1 Videographer', 'Drone Coverage', '200 Edited Photos', 'Cinematic Video'] },
      { name: 'Basic Photo Coverage', price: 15000, tier: 'basic', duration: '1 day', items: ['1 Photographer', '100 Edited Photos', 'Photo Album'] }
    ]
  },
  {
    name: 'Priya Agarwal',
    email: 'priya.decor.chandausi@gmail.com',
    phone: '+919719876504',
    businessName: 'Priya Flower & Decoration',
    categoryId: 4,
    description: 'Elegant wedding and event decoration with fresh flowers, lighting, and themed stage setups. Making every celebration in Chandausi look like a dream.',
    address: 'Gher Sarai, Near Hanuman Mandir',
    city: 'Chandausi',
    rating: 4.3,
    totalReviews: 54,
    services: [
      { name: 'Full Wedding Decoration', price: 60000, tier: 'premium', duration: '1 day setup', items: ['Stage Decoration', 'Entry Gate', 'Flower Arrangements', 'LED Lights', 'Table Centerpieces'] },
      { name: 'Simple Stage Decoration', price: 18000, tier: 'basic', duration: '4 hours setup', items: ['Stage Flowers', 'Basic Draping', 'LED Backdrop'] }
    ]
  },
  {
    name: 'Deepak Tyagi',
    email: 'deepak.dj.chandausi@gmail.com',
    phone: '+919456781205',
    businessName: 'DJ Deepak Entertainment',
    categoryId: 5,
    description: 'High-energy DJ and sound system rental for weddings, sangeet and all celebrations. LED dance floor, fog machine and professional sound setup in Chandausi region.',
    address: 'Bilsi Road, Near Petrol Pump',
    city: 'Chandausi',
    rating: 4.4,
    totalReviews: 89,
    services: [
      { name: 'Full DJ Night Package', price: 25000, tier: 'premium', duration: '6 hours', items: ['DJ Setup', 'LED Dance Floor', 'Fog Machine', 'Party Lights', '2 Speakers'] },
      { name: 'Sound System Rental', price: 8000, tier: 'basic', duration: '8 hours', items: ['2 Speakers', 'Amplifier', 'Wireless Mic'] }
    ]
  },
  {
    name: 'Neha Chauhan',
    email: 'neha.makeup.chandausi@gmail.com',
    phone: '+919837562306',
    businessName: 'Neha Bridal Makeover',
    categoryId: 6,
    description: 'Professional bridal makeup artist in Chandausi specializing in HD, airbrush and traditional Indian bridal looks. Mehendi artists also available.',
    address: 'Civil Lines, Near Girls Inter College',
    city: 'Chandausi',
    rating: 4.7,
    totalReviews: 63,
    services: [
      { name: 'Bridal Makeup Package', price: 15000, tier: 'premium', duration: '4 hours', items: ['HD Bridal Makeup', 'Hair Styling', 'Draping', 'Touch-up Kit', 'Nail Art'] },
      { name: 'Party Makeup', price: 3500, tier: 'basic', duration: '1.5 hours', items: ['Party Makeup', 'Hair Setting', 'Basic Draping'] }
    ]
  },
  {
    name: 'Sunil Kashyap',
    email: 'sunil.transport.chandausi@gmail.com',
    phone: '+919012345607',
    businessName: 'Kashyap Tour & Travels',
    categoryId: 7,
    description: 'Luxury car and bus rental for baraat, guest pickup and wedding transport. Decorated cars, Tempo Travellers and 50-seater buses available in Chandausi.',
    address: 'Bus Stand Road, Near Old Sabzi Mandi',
    city: 'Chandausi',
    rating: 4.1,
    totalReviews: 41,
    services: [
      { name: 'Decorated Car for Baraat', price: 12000, tier: 'premium', duration: 'Full day', items: ['Decorated Sedan/SUV', 'Driver', 'Flower Decoration', 'Ribbon & Lights'] },
      { name: 'Tempo Traveller (17 Seater)', price: 8000, tier: 'standard', duration: 'Full day', items: ['AC Tempo Traveller', 'Driver', 'Fuel Included (100 km)'] }
    ]
  },
  {
    name: 'Anita Gupta',
    email: 'anita.planner.chandausi@gmail.com',
    phone: '+919897654308',
    businessName: 'Gupta Event Planners',
    categoryId: 8,
    description: 'Complete wedding and event planning services in Chandausi. From venue selection to catering coordination, we handle every detail so you can enjoy your special day.',
    address: 'Mohan Nagar, Chandausi',
    city: 'Chandausi',
    rating: 4.5,
    totalReviews: 37,
    services: [
      { name: 'Full Wedding Planning', price: 150000, tier: 'premium', duration: '3-6 months', items: ['Venue Booking', 'Vendor Coordination', 'Timeline Management', 'Guest Management', 'Day-of Coordination'] },
      { name: 'Day-of Coordination', price: 25000, tier: 'standard', duration: '1 day', items: ['Event Timeline', 'Vendor Coordination', 'Setup Supervision', 'Emergency Kit'] }
    ]
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.venue.chandausi@gmail.com',
    phone: '+919536789009',
    businessName: 'Singh Palace Banquet',
    categoryId: 1,
    description: 'Premium banquet hall with central AC, valet parking, and beautiful interiors. Perfect for grand weddings and corporate events in Chandausi.',
    address: 'Moradabad Road, Near Sugar Mill',
    city: 'Chandausi',
    rating: 4.2,
    totalReviews: 67,
    services: [
      { name: 'Banquet Hall + Lawn Combo', price: 120000, tier: 'premium', duration: 'Full day', items: ['AC Banquet (500 pax)', 'Lawn (300 pax)', 'Stage', 'Generator', 'Valet Parking'] }
    ]
  },
  {
    name: 'Sanjay Rastogi',
    email: 'sanjay.catering.chandausi@gmail.com',
    phone: '+919758432110',
    businessName: 'Rastogi Bhojanshala',
    categoryId: 2,
    description: 'Pure vegetarian catering with authentic Brahmin cooks. Specializing in Marwari thali, South Indian and chaat counters for weddings in Chandausi.',
    address: 'Kotwali Road, Near Shiv Mandir',
    city: 'Chandausi',
    rating: 4.4,
    totalReviews: 85,
    services: [
      { name: 'Premium Veg Thali (per plate)', price: 600, tier: 'premium', duration: 'Per event', items: ['20 Items Thali', 'Live Chaat Counter', 'Sweet Counter', 'Paan Counter', 'Service Staff'] }
    ]
  },
  {
    name: 'Mohd Aqeel',
    email: 'aqeel.venue.bisauli@gmail.com',
    phone: '+919410567811',
    businessName: 'Aqeel Marriage Garden',
    categoryId: 1,
    description: 'Beautiful open-air marriage garden in the heart of Bisauli with lush green lawns, modern lighting and ample parking space for grand celebrations.',
    address: 'Badaun Road, Near Degree College',
    city: 'Bisauli',
    rating: 4.3,
    totalReviews: 58,
    services: [
      { name: 'Garden Booking (Full Day)', price: 55000, tier: 'premium', duration: 'Full day', items: ['Open Lawn', 'Stage Area', 'Tent', 'Lighting', 'Generator', 'Parking'] },
      { name: 'Half Day Booking', price: 30000, tier: 'standard', duration: '6 hours', items: ['Open Lawn', 'Basic Stage', 'Lighting'] }
    ]
  },
  {
    name: 'Ramesh Pal',
    email: 'ramesh.catering.bisauli@gmail.com',
    phone: '+919675432112',
    businessName: 'Pal Catering & Tent House',
    categoryId: 2,
    description: 'Affordable and delicious catering combined with tent and shamiana rental. One-stop shop for wedding food and seating arrangements in Bisauli.',
    address: 'Gandhi Chowk, Main Bazaar',
    city: 'Bisauli',
    rating: 4.0,
    totalReviews: 43,
    services: [
      { name: 'Catering + Tent Combo (per plate)', price: 450, tier: 'standard', duration: 'Per event', items: ['10 Items Buffet', 'Tent Setup (200 pax)', 'Chairs & Tables', 'Cold Drinks'] },
      { name: 'Tent & Shamiana Only', price: 15000, tier: 'basic', duration: '2 days', items: ['Shamiana (200 pax)', 'Chairs', 'Durries', 'Basic Lighting'] }
    ]
  },
  {
    name: 'Kuldeep Saini',
    email: 'kuldeep.photo.bisauli@gmail.com',
    phone: '+919219876513',
    businessName: 'Saini Photo & Video',
    categoryId: 3,
    description: 'Traditional and candid wedding photography at honest prices. Serving families in Bisauli for over 15 years with beautiful albums and video memories.',
    address: 'Kachehri Road, Near Tehsil',
    city: 'Bisauli',
    rating: 4.1,
    totalReviews: 52,
    services: [
      { name: 'Complete Photo + Video', price: 30000, tier: 'standard', duration: '2 days', items: ['1 Photographer', '1 Videographer', '150 Edited Photos', 'Highlight Reel', 'Photo Album'] },
      { name: 'Photography Only', price: 12000, tier: 'basic', duration: '1 day', items: ['1 Photographer', '80 Edited Photos', 'USB Drive'] }
    ]
  },
  {
    name: 'Sunita Devi',
    email: 'sunita.decor.bisauli@gmail.com',
    phone: '+919897123414',
    businessName: 'Maa Durga Decoration',
    categoryId: 4,
    description: 'Colorful and traditional wedding decoration in Bisauli. Expertise in marigold flower setups, toran bandhanwar, and LED gate decoration.',
    address: 'Nai Sadak, Near Post Office',
    city: 'Bisauli',
    rating: 4.2,
    totalReviews: 38,
    services: [
      { name: 'Traditional Flower Decoration', price: 25000, tier: 'standard', duration: '1 day setup', items: ['Marigold Gate', 'Stage Flowers', 'Toran', 'Basic Draping', 'LED Gate'] },
      { name: 'Premium Theme Decoration', price: 50000, tier: 'premium', duration: '1 day setup', items: ['Themed Stage', 'Flower Walls', 'LED Lights', 'Entry Arch', 'Table Decor'] }
    ]
  },
  {
    name: 'Pankaj Kumar',
    email: 'pankaj.dj.bisauli@gmail.com',
    phone: '+919456321015',
    businessName: 'DJ Pankaj Sound',
    categoryId: 5,
    description: 'Popular DJ service in Bisauli with powerful sound systems and exciting light shows. Bollywood, Bhojpuri, and Haryanvi music specialist for baraat and sangeet.',
    address: 'Mohalla Sarai, Near Chauraha',
    city: 'Bisauli',
    rating: 4.0,
    totalReviews: 71,
    services: [
      { name: 'DJ + Light Show', price: 18000, tier: 'standard', duration: '5 hours', items: ['DJ Setup', 'LED Lights', '4 Speakers', 'Fog Machine'] },
      { name: 'Baraat Band + DJ Combo', price: 30000, tier: 'premium', duration: '4 hours', items: ['DJ Truck', 'Band Party', 'Fireworks', 'LED Lights', 'Dhol'] }
    ]
  },
  {
    name: 'Renu Tomar',
    email: 'renu.makeup.bisauli@gmail.com',
    phone: '+919837654316',
    businessName: 'Renu Beauty Parlour',
    categoryId: 6,
    description: 'Experienced bridal makeup artist in Bisauli known for elegant and long-lasting bridal looks. Mehendi design, facial and hair services also available.',
    address: 'Purani Sabzi Mandi, Near Clock Tower',
    city: 'Bisauli',
    rating: 4.5,
    totalReviews: 46,
    services: [
      { name: 'Bridal Package', price: 10000, tier: 'premium', duration: '3 hours', items: ['Bridal Makeup', 'Hair Styling', 'Dupatta Setting', 'Touch-ups'] },
      { name: 'Mehendi + Makeup Combo', price: 6000, tier: 'standard', duration: '4 hours', items: ['Full Hand Mehendi', 'Party Makeup', 'Hair Setting'] }
    ]
  },
  {
    name: 'Arvind Yadav',
    email: 'arvind.transport.bisauli@gmail.com',
    phone: '+919012876517',
    businessName: 'Yadav Travels Bisauli',
    categoryId: 7,
    description: 'Reliable wedding transport and vehicle rental in Bisauli. Ghodi for baraat, decorated cars, and bus service for guest pickup and drop.',
    address: 'Bus Adda, Bisauli-Badaun Road',
    city: 'Bisauli',
    rating: 3.9,
    totalReviews: 29,
    services: [
      { name: 'Ghodi + Baggi for Baraat', price: 15000, tier: 'premium', duration: 'Half day', items: ['Decorated Horse', 'Baggi (Chariot)', 'Band Baja', 'Attendant'] },
      { name: 'Bus Rental (35 Seater)', price: 6000, tier: 'standard', duration: 'Full day', items: ['Non-AC Bus', 'Driver', 'Fuel (80 km)'] }
    ]
  },
  {
    name: 'Kavita Mishra',
    email: 'kavita.planner.bisauli@gmail.com',
    phone: '+919719543218',
    businessName: 'Shubh Vivah Planners',
    categoryId: 8,
    description: 'Dedicated wedding planner for Bisauli and surrounding areas. From haldi to vidaai, we coordinate every ritual with care and precision.',
    address: 'Mohalla Qazi, Near Bisauli Fort',
    city: 'Bisauli',
    rating: 4.6,
    totalReviews: 24,
    services: [
      { name: 'Complete Wedding Management', price: 100000, tier: 'premium', duration: '2-4 months', items: ['Venue Selection', 'Catering Management', 'Decoration', 'Photography', 'Transport', 'Pandit Ji Booking'] },
      { name: 'Partial Planning', price: 40000, tier: 'standard', duration: '1 month', items: ['Vendor Shortlisting', 'Budget Planning', 'Day-of Coordination'] }
    ]
  },
  {
    name: 'Harish Chandra',
    email: 'harish.photo.bisauli@gmail.com',
    phone: '+919536123419',
    businessName: 'Chandra Studio & Gallery',
    categoryId: 3,
    description: 'Established photography studio in Bisauli offering wedding photography, pre-wedding shoots, and custom photo framing. Drone photography now available.',
    address: 'Sadar Bazaar, Near Kotwali',
    city: 'Bisauli',
    rating: 4.3,
    totalReviews: 61,
    services: [
      { name: 'Drone + Photo + Video', price: 40000, tier: 'premium', duration: '2 days', items: ['2 Photographers', '1 Videographer', 'Drone Shots', 'Photo Album (40 pages)', 'Highlight Film'] },
      { name: 'Basic Photo Package', price: 10000, tier: 'basic', duration: '1 day', items: ['1 Photographer', '60 Edited Photos', 'Digital Copies'] }
    ]
  },
  {
    name: 'Neeraj Pandit',
    email: 'neeraj.decor.bisauli@gmail.com',
    phone: '+919897001220',
    businessName: 'Neeraj Light & Decoration',
    categoryId: 4,
    description: 'Specialist in LED lighting, fairy lights, and modern wedding decoration in Bisauli. Offers gate decoration, mandap setup and reception stage design.',
    address: 'Chandausi Road, Near Petrol Pump',
    city: 'Bisauli',
    rating: 4.4,
    totalReviews: 33,
    services: [
      { name: 'LED Lighting Package', price: 35000, tier: 'premium', duration: '1 day', items: ['LED Gate', 'Fairy Light Canopy', 'Stage Lights', 'Pathway Lights', 'Mandap Lights'] },
      { name: 'Basic Light Decoration', price: 12000, tier: 'basic', duration: '1 day', items: ['Gate Lights', 'String Lights', 'Stage Spotlight'] }
    ]
  }
];

const seedVendors = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    let created = 0;
    let skipped = 0;

    for (const v of vendors) {
      const existingUser = await User.findOne({ where: { email: v.email } });
      if (existingUser) {
        console.log(`⏭️  Skipping ${v.businessName} (email ${v.email} already exists)`);
        skipped++;
        continue;
      }

      const user = await User.create({
        name: v.name,
        email: v.email,
        password: 'Vendor@123',
        phone: v.phone,
        role: 'vendor',
        isActive: true
      });

      const vendor = await Vendor.create({
        userId: user.id,
        businessName: v.businessName,
        categoryId: v.categoryId,
        description: v.description,
        phone: v.phone,
        address: v.address,
        city: v.city,
        portfolioImages: [],
        isApproved: true,
        rating: v.rating,
        totalReviews: v.totalReviews
      });

      if (v.services && v.services.length > 0) {
        for (const svc of v.services) {
          await Service.create({
            vendorId: vendor.id,
            name: svc.name,
            description: `${svc.name} by ${v.businessName}`,
            price: svc.price,
            packageTier: svc.tier,
            duration: svc.duration,
            includedItems: svc.items,
            images: [],
            isActive: true
          });
        }
      }

      console.log(`✅ Created: ${v.businessName} (${v.city}) — ${v.services.length} service(s)`);
      created++;
    }

    console.log(`\n🎉 Seeding complete! Created: ${created}, Skipped: ${skipped}`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
};

if (require.main === module) {
  seedVendors().then(() => process.exit(0));
} else {
  module.exports = seedVendors;
}
