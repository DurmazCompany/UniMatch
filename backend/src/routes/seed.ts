import { Hono } from "hono";
import { prisma } from "../prisma";
import { randomUUID } from "crypto";
import { calculateProfilePower } from "../lib/profile-power";

export const seedRouter = new Hono();

// Turkish female names
const femaleNames = [
  "Elif", "Zeynep", "Ece", "Buse", "Deniz", "Ayşe", "Merve", "Ceren",
  "Selin", "Defne", "Yağmur", "İrem", "Cansu", "Simge", "Melis"
];

// Turkish male names
const maleNames = [
  "Can", "Ege", "Kaan", "Berk", "Emre", "Burak", "Mert", "Yusuf",
  "Arda", "Deniz", "Onur", "Barış", "Kerem", "Alp", "Ozan"
];

// Turkish universities
const universities = [
  "Boğaziçi Üniversitesi",
  "İstanbul Teknik Üniversitesi",
  "Orta Doğu Teknik Üniversitesi",
  "Koç Üniversitesi",
  "Sabancı Üniversitesi",
  "Bilkent Üniversitesi",
  "Galatasaray Üniversitesi",
  "Bahçeşehir Üniversitesi"
];

// Departments
const departments = [
  "Bilgisayar Mühendisliği",
  "İşletme",
  "Psikoloji",
  "Mimarlık",
  "Hukuk",
  "Tıp",
  "İletişim",
  "Ekonomi",
  "Elektrik Mühendisliği",
  "Endüstri Mühendisliği"
];

// Hobbies
const hobbies = [
  "kahve", "yoga", "seyahat", "müzik", "kitap",
  "fotoğrafçılık", "spor", "sinema", "yemek", "dans",
  "koşu", "yüzme", "resim", "gitar", "tiyatro"
];

// Turkish bios
const femaleBios = [
  "Kahve bağımlısı, kitap kurdu. Yeni yerler keşfetmeyi seviyorum.",
  "Müzik ve sanat tutkunu. Her anın tadını çıkarıyorum.",
  "Seyahat etmek için yaşıyorum. Bir sonraki rotayı planlıyorum.",
  "Dans etmeyi ve güzel yemekler yemeyi seviyorum.",
  "Hayatın güzel yanlarını arıyorum. Pozitif enerjili insanları seviyorum.",
  "Yoga ve meditasyon ile iç huzuru buldum. Doğa yürüyüşlerini seviyorum.",
  "Film izlemek ve müzik dinlemek en sevdiğim aktiviteler.",
  "Fotoğrafçılık hobim, anları yakalamayı seviyorum.",
  "Koşmak ve sağlıklı yaşam benim için önemli.",
  "Yeni insanlar tanımak ve farklı kültürler öğrenmek ilgimi çekiyor."
];

const maleBios = [
  "Yazılım geliştirici, müzik tutkunu. Gitar çalmayı seviyorum.",
  "Spor ve fitness hayatımın büyük bir parçası.",
  "Seyahat ve macera peşindeyim. Yeni deneyimler arıyorum.",
  "Kahve bağımlısı, teknoloji meraklısı.",
  "Film ve dizi izlemeyi seven bir sinefil.",
  "Basketbol ve yüzme ile uğraşıyorum. Aktif kalmayı seviyorum.",
  "Kitap okumak ve yeni şeyler öğrenmek beni mutlu ediyor.",
  "Müzik hayatımın her anında var. Konserlere gitmeyi seviyorum.",
  "Doğa sporları ve kamp yapmak hobim.",
  "İyi sohbetin ve güler yüzün peşindeyim."
];

// Unsplash portrait photo URLs (specific portrait photos)
const femalePhotos = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1485875437342-9b39470b3d95?w=400&h=600&fit=crop"
];

const malePhotos = [
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1504257432389-52343af06ae3?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1488161628813-04466f0be7b8?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1528763380143-65b3ac5c3f3e?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1519058082700-08a0b56da9b4?w=400&h=600&fit=crop"
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function getRandomElements<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getRandomAge(): number {
  return Math.floor(Math.random() * (25 - 18 + 1)) + 18;
}

function getBirthDateFromAge(age: number): Date {
  const now = new Date();
  const birthYear = now.getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12);
  const birthDay = Math.floor(Math.random() * 28) + 1;
  return new Date(birthYear, birthMonth, birthDay);
}

function getRandomPhotos(isFemale: boolean): string[] {
  const photoPool = isFemale ? femalePhotos : malePhotos;
  const count = Math.floor(Math.random() * 3) + 2; // 2-4 photos
  const shuffled = [...photoPool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getRandomLifestyle(): string {
  const schedules = ["morning", "night"];
  const spots = ["library", "cafeteria", "outdoor"];
  return JSON.stringify({
    schedule: getRandomElement(schedules),
    spot: getRandomElement(spots),
  });
}

// POST /api/seed/profiles - create fake Turkish profiles
seedRouter.post("/profiles", async (c) => {
  const createdProfiles = [];
  const profileCount = Math.floor(Math.random() * 6) + 10; // 10-15 profiles

  for (let i = 0; i < profileCount; i++) {
    const isFemale = Math.random() > 0.5;
    const name = isFemale ? getRandomElement(femaleNames) : getRandomElement(maleNames);
    const age = getRandomAge();
    const birthDate = getBirthDateFromAge(age);
    const gender = isFemale ? "Kadın" : "Erkek";
    const university = getRandomElement(universities);
    const department = getRandomElement(departments);
    const year = Math.floor(Math.random() * 4) + 1; // 1-4
    const bio = isFemale ? getRandomElement(femaleBios) : getRandomElement(maleBios);
    const selectedHobbies = getRandomElements(hobbies, 2, 5);
    const photos = getRandomPhotos(isFemale);

    const photosJson = JSON.stringify(photos);
    const hobbiesJson = JSON.stringify(selectedHobbies);

    const power = calculateProfilePower({
      photos: photosJson,
      bio,
      hobbies: hobbiesJson,
      selfieVerified: Math.random() > 0.5,
    });

    // Create a fake user first
    const userId = randomUUID();
    const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const email = `${name.toLowerCase().replace(/[ğüşöçıİ]/g, c => {
      const map: Record<string, string> = { 'ğ': 'g', 'ü': 'u', 'ş': 's', 'ö': 'o', 'ç': 'c', 'ı': 'i', 'İ': 'i' };
      return map[c] || c;
    })}_${uniqueSuffix}@test.com`;

    try {
      // Create fake user
      await prisma.user.create({
        data: {
          id: userId,
          name,
          email,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create profile for the user
      const profile = await prisma.profile.create({
        data: {
          id: randomUUID(),
          userId,
          university,
          name,
          birthDate,
          gender,
          department,
          year,
          bio,
          photos: photosJson,
          hobbies: hobbiesJson,
          lifestyle: getRandomLifestyle(),
          selfieVerified: Math.random() > 0.5,
          profilePower: power,
          isPremium: Math.random() > 0.8, // 20% premium
          isOnCampusToday: Math.random() > 0.5,
          onCampusTodayDate: Math.random() > 0.5 ? new Date() : null,
        },
      });

      createdProfiles.push({
        id: profile.id,
        name: profile.name,
        university: profile.university,
        department: profile.department,
        gender: profile.gender,
        age,
      });
    } catch (error) {
      console.error(`Failed to create profile for ${name}:`, error);
    }
  }

  return c.json({
    data: {
      message: `Created ${createdProfiles.length} fake profiles`,
      profiles: createdProfiles,
    },
  });
});

// DELETE /api/seed/profiles - delete all seed profiles (test users)
seedRouter.delete("/profiles", async (c) => {
  const testUsers = await prisma.user.findMany({
    where: {
      email: {
        endsWith: "@test.com",
      },
    },
  });

  const count = testUsers.length;

  if (count > 0) {
    await prisma.user.deleteMany({
      where: {
        email: {
          endsWith: "@test.com",
        },
      },
    });
  }

  return c.json({
    data: {
      message: `Deleted ${count} test profiles`,
    },
  });
});
