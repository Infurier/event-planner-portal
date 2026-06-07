const CUSTOM_VENUE_VALUE = 'custom';

const PRESET_VENUES = [
  {
    key: 'grand-ballroom-delhi',
    label: 'Grand Ballroom, New Delhi',
    location: 'Grand Ballroom, Aerocity, New Delhi, Delhi'
  },
  {
    key: 'lakeview-gardens-jaipur',
    label: 'Lakeview Gardens, Jaipur',
    location: 'Lakeview Gardens, Amer Road, Jaipur, Rajasthan'
  },
  {
    key: 'seaside-convention-goa',
    label: 'Seaside Convention Center, Goa',
    location: 'Seaside Convention Center, Dona Paula, Goa'
  },
  {
    key: 'royal-orchid-bengaluru',
    label: 'Royal Orchid Hall, Bengaluru',
    location: 'Royal Orchid Hall, Old Airport Road, Bengaluru, Karnataka'
  },
  {
    key: 'emerald-banquet-mumbai',
    label: 'Emerald Banquet, Mumbai',
    location: 'Emerald Banquet, Andheri East, Mumbai, Maharashtra'
  },
  {
    key: 'riverfront-conclave-ahmedabad',
    label: 'Riverfront Conclave, Ahmedabad',
    location: 'Riverfront Conclave, Ashram Road, Ahmedabad, Gujarat'
  }
];

const PRESET_VENUE_MAP = PRESET_VENUES.reduce((map, venue) => {
  map[venue.key] = venue;
  return map;
}, {});

const getVenueByKey = (key) => PRESET_VENUE_MAP[String(key || '').trim()] || null;

module.exports = {
  CUSTOM_VENUE_VALUE,
  PRESET_VENUES,
  PRESET_VENUE_MAP,
  getVenueByKey
};
