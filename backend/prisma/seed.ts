import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Turkish universities with their email domains
const turkishUniversities = [
  { name: "Hacettepe Universitesi", domain: "hacettepe.edu.tr" },
  { name: "Ankara Universitesi", domain: "ankara.edu.tr" },
  { name: "Orta Dogu Teknik Universitesi", domain: "metu.edu.tr" },
  { name: "Bogazici Universitesi", domain: "boun.edu.tr" },
  { name: "Istanbul Teknik Universitesi", domain: "itu.edu.tr" },
  { name: "Koc Universitesi", domain: "ku.edu.tr" },
  { name: "Sabanci Universitesi", domain: "sabanciuniv.edu" },
  { name: "Bilkent Universitesi", domain: "bilkent.edu.tr" },
  { name: "Ege Universitesi", domain: "ege.edu.tr" },
  { name: "Dokuz Eylul Universitesi", domain: "deu.edu.tr" },
];

// Turkish names
const femaleNames = [
  "Elif", "Zeynep", "Ayse", "Fatma", "Merve", "Busra", "Selin", "Deniz", "Ceren", "Irem"
];

const maleNames = [
  "Mehmet", "Ahmet", "Mustafa", "Ali", "Emre", "Can", "Burak", "Cem", "Kaan", "Arda"
];

const lastNames = [
  "Yilmaz", "Kaya", "Demir", "Celik", "Sahin", "Yildiz", "Ozturk", "Aydin", "Ozdemir", "Arslan"
];

// Departments
const departments = [
  "Bilgisayar Muhendisligi",
  "Psikoloji",
  "Isletme",
  "Tip",
  "Hukuk",
  "Mimarlik",
  "Elektrik Elektronik Muhendisligi",
  "Makine Muhendisligi",
  "Ekonomi",
  "Uluslararasi Iliskiler",
];

// Turkish hobbies
const hobbies = [
  "Muzik", "Spor", "Seyahat", "Kitap", "Film", "Yemek", "Dans", "Fotografcilik",
  "Yoga", "Kosu", "Yuzme", "Bisiklet", "Oyun", "Resim", "Tiyatro", "Sinema",
  "Kahve", "Dogа Yuruyusu", "Futbol", "Basketbol"
];

// Turkish bios
const bios = [
  "Hayat kisa, kus ucuyor. Yeni insanlarla tanismak ve guzel anlar biriktirmek istiyorum.",
  "Kahve bagimlisi, kitap kurdu. Derin sohbetlere bayilirim.",
  "Muzik ruhun gidasi. Gitarimla birlikte mutlu bir hayat yasiyorum.",
  "Seyahat etmeyi ve yeni kulturler kesfetmeyi cok seviyorum.",
  "Spor hayatimin vazgecilmezi. Aktif bir yasam tarzi benim icin onemli.",
  "Film izlemeyi ve sonrasinda tartismayi seviyorum. Favori turlerim: dram ve bilim kurgu.",
  "Yemek yapmak benim meditasyonum. Mutfakta yaratici olmak bana huzur veriyor.",
  "Fotografcilik tutkum. Anilari oldurmek icin kameramla dolasiyorum.",
  "Dogayi seviyorum, hafta sonlari dag yuruyusune cikiyorum.",
  "Tiyatro ve sinema asigi. Sanat benim icin bir yasam bicimi.",
];

// Generate a random date between min and max years ago
function randomBirthDate(minAge: number, maxAge: number): Date {
  const now = new Date();
  const minYear = now.getFullYear() - maxAge;
  const maxYear = now.getFullYear() - minAge;
  const year = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month, day);
}

// Get random items from array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Generate random ID
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Profile data type
interface ProfileData {
  gender: string;
  name: string;
  university: { name: string; domain: string };
  department: string;
  year: number;
  bio: string;
  hobbies: string[];
  verified: boolean;
  profilePower: number;
  streakCount: number;
}

async function main() {
  console.log("Seeding database with sample profiles...");

  // Create 10 sample profiles
  const profiles: ProfileData[] = [
    {
      gender: "female",
      name: "Elif Yilmaz",
      university: turkishUniversities[0]!,
      department: "Psikoloji",
      year: 3,
      bio: bios[0]!,
      hobbies: ["Kitap", "Kahve", "Muzik", "Yoga"],
      verified: true,
      profilePower: 85,
      streakCount: 7,
    },
    {
      gender: "male",
      name: "Emre Kaya",
      university: turkishUniversities[1]!,
      department: "Bilgisayar Muhendisligi",
      year: 4,
      bio: bios[1]!,
      hobbies: ["Oyun", "Film", "Muzik", "Spor"],
      verified: true,
      profilePower: 92,
      streakCount: 14,
    },
    {
      gender: "female",
      name: "Zeynep Demir",
      university: turkishUniversities[2]!,
      department: "Mimarlik",
      year: 2,
      bio: bios[7]!,
      hobbies: ["Fotografcilik", "Seyahat", "Resim", "Kahve"],
      verified: false,
      profilePower: 68,
      streakCount: 3,
    },
    {
      gender: "male",
      name: "Can Celik",
      university: turkishUniversities[3]!,
      department: "Isletme",
      year: 3,
      bio: bios[4]!,
      hobbies: ["Futbol", "Kosu", "Spor", "Seyahat"],
      verified: true,
      profilePower: 78,
      streakCount: 5,
    },
    {
      gender: "female",
      name: "Selin Sahin",
      university: turkishUniversities[4]!,
      department: "Elektrik Elektronik Muhendisligi",
      year: 4,
      bio: bios[2]!,
      hobbies: ["Muzik", "Dans", "Tiyatro", "Film"],
      verified: true,
      profilePower: 88,
      streakCount: 10,
    },
    {
      gender: "male",
      name: "Burak Yildiz",
      university: turkishUniversities[5]!,
      department: "Tip",
      year: 5,
      bio: bios[8]!,
      hobbies: ["Doga Yuruyusu", "Bisiklet", "Yuzme", "Kitap"],
      verified: true,
      profilePower: 95,
      streakCount: 21,
    },
    {
      gender: "female",
      name: "Merve Ozturk",
      university: turkishUniversities[6]!,
      department: "Hukuk",
      year: 2,
      bio: bios[9]!,
      hobbies: ["Tiyatro", "Sinema", "Kitap", "Kahve"],
      verified: false,
      profilePower: 55,
      streakCount: 1,
    },
    {
      gender: "male",
      name: "Kaan Aydin",
      university: turkishUniversities[7]!,
      department: "Ekonomi",
      year: 3,
      bio: bios[3]!,
      hobbies: ["Seyahat", "Fotografcilik", "Yemek", "Muzik"],
      verified: true,
      profilePower: 72,
      streakCount: 4,
    },
    {
      gender: "female",
      name: "Ceren Ozdemir",
      university: turkishUniversities[8]!,
      department: "Uluslararasi Iliskiler",
      year: 1,
      bio: bios[5]!,
      hobbies: ["Film", "Sinema", "Kitap", "Seyahat"],
      verified: false,
      profilePower: 45,
      streakCount: 0,
    },
    {
      gender: "male",
      name: "Arda Arslan",
      university: turkishUniversities[9]!,
      department: "Makine Muhendisligi",
      year: 4,
      bio: bios[6]!,
      hobbies: ["Yemek", "Seyahat", "Futbol", "Muzik"],
      verified: true,
      profilePower: 80,
      streakCount: 8,
    },
  ];

  for (const [index, profile] of profiles.entries()) {
    const userId = generateId();
    const profileId = generateId();
    const email = `test${index + 1}@${profile.university.domain}`;

    // Create user first
    await prisma.user.create({
      data: {
        id: userId,
        name: profile.name,
        email: email,
        emailVerified: profile.verified,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create profile
    await prisma.profile.create({
      data: {
        id: profileId,
        userId: userId,
        university: profile.university.name,
        name: profile.name,
        birthDate: randomBirthDate(18, 25),
        gender: profile.gender,
        department: profile.department,
        year: profile.year,
        bio: profile.bio,
        photos: JSON.stringify([
          `https://picsum.photos/seed/profile${index + 1}a/400/600`,
          `https://picsum.photos/seed/profile${index + 1}b/400/600`,
          `https://picsum.photos/seed/profile${index + 1}c/400/600`,
        ]),
        hobbies: JSON.stringify(profile.hobbies),
        selfieVerified: profile.verified,
        profilePower: profile.profilePower,
        streakCount: profile.streakCount,
        lastStreakDate: profile.streakCount > 0 ? new Date() : null,
        swipesToday: Math.floor(Math.random() * 10),
        lastSwipeDate: new Date(),
        superLikesLeft: Math.floor(Math.random() * 3) + 1,
        isOnCampusToday: Math.random() > 0.5,
        onCampusTodayDate: Math.random() > 0.5 ? new Date() : null,
        isPremium: Math.random() > 0.7,
        premiumUntil: Math.random() > 0.7 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`Created profile: ${profile.name} (${email})`);
  }

  console.log("\nSeeding completed! Created 10 sample profiles.");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
