const fs = require('fs');
const path = require('path');

const catPath = path.resolve(__dirname, '../frontend/public/city_buildings_catalog.json');
const catalog = JSON.parse(fs.readFileSync(catPath, 'utf8'));

console.log(`Loaded ${catalog.length} buildings.`);

// 160 authentic Karnataka cultural, geographical, historical and deity names
const karnatakaRoots = [
  'Sri Raghavendra', 'Sri Guru', 'Basaveshwara', 'Sharadamba', 'Chamundeshwari',
  'Venkateshwara', 'Annapoorna', 'Mahalakshmi', 'Siddhivinayaka', 'Gangadhareshwara',
  'Gayathri', 'Saraswathi', 'Dhanalakshmi', 'Prasanna Ganapathi', 'Shankara',
  'Kaveri', 'Sharavathi', 'Hemavathi', 'Tungabhadra', 'Netravathi',
  'Malaprabha', 'Ghataprabha', 'Varada', 'Arkavathi', 'Kumudvathi',
  'Kapila', 'Vedavathi', 'Bhima', 'Suvarnavathi', 'Kaveri Ganga',
  'Hoysala', 'Kadamba', 'Chalukya', 'Rashtrakuta', 'Vijayanagara',
  'Ganga', 'Wodeyar', 'Kempegowda', 'Visvesvaraya', 'Kuvempu',
  'Bendre', 'Karanth', 'Masti', 'Goruru', 'Aluru',
  'Kittur Chennamma', 'Sangolli Rayanna', 'Kanakadasa', 'Purandaradasa', 'Allama Prabhu',
  'Akka Mahadevi', 'Siddhaganga', 'Shivakumara Swamiji', 'Vidyaranya', 'Chamaraja',
  'Nandi', 'Chamundi', 'Sahyadri', 'Agumbe', 'Biligiriranga',
  'Mullayanagiri', 'Kudremukh', 'Bababudan', 'Brahmagiri', 'Pushpagiri',
  'Banavasi', 'Belur', 'Halebidu', 'Hampi', 'Badami',
  'Aihole', 'Pattadakal', 'Melukote', 'Sringeri', 'Dharmasthala',
  'Udupi', 'Gokarna', 'Kukke Subrahmanya', 'Kollur Mookambika', 'Banashankari',
  'Gavi Gangadhareshwara', 'Dodda Ganapathi', 'Kote Venkataramana', 'Kudalasangama', 'Shravanabelagola',
  'Mallige', 'Sampige', 'Parijatha', 'Kalyani', 'Siri Sampige',
  'Aishwarya', 'Anugraha', 'Soubhagya', 'Shanthi', 'Sowparnika',
  'Navodaya', 'Ranganatha', 'Manjunatha', 'Shiva Leela', 'Brindavana',
  'Gokula', 'Vaikunta', 'Ayodhya', 'Nandini', 'Panchavati',
  'Sannidhi', 'Saptagiri', 'Shambhavi', 'Shrinidhi', 'Srinivasa',
  'Surabhi', 'Tejaswi', 'Trinetra', 'Vaishnavi', 'Varalakshmi',
  'Vasantha', 'Vijaya', 'Vinayaka', 'Aditi', 'Akshaya',
  'Amrutha', 'Ananda', 'Aparna', 'Archana', 'Avani',
  'Bhagya', 'Bhavani', 'Chaitanya', 'Chinmaya', 'Devaraja',
  'Divya', 'Gowri', 'Harsha', 'Janani', 'Kamala',
  'Krishnaraja', 'Kusuma', 'Mandara', 'Mayura', 'Meenakshi',
  'Mithila', 'Mukunda', 'Narayana', 'Padmanabha', 'Pranava',
  'Prathiba', 'Punya', 'Rajarajeshwari', 'Rajendra', 'Raksha',
  'Rukmini', 'Sadashiva', 'Sagar', 'Sahana', 'Sai',
  'Seetha', 'Shobha', 'Shubhadra', 'Sowmya', 'Sudha',
  'Sujatha', 'Suman', 'Swathi', 'Vani', 'Vidya',
  'Yadunandana', 'Abhinava', 'Achyuta', 'Aditya', 'Bhargava',
  'Chiranthana', 'Dakshina', 'Girija', 'Ishanya', 'Jagadamba'
];

// Authentic Kannada descriptors / virtues
const karnatakaDescriptors = [
  'Prasanna', 'Krupa', 'Anugraha', 'Ashirwada', 'Samruddhi',
  'Vaibhava', 'Sannidhi', 'Preethi', 'Sneha', 'Shanthi',
  'Siri', 'Sowbhagya', 'Mangala', 'Kalyana', 'Divya',
  'Shubha', 'Punya', 'Ananda', 'Tejas', 'Utsava',
  'Chaitanya', 'Mukthi', 'Vandana', 'Archana', 'Prarthana',
  'Paramananda', 'Amrutha', 'Niranjana', 'Maharshi', 'Dharmika',
  'Sadashiva', 'Pavitra', 'Sarvamangala', 'Abhyudaya', 'Subhodaya',
  'Sampanna', 'Sukrutha', 'Sanmathi', 'Prathishta', 'Yukthi'
];

// Authentic Kannada house suffixes
const karnatakaHouseTypes = [
  'Nilaya', 'Nivasa', 'Kuteera', 'Gruha', 'Bhavana',
  'Nilayam', 'Mane', 'Nivas', 'Ashraya', 'Dhaama',
  'Sannidhi', 'Sadana', 'Kuteer', 'Mandira', 'Darpana',
  'Shree', 'Sadanam', 'Kudil', 'Vaasa', 'Geetha'
];

// Authentic Kannada apartment suffixes
const karnatakaApartmentTypes = [
  'Residency', 'Heights', 'Enclave', 'Vistas', 'Towers',
  'Soudha', 'Samruddhi Apartments', 'Vaibhava Residency', 'Sannidhi Enclave',
  'Shubhodaya Apartments', 'Nisarga Residency', 'Prasiddhi Heights', 'Sankalpa Towers',
  'Ashirwada Residency', 'Abhyudaya Enclave', 'Anugraha Apartments', 'Krupa Vistas',
  'Mandira Residency', 'Samudra Heights', 'Kailasa Towers'
];

// Authentic Kannada commercial suffixes
const karnatakaCommercialTypes = [
  'Vanijya Soudha', 'Vyapara Kendra', 'Vanijya Complex', 'Vyavahara Bhavan',
  'Vanijya Mandira', 'Vardhana Complex', 'Udyoga Soudha', 'Samruddhi Trade Center',
  'Vanijya Bhavan', 'Pragati Complex'
];

// Chamrajpet streets (South sector)
const chamrajpetStreets = [
  '1st Main Road', '2nd Main Road', '3rd Main Road', '4th Main Road',
  '5th Main Road', '6th Main Road', '7th Main Road', '8th Main Road',
  '1st Cross Road', '2nd Cross Road', '3rd Cross Road', '4th Cross Road',
  '5th Cross Road', '6th Cross Road', '7th Cross Road', '8th Cross Road',
  '9th Cross Road', '10th Cross Road', '11th Cross Road', '12th Cross Road',
  '13th Cross Road', '14th Cross Road', '15th Cross Road',
  'Albert Victor Road', 'Bull Temple Road', 'Pampamahakavi Road',
  'Sirsi Circle Road', 'Sanskrit College Road', 'Raghavendra Colony',
  'Royan Circle Road', 'TR Shamanna Park Road', 'Valmiki Nagar',
  'Azad Nagar Main Road', 'Kote Venkataramana Temple Street', 'Tippu Sultan Palace Road',
  'Fort High School Road', 'Minto Hospital Road', 'KR Road'
];

// Basaveshnagar streets (North sector)
const basaveshnagarStreets = [
  '1st Stage 1st Block', '1st Stage 2nd Block', '1st Stage 3rd Block', '1st Stage 4th Block',
  '2nd Stage 1st Block', '2nd Stage 2nd Block', '2nd Stage 3rd Block',
  '3rd Stage 1st Block', '3rd Stage 2nd Block', '3rd Stage 3rd Block', '3rd Stage 4th Block',
  '4th Stage 1st Block', '4th Stage 2nd Block',
  'BEML Layout 1st Stage', 'BEML Layout 2nd Stage', 'BEML Layout 3rd Stage',
  'LIC Colony 1st Main', 'LIC Colony 2nd Main', 'KHB Colony 1st Stage', 'KHB Colony 2nd Stage',
  'Gruhalakshmi Layout 1st Stage', 'Gruhalakshmi Layout 2nd Stage',
  'Saneguruvanahalli Main Road', 'Kamakshipalya Extension',
  'Siddaiah Puranik Road', 'Shankara Math Road', 'Pavithra Paradise Circle Road',
  'West of Chord Road 3rd Stage', 'West of Chord Road 4th Stage', 'Water Tank Road',
  'Havanur Circle Road', 'Kurubarahalli Main Road', 'Modi Hospital Road'
];

const generatedNames = new Set();
const sampleOutput = [];

let houseCount = 0;
let aptCount = 0;
let commCount = 0;

for (let i = 0; i < catalog.length; i++) {
  const b = catalog[i];
  const [cx, cy] = b.center;
  const isBasaveshnagar = cy >= 0;
  const locality = isBasaveshnagar ? 'Basaveshwaranagar' : 'Chamrajpet';
  const pincode = isBasaveshnagar ? '560079' : '560018';
  const streets = isBasaveshnagar ? basaveshnagarStreets : chamrajpetStreets;
  const street = streets[Math.abs(Math.round(cx * 3 + cy * 7)) % streets.length];

  let bldgName = '';
  let houseNo = null;
  let complexName = null;

  if (b.building_type === 'house') {
    houseCount++;
    const root = karnatakaRoots[i % karnatakaRoots.length];
    const desc = karnatakaDescriptors[Math.floor(i / karnatakaRoots.length) % karnatakaDescriptors.length];
    const type = karnatakaHouseTypes[Math.floor(i / (karnatakaRoots.length * karnatakaDescriptors.length)) % karnatakaHouseTypes.length];
    
    // Natural Indian Karnataka name: e.g. "Sri Raghavendra Prasanna Nilaya"
    let candidate = `${root} ${desc} ${type}`;
    
    if (generatedNames.has(candidate)) {
      // Add subtle Karnataka qualifier (e.g. street or door reference)
      const doorNo = (i % 150) + 1;
      candidate = `${root} ${desc} ${type} (Door ${doorNo})`;
    }
    
    if (generatedNames.has(candidate)) {
      candidate = `${root} ${desc} ${type} (${street})`;
    }

    let disambig = 1;
    while (generatedNames.has(candidate)) {
      disambig++;
      candidate = `${root} ${desc} ${type} (${street} - ${disambig})`;
    }

    bldgName = candidate;
    houseNo = `Door ${(i % 150) + 1}`;
    complexName = `${locality} ${street}`;
  } else if (b.building_type === 'apartment') {
    aptCount++;
    const root = karnatakaRoots[(i * 3) % karnatakaRoots.length];
    const desc = karnatakaDescriptors[(i * 5) % karnatakaDescriptors.length];
    const type = karnatakaApartmentTypes[Math.floor(i / karnatakaRoots.length) % karnatakaApartmentTypes.length];
    const block = String.fromCharCode(65 + (i % 6)); // Block A to F
    
    let candidate = `${root} ${desc} ${type} Block ${block}`;
    if (generatedNames.has(candidate)) {
      candidate = `${root} ${desc} ${type} Block ${block} (${locality})`;
    }
    let disambig = 1;
    while (generatedNames.has(candidate)) {
      disambig++;
      candidate = `${root} ${desc} ${type} Block ${block}-${disambig} (${locality})`;
    }

    bldgName = candidate;
    houseNo = `Block ${block}`;
    complexName = `${root} ${desc} ${type}`;
  } else {
    commCount++;
    const root = karnatakaRoots[(i * 11) % karnatakaRoots.length];
    const type = karnatakaCommercialTypes[i % karnatakaCommercialTypes.length];
    
    let candidate = `${root} ${type}`;
    if (generatedNames.has(candidate)) {
      candidate = `${root} ${type} (${street})`;
    }
    let disambig = 1;
    while (generatedNames.has(candidate)) {
      disambig++;
      candidate = `${root} ${type} (${street} Complex-${disambig})`;
    }

    bldgName = candidate;
    houseNo = `Commercial Unit ${(i % 50) + 1}`;
    complexName = `${root} ${type}`;
  }

  generatedNames.add(bldgName);
  const postalAddress = `${bldgName}, ${street}, ${locality}, Bengaluru, Karnataka - ${pincode}`;

  b.name = bldgName;
  b.house_no = houseNo;
  b.complex_name = complexName;
  b.postal_address = postalAddress;

  if (i < 15 || b.id === 'bldg-00010') {
    sampleOutput.push({ id: b.id, type: b.building_type, name: b.name, address: b.postal_address });
  }
}

console.log(`\nGenerated ${generatedNames.size} names out of ${catalog.length}.`);
console.log(`Strict Uniqueness Test: ${generatedNames.size === catalog.length ? 'PASSED (100% UNIQUE - ZERO REPETITION)' : 'FAILED'}`);

console.log('\n--- SAMPLE AUTHENTIC KARNATAKA BUILDINGS ---');
sampleOutput.forEach(s => {
  console.log(`[${s.id}] (${s.type}): ${s.name}`);
  console.log(`  ${s.address}`);
});

// Save to frontend and backend
fs.writeFileSync(catPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log(`\nSaved updated catalog to frontend: ${catPath}`);

const backendCatPath = path.resolve(__dirname, '../backend/city_buildings_catalog.json');
if (fs.existsSync(backendCatPath)) {
  fs.writeFileSync(backendCatPath, JSON.stringify(catalog, null, 2), 'utf8');
  console.log(`Saved updated catalog to backend: ${backendCatPath}`);
}
