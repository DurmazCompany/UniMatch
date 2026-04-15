import { ZodiacSign } from "@/lib/astrology";

export interface ZodiacOption {
  value: ZodiacSign;
  label: string;
  symbol: string;
}

export const ZODIAC_SIGNS: ZodiacOption[] = [
  { value: "Aries", label: "Koç", symbol: "♈" },
  { value: "Taurus", label: "Boğa", symbol: "♉" },
  { value: "Gemini", label: "İkizler", symbol: "♊" },
  { value: "Cancer", label: "Yengeç", symbol: "♋" },
  { value: "Leo", label: "Aslan", symbol: "♌" },
  { value: "Virgo", label: "Başak", symbol: "♍" },
  { value: "Libra", label: "Terazi", symbol: "♎" },
  { value: "Scorpio", label: "Akrep", symbol: "♏" },
  { value: "Sagittarius", label: "Yay", symbol: "♐" },
  { value: "Capricorn", label: "Oğlak", symbol: "♑" },
  { value: "Aquarius", label: "Kova", symbol: "♒" },
  { value: "Pisces", label: "Balık", symbol: "♓" },
];

export interface YearOption {
  value: number;
  label: string;
}

export const YEAR_OPTIONS: YearOption[] = [
  { value: 1, label: "1. Sınıf" },
  { value: 2, label: "2. Sınıf" },
  { value: 3, label: "3. Sınıf" },
  { value: 4, label: "4. Sınıf+" },
];

export interface GenderOption {
  value: "all" | "male" | "female";
  label: string;
}

export const GENDER_OPTIONS: GenderOption[] = [
  { value: "all", label: "Hepsi" },
  { value: "female", label: "Kadın" },
  { value: "male", label: "Erkek" },
];

export interface HobbyOption {
  value: string;
  label: string;
}

export const HOBBY_OPTIONS: HobbyOption[] = [
  { value: "music", label: "Müzik" },
  { value: "sports", label: "Spor" },
  { value: "travel", label: "Seyahat" },
  { value: "reading", label: "Kitap" },
  { value: "gaming", label: "Oyun" },
  { value: "art", label: "Sanat" },
  { value: "cooking", label: "Yemek" },
  { value: "cinema", label: "Sinema" },
  { value: "photography", label: "Fotoğraf" },
  { value: "nature", label: "Doğa" },
  { value: "dance", label: "Dans" },
  { value: "tech", label: "Teknoloji" },
];
