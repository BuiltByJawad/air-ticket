export interface Airport {
  iata: string;
  name: string;
  city: string;
  country: string;
}

export const airports: Airport[] = [
  // Bangladesh
  { iata: 'DAC', name: 'Hazrat Shahjalal International', city: 'Dhaka', country: 'Bangladesh' },
  { iata: 'CGP', name: 'Shah Amanat International', city: 'Chittagong', country: 'Bangladesh' },
  { iata: 'JSR', name: 'Jashore Airport', city: 'Jashore', country: 'Bangladesh' },
  // UAE
  { iata: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE' },
  { iata: 'AUH', name: 'Abu Dhabi International', city: 'Abu Dhabi', country: 'UAE' },
  { iata: 'SHJ', name: 'Sharjah International', city: 'Sharjah', country: 'UAE' },
  // Saudi Arabia
  { iata: 'JED', name: 'King Abdulaziz International', city: 'Jeddah', country: 'Saudi Arabia' },
  { iata: 'RUH', name: 'King Khalid International', city: 'Riyadh', country: 'Saudi Arabia' },
  { iata: 'DMM', name: 'King Fahd International', city: 'Dammam', country: 'Saudi Arabia' },
  // UK
  { iata: 'LHR', name: 'Heathrow', city: 'London', country: 'United Kingdom' },
  { iata: 'LGW', name: 'Gatwick', city: 'London', country: 'United Kingdom' },
  { iata: 'STN', name: 'Stansted', city: 'London', country: 'United Kingdom' },
  { iata: 'MAN', name: 'Manchester', city: 'Manchester', country: 'United Kingdom' },
  { iata: 'EDI', name: 'Edinburgh', city: 'Edinburgh', country: 'United Kingdom' },
  // USA
  { iata: 'JFK', name: 'John F. Kennedy International', city: 'New York', country: 'USA' },
  { iata: 'EWR', name: 'Newark Liberty International', city: 'New York', country: 'USA' },
  { iata: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA' },
  { iata: 'ORD', name: "O'Hare International", city: 'Chicago', country: 'USA' },
  { iata: 'SFO', name: 'San Francisco International', city: 'San Francisco', country: 'USA' },
  { iata: 'MIA', name: 'Miami International', city: 'Miami', country: 'USA' },
  { iata: 'IAD', name: 'Dulles International', city: 'Washington', country: 'USA' },
  { iata: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', country: 'USA' },
  { iata: 'ATL', name: 'Hartsfield-Jackson International', city: 'Atlanta', country: 'USA' },
  { iata: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', country: 'USA' },
  // India
  { iata: 'DEL', name: 'Indira Gandhi International', city: 'Delhi', country: 'India' },
  { iata: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India' },
  { iata: 'BLR', name: 'Kempegowda International', city: 'Bangalore', country: 'India' },
  { iata: 'MAA', name: 'Chennai International', city: 'Chennai', country: 'India' },
  { iata: 'CCU', name: 'Netaji Subhas Chandra Bose International', city: 'Kolkata', country: 'India' },
  { iata: 'HYD', name: 'Rajiv Gandhi International', city: 'Hyderabad', country: 'India' },
  // Singapore
  { iata: 'SIN', name: 'Changi', city: 'Singapore', country: 'Singapore' },
  // Malaysia
  { iata: 'KUL', name: 'Kuala Lumpur International', city: 'Kuala Lumpur', country: 'Malaysia' },
  // Thailand
  { iata: 'BKK', name: 'Suvarnabhumi', city: 'Bangkok', country: 'Thailand' },
  { iata: 'DMK', name: 'Don Mueang International', city: 'Bangkok', country: 'Thailand' },
  // Turkey
  { iata: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' },
  { iata: 'SAW', name: 'Sabiha Gökçen International', city: 'Istanbul', country: 'Turkey' },
  // Qatar
  { iata: 'DOH', name: 'Hamad International', city: 'Doha', country: 'Qatar' },
  // Oman
  { iata: 'MCT', name: 'Muscat International', city: 'Muscat', country: 'Oman' },
  // Kuwait
  { iata: 'KWI', name: 'Kuwait International', city: 'Kuwait City', country: 'Kuwait' },
  // Bahrain
  { iata: 'BAH', name: 'Bahrain International', city: 'Manama', country: 'Bahrain' },
  // Pakistan
  { iata: 'KHI', name: 'Jinnah International', city: 'Karachi', country: 'Pakistan' },
  { iata: 'LHE', name: 'Allama Iqbal International', city: 'Lahore', country: 'Pakistan' },
  { iata: 'ISB', name: 'Islamabad International', city: 'Islamabad', country: 'Pakistan' },
  // Nepal
  { iata: 'KTM', name: 'Tribhuvan International', city: 'Kathmandu', country: 'Nepal' },
  // Sri Lanka
  { iata: 'CMB', name: 'Bandaranaike International', city: 'Colombo', country: 'Sri Lanka' },
  // Maldives
  { iata: 'MLE', name: 'Velana International', city: 'Male', country: 'Maldives' },
  // China
  { iata: 'PEK', name: 'Beijing Capital International', city: 'Beijing', country: 'China' },
  { iata: 'PVG', name: 'Shanghai Pudong International', city: 'Shanghai', country: 'China' },
  { iata: 'CAN', name: 'Guangzhou Baiyun International', city: 'Guangzhou', country: 'China' },
  { iata: 'HKG', name: 'Hong Kong International', city: 'Hong Kong', country: 'China' },
  // Japan
  { iata: 'NRT', name: 'Narita International', city: 'Tokyo', country: 'Japan' },
  { iata: 'HND', name: 'Haneda', city: 'Tokyo', country: 'Japan' },
  { iata: 'KIX', name: 'Kansai International', city: 'Osaka', country: 'Japan' },
  // South Korea
  { iata: 'ICN', name: 'Incheon International', city: 'Seoul', country: 'South Korea' },
  // Australia
  { iata: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia' },
  { iata: 'MEL', name: 'Melbourne', city: 'Melbourne', country: 'Australia' },
  // Canada
  { iata: 'YYZ', name: 'Toronto Pearson International', city: 'Toronto', country: 'Canada' },
  { iata: 'YVR', name: 'Vancouver International', city: 'Vancouver', country: 'Canada' },
  // Germany
  { iata: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  { iata: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany' },
  // France
  { iata: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'France' },
  { iata: 'ORY', name: 'Paris Orly', city: 'Paris', country: 'France' },
  // Netherlands
  { iata: 'AMS', name: 'Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  // Italy
  { iata: 'FCO', name: 'Leonardo da Vinci', city: 'Rome', country: 'Italy' },
  { iata: 'MXP', name: 'Milan Malpensa', city: 'Milan', country: 'Italy' },
  // Spain
  { iata: 'MAD', name: 'Adolfo Suárez Madrid-Barajas', city: 'Madrid', country: 'Spain' },
  { iata: 'BCN', name: 'Barcelona-El Prat', city: 'Barcelona', country: 'Spain' },
  // Switzerland
  { iata: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland' },
  // Brazil
  { iata: 'GRU', name: 'São Paulo/Guarulhos International', city: 'São Paulo', country: 'Brazil' },
  { iata: 'GIG', name: 'Rio de Janeiro/Galeão International', city: 'Rio de Janeiro', country: 'Brazil' },
  // South Africa
  { iata: 'JNB', name: 'O.R. Tambo International', city: 'Johannesburg', country: 'South Africa' },
  { iata: 'CPT', name: 'Cape Town International', city: 'Cape Town', country: 'South Africa' },
  // Egypt
  { iata: 'CAI', name: 'Cairo International', city: 'Cairo', country: 'Egypt' },
  // Morocco
  { iata: 'CMN', name: 'Mohammed V International', city: 'Casablanca', country: 'Morocco' },
  // Kenya
  { iata: 'NBO', name: 'Jomo Kenyatta International', city: 'Nairobi', country: 'Kenya' },
  // Ethiopia
  { iata: 'ADD', name: 'Addis Ababa Bole International', city: 'Addis Ababa', country: 'Ethiopia' },
  // Indonesia
  { iata: 'CGK', name: 'Soekarno-Hatta International', city: 'Jakarta', country: 'Indonesia' },
  { iata: 'DPS', name: 'Ngurah Rai International', city: 'Bali', country: 'Indonesia' },
  // Vietnam
  { iata: 'SGN', name: 'Tan Son Nhat International', city: 'Ho Chi Minh City', country: 'Vietnam' },
  { iata: 'HAN', name: 'Noi Bai International', city: 'Hanoi', country: 'Vietnam' },
  // Philippines
  { iata: 'MNL', name: 'Ninoy Aquino International', city: 'Manila', country: 'Philippines' },
  // New Zealand
  { iata: 'AKL', name: 'Auckland Airport', city: 'Auckland', country: 'New Zealand' },
  // Ireland
  { iata: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland' },
  // Sweden
  { iata: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'Sweden' },
  // Denmark
  { iata: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark' },
  // Norway
  { iata: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', country: 'Norway' },
  // Finland
  { iata: 'HEL', name: 'Helsinki-Vantaa', city: 'Helsinki', country: 'Finland' },
  // Portugal
  { iata: 'LIS', name: 'Humberto Delgado', city: 'Lisbon', country: 'Portugal' },
  // Greece
  { iata: 'ATH', name: 'Athens International', city: 'Athens', country: 'Greece' },
  // Poland
  { iata: 'WAW', name: 'Warsaw Chopin', city: 'Warsaw', country: 'Poland' },
  // Czech Republic
  { iata: 'PRG', name: 'Václav Havel Airport', city: 'Prague', country: 'Czech Republic' },
  // Austria
  { iata: 'VIE', name: 'Vienna International', city: 'Vienna', country: 'Austria' },
  // Belgium
  { iata: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium' },
  // Russia
  { iata: 'SVO', name: 'Sheremetyevo International', city: 'Moscow', country: 'Russia' },
  { iata: 'LED', name: 'Pulkovo Airport', city: 'Saint Petersburg', country: 'Russia' },
  // Taiwan
  { iata: 'TPE', name: 'Taiwan Taoyuan International', city: 'Taipei', country: 'Taiwan' },
  // Nigeria
  { iata: 'LOS', name: 'Murtala Muhammed International', city: 'Lagos', country: 'Nigeria' },
  // Tanzania
  { iata: 'DAR', name: 'Julius Nyerere International', city: 'Dar es Salaam', country: 'Tanzania' },
  // Jordan
  { iata: 'AMM', name: 'Queen Alia International', city: 'Amman', country: 'Jordan' },
  // Lebanon
  { iata: 'BEY', name: 'Beirut Rafic Hariri International', city: 'Beirut', country: 'Lebanon' },
  // Iraq
  { iata: 'BGW', name: 'Baghdad International', city: 'Baghdad', country: 'Iraq' },
  // Iran
  { iata: 'IKA', name: 'Imam Khomeini International', city: 'Tehran', country: 'Iran' },
  // Afghanistan
  { iata: 'KBL', name: 'Hamid Karzai International', city: 'Kabul', country: 'Afghanistan' },
  // Myanmar
  { iata: 'RGN', name: 'Yangon International', city: 'Yangon', country: 'Myanmar' },
  // Cambodia
  { iata: 'PNH', name: 'Phnom Penh International', city: 'Phnom Penh', country: 'Cambodia' },
];

export function searchAirports(query: string, limit = 8): Airport[] {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  return airports
    .filter((a) =>
      a.iata.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.country.toLowerCase().includes(q)
    )
    .slice(0, limit);
}
