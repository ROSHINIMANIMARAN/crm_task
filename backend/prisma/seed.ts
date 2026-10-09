import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding EstateFlow database...\n');

  // Clean up existing data in correct order
  await prisma.activity.deleteMany();
  await prisma.note.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.building.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleared existing data');

  // =====================
  // USERS
  // =====================
  const adminHash = await bcrypt.hash('Admin@123', 12);
  const salesHash = await bcrypt.hash('Sales@123', 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Rajesh Kannan',
      email: 'admin@estateflow.com',
      passwordHash: adminHash,
      role: 'ADMIN',
      designation: 'Sales Lead / Admin',
      phone: '+91 98401 23456',
    },
  });

  const sales1 = await prisma.user.create({
    data: {
      name: 'Ananya Sharma',
      email: 'sales1@estateflow.com',
      passwordHash: salesHash,
      role: 'SALES_EMPLOYEE',
      designation: 'Senior Advisor',
      phone: '+91 97910 23456',
    },
  });

  const sales2 = await prisma.user.create({
    data: {
      name: 'Dinesh Raj',
      email: 'sales2@estateflow.com',
      passwordHash: salesHash,
      role: 'SALES_EMPLOYEE',
      designation: 'Negotiations Specialist',
      phone: '+91 99440 23456',
    },
  });

  const sales3 = await prisma.user.create({
    data: {
      name: 'Priya Nair',
      email: 'sales3@estateflow.com',
      passwordHash: salesHash,
      role: 'SALES_EMPLOYEE',
      designation: 'Property Specialist',
      phone: '+91 98765 43210',
    },
  });

  console.log('✓ Created 4 users (1 admin + 3 sales)');

  // =====================
  // PROJECTS
  // =====================
  const greenvista = await prisma.project.create({
    data: {
      name: 'GreenVista Residency',
      location: 'Navalur, OMR Corridor',
      description: 'Premium residential community with 240 luxury units across 3 towers. RERA Approved. Clubhouse 32,000 sq.ft.',
      status: 'ACTIVE',
      reraNumber: 'TN/01/Building/0193/2023',
      totalArea: '3.2 Acres',
      handoverDate: 'Dec 2024',
      corridorDistance: '800m to OMR Toll',
    },
  });

  const urbannest = await prisma.project.create({
    data: {
      name: 'UrbanNest Heights',
      location: 'Sholinganallur Junction',
      description: 'Phase 2 development with modern amenities at Sholinganallur Junction. Phase 2 launch Q3 2025.',
      status: 'ACTIVE',
      reraNumber: 'TN/02/Building/0441/2024',
      totalArea: '2.8 Acres',
      handoverDate: 'Q3 2025',
      corridorDistance: '1.2km to Sholinganallur Signal',
    },
  });

  const skygarden = await prisma.project.create({
    data: {
      name: 'SkyGarden Luxury Villas',
      location: 'ECR / Navalur Link Road',
      description: 'Exclusive luxury villas. Ready to move. ECR frontage with premium amenities.',
      status: 'READY',
      reraNumber: 'TN/03/Building/0812/2023',
      totalArea: '5.5 Acres',
      handoverDate: 'Ready to Move',
      corridorDistance: 'ECR Frontage',
    },
  });

  console.log('✓ Created 3 projects');

  // =====================
  // BUILDINGS
  // =====================
  const towerA = await prisma.building.create({
    data: { projectId: greenvista.id, name: 'Tower A (Imperial)', floors: 12, totalUnits: 96 },
  });
  const towerB = await prisma.building.create({
    data: { projectId: greenvista.id, name: 'Tower B (Regency)', floors: 12, totalUnits: 80 },
  });
  const towerC = await prisma.building.create({
    data: { projectId: greenvista.id, name: 'Tower C (Grand)', floors: 10, totalUnits: 64 },
  });

  const blockA = await prisma.building.create({
    data: { projectId: urbannest.id, name: 'Block A', floors: 10, totalUnits: 90 },
  });
  const blockB = await prisma.building.create({
    data: { projectId: urbannest.id, name: 'Block B', floors: 10, totalUnits: 90 },
  });

  const villaPhase1 = await prisma.building.create({
    data: { projectId: skygarden.id, name: 'Villa Phase I', floors: 2, totalUnits: 30 },
  });
  const villaPhase2 = await prisma.building.create({
    data: { projectId: skygarden.id, name: 'Villa Phase II', floors: 2, totalUnits: 30 },
  });

  console.log('✓ Created 7 buildings');

  // =====================
  // UNITS - Tower A GreenVista
  // =====================
  const towerAData = [];
  const towerAStatuses = ['AVAILABLE', 'RESERVED', 'BOOKED', 'AVAILABLE', 'BLOCKED', 'AVAILABLE', 'AVAILABLE', 'BOOKED', 'AVAILABLE', 'AVAILABLE', 'RESERVED', 'AVAILABLE'];

  for (let floor = 3; floor <= 12; floor++) {
    const floorRise = (floor - 3) * 60000;
    const statusIdx = floor - 3;

    towerAData.push({
      buildingId: towerA.id, unitNumber: `A-${floor}01`,
      type: 'THREE_BHK_LUXURY' as const, floor, area: 1640, carpetArea: 1280,
      price: 11800000 + floorRise, orientation: 'East Facing, 100% Vastu Compliant',
      floorRisePremium: floorRise, parkingPrice: 650000,
      status: towerAStatuses[statusIdx % towerAStatuses.length] as 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'BLOCKED',
      isReraCompliant: true,
    });
    towerAData.push({
      buildingId: towerA.id, unitNumber: `A-${floor}02`,
      type: 'TWO_BHK' as const, floor, area: 1220, carpetArea: 980,
      price: 8650000 + Math.round(floorRise * 0.8), orientation: 'North Facing, Garden Courtyard',
      floorRisePremium: Math.round(floorRise * 0.8), parkingPrice: 450000,
      status: towerAStatuses[(statusIdx + 1) % towerAStatuses.length] as 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'BLOCKED',
      isReraCompliant: true,
    });
    towerAData.push({
      buildingId: towerA.id, unitNumber: `A-${floor}03`,
      type: 'THREE_BHK' as const, floor, area: 1710, carpetArea: 1350,
      price: 12400000 + floorRise, orientation: 'Club View, Balcony Corner',
      floorRisePremium: floorRise, parkingPrice: 650000,
      status: towerAStatuses[(statusIdx + 2) % towerAStatuses.length] as 'AVAILABLE' | 'RESERVED' | 'BOOKED' | 'BLOCKED',
      isReraCompliant: true,
    });
  }
  // Penthouse
  towerAData.push({
    buildingId: towerA.id, unitNumber: 'A-1204',
    type: 'FOUR_BHK' as const, floor: 12, area: 2450, carpetArea: 1960,
    price: 19500000, orientation: 'Skyline Terrace, Double Height Deck',
    floorRisePremium: 0, parkingPrice: 1200000, status: 'AVAILABLE' as const, isReraCompliant: true,
  });

  await prisma.unit.createMany({ data: towerAData });

  // Tower B units
  const towerBData = [];
  for (let floor = 3; floor <= 12; floor++) {
    const floorRise = (floor - 3) * 55000;
    towerBData.push({
      buildingId: towerB.id, unitNumber: `B-${floor}01`,
      type: 'THREE_BHK' as const, floor, area: 1580, carpetArea: 1260,
      price: 10500000 + floorRise, orientation: 'East Facing, Premium Balcony',
      floorRisePremium: floorRise, parkingPrice: 600000,
      status: (floor % 4 === 0 ? 'BOOKED' : 'AVAILABLE') as 'AVAILABLE' | 'BOOKED',
      isReraCompliant: true,
    });
    towerBData.push({
      buildingId: towerB.id, unitNumber: `B-${floor}02`,
      type: 'TWO_BHK' as const, floor, area: 1150, carpetArea: 920,
      price: 8200000 + Math.round(floorRise * 0.75), orientation: 'West Facing, Sunset View',
      floorRisePremium: Math.round(floorRise * 0.75), parkingPrice: 420000,
      status: 'AVAILABLE' as const, isReraCompliant: true,
    });
  }
  await prisma.unit.createMany({ data: towerBData });

  // Tower C units
  const towerCData = [];
  for (let floor = 2; floor <= 10; floor++) {
    const floorRise = (floor - 2) * 50000;
    towerCData.push({
      buildingId: towerC.id, unitNumber: `C-${floor}01`,
      type: 'THREE_BHK_LUXURY' as const, floor, area: 1680, carpetArea: 1320,
      price: 11200000 + floorRise, orientation: 'North East, Courtyard View',
      floorRisePremium: floorRise, parkingPrice: 600000,
      status: (floor % 3 === 0 ? 'RESERVED' : 'AVAILABLE') as 'AVAILABLE' | 'RESERVED',
      isReraCompliant: true,
    });
  }
  await prisma.unit.createMany({ data: towerCData });

  // UrbanNest Block A
  const blockAData = [];
  for (let floor = 2; floor <= 10; floor++) {
    const floorRise = (floor - 2) * 45000;
    blockAData.push({
      buildingId: blockA.id, unitNumber: `UN-A-${floor}01`,
      type: 'TWO_BHK' as const, floor, area: 1100, carpetArea: 880,
      price: 7800000 + floorRise, orientation: 'East Facing',
      floorRisePremium: floorRise, parkingPrice: 380000,
      status: 'AVAILABLE' as const, isReraCompliant: true,
    });
    blockAData.push({
      buildingId: blockA.id, unitNumber: `UN-A-${floor}02`,
      type: 'THREE_BHK' as const, floor, area: 1420, carpetArea: 1140,
      price: 9900000 + floorRise, orientation: 'Clubhouse View',
      floorRisePremium: floorRise, parkingPrice: 520000,
      status: (floor % 3 === 0 ? 'BOOKED' : 'AVAILABLE') as 'AVAILABLE' | 'BOOKED',
      isReraCompliant: true,
    });
    blockAData.push({
      buildingId: blockA.id, unitNumber: `UN-A-${floor}03`,
      type: 'FOUR_BHK' as const, floor, area: 1820, carpetArea: 1460,
      price: 12800000 + floorRise, orientation: 'Corner Unit, Dual Balcony',
      floorRisePremium: floorRise, parkingPrice: 750000,
      status: floor === 5 ? 'BLOCKED' as const : 'AVAILABLE' as const,
      isReraCompliant: true,
    });
  }
  await prisma.unit.createMany({ data: blockAData });

  // UrbanNest Block B
  const blockBData = [];
  for (let floor = 2; floor <= 10; floor++) {
    const floorRise = (floor - 2) * 42000;
    blockBData.push({
      buildingId: blockB.id, unitNumber: `UN-B-${floor}01`,
      type: 'TWO_BHK' as const, floor, area: 1050, carpetArea: 840,
      price: 7400000 + floorRise, orientation: 'North Facing',
      floorRisePremium: floorRise, parkingPrice: 360000,
      status: 'AVAILABLE' as const, isReraCompliant: true,
    });
    blockBData.push({
      buildingId: blockB.id, unitNumber: `UN-B-${floor}02`,
      type: 'THREE_BHK' as const, floor, area: 1380, carpetArea: 1100,
      price: 9400000 + floorRise, orientation: 'Garden View',
      floorRisePremium: floorRise, parkingPrice: 490000,
      status: (floor % 4 === 0 ? 'RESERVED' : 'AVAILABLE') as 'AVAILABLE' | 'RESERVED',
      isReraCompliant: true,
    });
  }
  await prisma.unit.createMany({ data: blockBData });

  // SkyGarden Villas
  const villaData = [];
  for (let i = 1; i <= 15; i++) {
    villaData.push({
      buildingId: villaPhase1.id, unitNumber: `SG-V1-${String(i).padStart(2, '0')}`,
      type: 'VILLA' as const, floor: 1, area: 3200, carpetArea: 2600,
      price: 28000000 + (i % 3) * 2000000, orientation: 'Garden + Pool View',
      floorRisePremium: 0, parkingPrice: 0,
      status: (i <= 10 ? 'BOOKED' : 'AVAILABLE') as 'AVAILABLE' | 'BOOKED',
      isReraCompliant: true,
    });
  }
  for (let i = 1; i <= 15; i++) {
    villaData.push({
      buildingId: villaPhase2.id, unitNumber: `SG-V2-${String(i).padStart(2, '0')}`,
      type: 'VILLA' as const, floor: 1, area: 3500, carpetArea: 2800,
      price: 32000000 + (i % 3) * 2000000, orientation: 'ECR Frontage View',
      floorRisePremium: 0, parkingPrice: 0,
      status: (i <= 5 ? 'BOOKED' : 'AVAILABLE') as 'AVAILABLE' | 'BOOKED',
      isReraCompliant: true,
    });
  }
  await prisma.unit.createMany({ data: villaData });

  console.log('✓ Created 200+ units across all buildings');

  // =====================
  // LEADS
  // =====================
  const leadsInput = [
    {
      name: 'Vikramaditya Sharma', phone: '9840123456', email: 'vikram@techcorp.in',
      designation: 'VP Engineering', organization: 'TechCorp Cloud',
      source: 'CHANNEL_PARTNER' as const, budget: '₹1.20 - 1.40 Cr',
      preferredLocation: 'OMR / Navalur corridor', propertyType: 'THREE_BHK_LUXURY' as const,
      stage: 'NEGOTIATION' as const, priority: 'URGENT' as const,
      assignedToId: admin.id, interestedProjectId: greenvista.id,
      interactionObjective: 'Site inspection & final price signoff with Spouse',
    },
    {
      name: 'Anandha Kumar', phone: '9876501234', email: 'anandha.k@gmail.com',
      designation: 'Senior Manager', organization: 'Apollo Hospitals',
      source: 'PORTAL' as const, budget: '₹1.85 Cr',
      preferredLocation: 'OMR', propertyType: 'THREE_BHK' as const,
      stage: 'INTERESTED' as const, priority: 'HIGH' as const,
      assignedToId: admin.id, interestedProjectId: greenvista.id,
      interactionObjective: 'Revised payment schedule discussion before booking',
    },
    {
      name: 'Priya Sundaram', phone: '9791023456', email: 'priya.s@infosys.com',
      designation: 'Director', organization: 'Infosys BPM',
      source: 'DIGITAL_CAMPAIGN' as const, budget: '₹92 Lakhs',
      preferredLocation: 'Sholinganallur', propertyType: 'TWO_BHK' as const,
      stage: 'SITE_VISIT' as const, priority: 'HIGH' as const,
      assignedToId: sales1.id, interestedProjectId: urbannest.id,
      interactionObjective: 'Physical site visit at Navalur Gate 2',
    },
    {
      name: 'Dr. V. Karthik', phone: '9944099821', email: 'karthik.v@apollohealth.com',
      designation: 'Consultant', organization: 'Apollo Hospitals, OMR',
      source: 'REFERRAL' as const, budget: '₹1.42 Cr',
      preferredLocation: 'OMR', propertyType: 'THREE_BHK_LUXURY' as const,
      stage: 'NEGOTIATION' as const, priority: 'MEDIUM' as const,
      assignedToId: admin.id, interestedProjectId: greenvista.id,
      interactionObjective: 'Final agreement draft & festive launch rebate clarity',
    },
    {
      name: 'Meenakshi Ramanathan', phone: '9876543210', email: 'meenakshi.r@gmail.com',
      designation: 'NRI Client Dubai', organization: 'NRI Dubai',
      source: 'NRI_REFERRAL' as const, budget: '₹1.15 Cr',
      preferredLocation: 'OMR / Navalur', propertyType: 'THREE_BHK' as const,
      stage: 'CONTACTED' as const, priority: 'MEDIUM' as const,
      assignedToId: sales3.id, interestedProjectId: urbannest.id,
      interactionObjective: 'WhatsApp follow-up on NRI power of attorney documents',
    },
    {
      name: 'S. Balasubramanian', phone: '9884512345', email: 'bala.s@nriwire.com',
      designation: 'Business Owner', organization: 'NRI Singapore',
      source: 'NRI_REFERRAL' as const, budget: '₹2.45 Cr',
      preferredLocation: 'ECR / Navalur', propertyType: 'VILLA' as const,
      stage: 'BOOKED' as const, priority: 'HIGH' as const,
      assignedToId: admin.id, interestedProjectId: skygarden.id,
      interactionObjective: 'Booking confirmed - allotment letter pending',
    },
    {
      name: 'Kavitha Rajan', phone: '9901234567', email: 'kavitha.r@gmail.com',
      designation: 'Teacher', organization: 'Govt School',
      source: 'SITE_WALK_IN' as const, budget: '₹75 Lakhs',
      preferredLocation: 'Tambaram', propertyType: 'TWO_BHK' as const,
      stage: 'NEW' as const, priority: 'LOW' as const,
      assignedToId: sales2.id, interestedProjectId: urbannest.id,
    },
    {
      name: 'Ramesh Krishnamurthy', phone: '9823456789', email: 'ramesh.k@tcs.com',
      designation: 'Senior Software Engineer', organization: 'TCS',
      source: 'PORTAL' as const, budget: '₹85 Lakhs',
      preferredLocation: 'Sholinganallur', propertyType: 'TWO_BHK' as const,
      stage: 'CONTACTED' as const, priority: 'MEDIUM' as const,
      assignedToId: sales1.id, interestedProjectId: urbannest.id,
    },
    {
      name: 'Deepa Venkataraman', phone: '9912345678', email: 'deepa.v@cognizant.com',
      designation: 'HR Manager', organization: 'Cognizant',
      source: 'DIGITAL_CAMPAIGN' as const, budget: '₹1.10 Cr',
      preferredLocation: 'OMR', propertyType: 'THREE_BHK' as const,
      stage: 'SITE_VISIT' as const, priority: 'HIGH' as const,
      assignedToId: sales2.id, interestedProjectId: greenvista.id,
    },
    {
      name: 'Arjun Sundaresan', phone: '9867891234', email: 'arjun.s@wipro.com',
      designation: 'Principal Architect', organization: 'Wipro',
      source: 'REFERRAL' as const, budget: '₹1.80 Cr',
      preferredLocation: 'Navalur', propertyType: 'THREE_BHK_LUXURY' as const,
      stage: 'INTERESTED' as const, priority: 'HIGH' as const,
      assignedToId: admin.id, interestedProjectId: greenvista.id,
    },
    {
      name: 'Sunitha Moorthy', phone: '9845678901', email: 'sunitha.m@gmail.com',
      designation: 'Business Analyst', organization: 'Capgemini',
      source: 'CHANNEL_PARTNER' as const, budget: '₹95 Lakhs',
      preferredLocation: 'Navalur', propertyType: 'TWO_BHK' as const,
      stage: 'NEW' as const, priority: 'MEDIUM' as const,
      assignedToId: sales3.id, interestedProjectId: greenvista.id,
    },
    {
      name: 'Prakash Natarajan', phone: '9834561234', email: 'prakash.n@hdfcbank.com',
      designation: 'Branch Manager', organization: 'HDFC Bank',
      source: 'DIRECT' as const, budget: '₹1.30 Cr',
      preferredLocation: 'OMR', propertyType: 'THREE_BHK' as const,
      stage: 'NEGOTIATION' as const, priority: 'HIGH' as const,
      assignedToId: sales2.id, interestedProjectId: greenvista.id,
    },
    {
      name: 'Leena Thomas', phone: '9922345678', email: 'leena.t@gmail.com',
      designation: 'Doctor', organization: 'SRM Hospital',
      source: 'REFERRAL' as const, budget: '₹1.60 Cr',
      preferredLocation: 'ECR / OMR', propertyType: 'THREE_BHK_LUXURY' as const,
      stage: 'INTERESTED' as const, priority: 'HIGH' as const,
      assignedToId: sales1.id, interestedProjectId: skygarden.id,
    },
    {
      name: 'Mohammed Faizal', phone: '9933445566', email: 'faizal.m@gmail.com',
      designation: 'IT Consultant', organization: 'Freelancer',
      source: 'DIGITAL_CAMPAIGN' as const, budget: '₹80 Lakhs',
      preferredLocation: 'Sholinganallur', propertyType: 'TWO_BHK' as const,
      stage: 'NEW' as const, priority: 'LOW' as const,
      assignedToId: sales3.id, interestedProjectId: urbannest.id,
    },
    {
      name: 'Sudha Balakrishnan', phone: '9844332211', email: 'sudha.b@gmail.com',
      designation: 'Professor', organization: 'Anna University',
      source: 'SITE_WALK_IN' as const, budget: '₹70 Lakhs',
      preferredLocation: 'Tambaram', propertyType: 'TWO_BHK' as const,
      stage: 'CONTACTED' as const, priority: 'MEDIUM' as const,
      assignedToId: sales1.id, interestedProjectId: urbannest.id,
    },
  ];

  const createdLeads = [];
  for (let i = 0; i < leadsInput.length; i++) {
    const lead = await prisma.lead.create({
      data: {
        ...leadsInput[i],
        leadNumber: `LD-${String(1001 + i).padStart(4, '0')}`,
        nextFollowUp: new Date(Date.now() + (i % 5) * 24 * 60 * 60 * 1000),
        lastContacted: new Date(Date.now() - (i + 1) * 2 * 24 * 60 * 60 * 1000),
      },
    });
    createdLeads.push(lead);
  }

  console.log(`✓ Created ${createdLeads.length} leads`);

  // =====================
  // FOLLOW-UPS
  // =====================
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const followUpsData = [
    { leadIdx: 0, assignedTo: admin.id, daysOffset: 0, hour: 10, type: 'CALL' as const, priority: 'URGENT' as const, notes: 'Revised payment schedule - HDFC disbursement NOC requested', status: 'PENDING' as const },
    { leadIdx: 1, assignedTo: admin.id, daysOffset: 0, hour: 10, type: 'CALL' as const, priority: 'URGENT' as const, notes: 'Requested revised payment schedule linked to construction stages', status: 'PENDING' as const },
    { leadIdx: 2, assignedTo: sales1.id, daysOffset: 0, hour: 14, type: 'SITE_VISIT' as const, priority: 'HIGH' as const, notes: 'Physical site visit at Navalur Gate 2', status: 'PENDING' as const },
    { leadIdx: 3, assignedTo: admin.id, daysOffset: 0, hour: 17, type: 'NEGOTIATION' as const, priority: 'HIGH' as const, notes: 'Token Negotiation at City Office - Reviewing final agreement draft', status: 'PENDING' as const },
    { leadIdx: 4, assignedTo: sales3.id, daysOffset: 0, hour: 18, type: 'WHATSAPP' as const, priority: 'MEDIUM' as const, notes: 'Follow up on NRI power of attorney - Dubai Consulate attestation', status: 'PENDING' as const },
    { leadIdx: 5, assignedTo: admin.id, daysOffset: -1, hour: 10, type: 'CALL' as const, priority: 'HIGH' as const, notes: 'Confirmed booking - allotment letter review call', status: 'COMPLETED' as const },
    { leadIdx: 7, assignedTo: sales1.id, daysOffset: 2, hour: 11, type: 'SITE_VISIT' as const, priority: 'MEDIUM' as const, notes: 'Schedule site visit for UrbanNest Heights Block B', status: 'PENDING' as const },
    { leadIdx: 8, assignedTo: sales2.id, daysOffset: 1, hour: 15, type: 'CALL' as const, priority: 'HIGH' as const, notes: 'Follow up on site visit feedback and next steps', status: 'PENDING' as const },
    { leadIdx: 9, assignedTo: admin.id, daysOffset: 3, hour: 16, type: 'MEETING' as const, priority: 'HIGH' as const, notes: 'Price negotiation meeting - offer price discussion', status: 'PENDING' as const },
    { leadIdx: 10, assignedTo: sales3.id, daysOffset: -2, hour: 12, type: 'CALL' as const, priority: 'MEDIUM' as const, notes: 'Initial inquiry response - property overview call', status: 'PENDING' as const },
    { leadIdx: 11, assignedTo: sales2.id, daysOffset: -1, hour: 11, type: 'CALL' as const, priority: 'HIGH' as const, notes: 'Negotiation follow-up - final pricing discussion', status: 'PENDING' as const },
    { leadIdx: 12, assignedTo: sales1.id, daysOffset: 4, hour: 14, type: 'SITE_VISIT' as const, priority: 'MEDIUM' as const, notes: 'Villa site visit scheduled', status: 'PENDING' as const },
  ];

  for (const fu of followUpsData) {
    const fuDate = new Date(today);
    fuDate.setDate(fuDate.getDate() + fu.daysOffset);
    fuDate.setHours(fu.hour, 30, 0, 0);

    await prisma.followUp.create({
      data: {
        leadId: createdLeads[fu.leadIdx].id,
        assignedToId: fu.assignedTo,
        followUpDate: fuDate,
        type: fu.type,
        priority: fu.priority,
        notes: fu.notes,
        status: fu.status,
      },
    });
  }

  console.log('✓ Created 12 follow-ups');

  // =====================
  // NOTES
  // =====================
  await prisma.note.createMany({
    data: [
      {
        leadId: createdLeads[0].id, userId: admin.id,
        content: 'Customer toured GreenVista Mockup Flat Tower A (14th floor). Highly keen on East facing corner balcony. Requested waiver on floor-rise charges for Floor 14. Ready to disburse ₹5,00,000 token advance if agreed on ₹1.28 Cr all-inclusive. Bank approval active with HDFC for ₹1 Cr.',
        tags: ['HDFC Pre-approved', 'Prefers 2 Covered Car Parks', 'Possession: Immediate'],
      },
      {
        leadId: createdLeads[1].id, userId: admin.id,
        content: 'Apollo Hospital provides housing loan at 8.5% for employees. Needs NOC approval from HR. Interested in corner unit on higher floor. Has budget flexibility up to ₹1.95 Cr.',
        tags: ['High Value', 'Bank Pre-approved', 'Employee Quota'],
      },
      {
        leadId: createdLeads[2].id, userId: sales1.id,
        content: 'Family liked clubhouse amenities on initial video deck; checking Vastu orientation for Master Bedroom and kitchen water inlet placement. Prefers North-East corner unit.',
        tags: ['Family Visit', 'Vastu Check', '4 BHK Penthouse Interest'],
      },
      {
        leadId: createdLeads[3].id, userId: admin.id,
        content: 'Reviewing final agreement draft and festive launch rebate. Clarify registration and GST component breakdown. Client requesting ₹1.5L additional discount for festive season.',
        tags: ['Agreement Stage', 'Festive Rebate', 'GST Clarity'],
      },
      {
        leadId: createdLeads[4].id, userId: sales3.id,
        content: 'NRI client from Dubai. Needs attestation of PAN card from Indian Consulate. Awaiting scanned copy. Power of attorney for spouse pending - required for registration.',
        tags: ['NRI Client', 'POA Pending', 'Dubai Consulate'],
      },
    ],
  });

  console.log('✓ Created 5 lead notes');

  // =====================
  // ACTIVITIES
  // =====================
  await prisma.activity.createMany({
    data: [
      { leadId: createdLeads[0].id, userId: admin.id, action: 'LEAD_CREATED', description: 'Lead created via Channel Partner (Anarock Realty)', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
      { leadId: createdLeads[0].id, userId: admin.id, action: 'STAGE_CHANGED', description: 'Stage changed from NEW to CONTACTED by Rajesh Kannan', createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000) },
      { leadId: createdLeads[0].id, userId: admin.id, action: 'STAGE_CHANGED', description: 'Stage changed from CONTACTED to SITE_VISIT by Rajesh Kannan', createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      { leadId: createdLeads[0].id, userId: admin.id, action: 'STAGE_CHANGED', description: 'Stage changed from SITE_VISIT to INTERESTED by Rajesh Kannan', createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      { leadId: createdLeads[0].id, userId: admin.id, action: 'STAGE_CHANGED', description: 'Stage changed from INTERESTED to NEGOTIATION by Rajesh Kannan', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { leadId: createdLeads[0].id, userId: admin.id, action: 'NOTE_ADDED', description: 'Note added by Rajesh Kannan - site visit details and token advance discussion', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { leadId: createdLeads[1].id, userId: admin.id, action: 'LEAD_CREATED', description: 'Lead created via Portal (99acres)', createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
      { leadId: createdLeads[1].id, userId: admin.id, action: 'STAGE_CHANGED', description: 'Stage changed from NEW to INTERESTED by Rajesh Kannan', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { leadId: createdLeads[5].id, userId: admin.id, action: 'LEAD_CREATED', description: 'Lead created via NRI Referral', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      { leadId: createdLeads[5].id, userId: admin.id, action: 'STAGE_CHANGED', description: 'Stage changed from NEGOTIATION to BOOKED - Booking confirmed', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    ],
  });

  console.log('✓ Created activity logs');

  // =====================
  // BOOKINGS (using already-booked units)
  // =====================
  const bookedUnit1 = await prisma.unit.findFirst({
    where: { buildingId: towerA.id, status: 'BOOKED' },
  });
  const bookedUnit2 = await prisma.unit.findFirst({
    where: { buildingId: blockA.id, status: 'BOOKED' },
  });
  const bookedVilla = await prisma.unit.findFirst({
    where: { buildingId: villaPhase1.id, status: 'BOOKED' },
  });

  if (bookedUnit1) {
    await prisma.booking.create({
      data: {
        bookingNumber: 'BK-1001',
        leadId: createdLeads[5].id,
        unitId: bookedUnit1.id,
        projectId: greenvista.id,
        salesEmployeeId: admin.id,
        bookingAmount: 500000,
        totalPrice: bookedUnit1.price + (bookedUnit1.floorRisePremium || 0) + (bookedUnit1.parkingPrice || 0),
        paymentMethod: 'RTGS_NEFT',
        bankUtr: 'HDFC0092837192',
        bankName: 'HDFC Bank - Anna Nagar Branch',
        status: 'CONFIRMED',
        bookingDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        notes: 'PTSD cleared, token advance confirmed, allotment letter issued',
      },
    });
  }

  if (bookedUnit2) {
    await prisma.booking.create({
      data: {
        bookingNumber: 'BK-1002',
        leadId: createdLeads[4].id,
        unitId: bookedUnit2.id,
        projectId: urbannest.id,
        salesEmployeeId: sales1.id,
        bookingAmount: 300000,
        totalPrice: bookedUnit2.price + (bookedUnit2.floorRisePremium || 0),
        paymentMethod: 'CHEQUE_DD',
        bankName: 'Cheque - Cleared',
        status: 'CONFIRMED',
        bookingDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        notes: 'Cheque cleared, KYC documents submitted',
      },
    });
  }

  if (bookedVilla) {
    await prisma.booking.create({
      data: {
        bookingNumber: 'BK-1003',
        leadId: createdLeads[5].id,
        unitId: bookedVilla.id,
        projectId: skygarden.id,
        salesEmployeeId: admin.id,
        bookingAmount: 1000000,
        totalPrice: bookedVilla.price,
        paymentMethod: 'RTGS_NEFT',
        bankUtr: 'SBI0048293847',
        bankName: 'SBI - Adyar Branch',
        status: 'CONFIRMED',
        bookingDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        notes: 'NRI Wire Transfer - SBI confirmation received',
      },
    });
  }

  console.log('✓ Created 3 demo bookings');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('  Admin:  admin@estateflow.com  /  Admin@123');
  console.log('  Sales1: sales1@estateflow.com /  Sales@123');
  console.log('  Sales2: sales2@estateflow.com /  Sales@123');
  console.log('  Sales3: sales3@estateflow.com /  Sales@123\n');
}

main()
  .catch((error) => {
    console.error('Seed error:', error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
