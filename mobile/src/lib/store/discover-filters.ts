import { create } from "zustand";
import { ZodiacSign } from "@/lib/astrology";

export interface DiscoverFiltersState {
  zodiacSigns: ZodiacSign[];
  years: number[];
  gender: "all" | "male" | "female";
  hobbies: string[];
  toggleZodiac: (sign: ZodiacSign) => void;
  toggleYear: (year: number) => void;
  setGender: (gender: "all" | "male" | "female") => void;
  toggleHobby: (hobby: string) => void;
  reset: () => void;
}

export const useDiscoverFilters = create<DiscoverFiltersState>((set) => ({
  zodiacSigns: [],
  years: [],
  gender: "all",
  hobbies: [],

  toggleZodiac: (sign) =>
    set((state) => ({
      zodiacSigns: state.zodiacSigns.includes(sign)
        ? state.zodiacSigns.filter((s) => s !== sign)
        : [...state.zodiacSigns, sign],
    })),

  toggleYear: (year) =>
    set((state) => ({
      years: state.years.includes(year)
        ? state.years.filter((y) => y !== year)
        : [...state.years, year],
    })),

  setGender: (gender) => set({ gender }),

  toggleHobby: (hobby) =>
    set((state) => ({
      hobbies: state.hobbies.includes(hobby)
        ? state.hobbies.filter((h) => h !== hobby)
        : [...state.hobbies, hobby],
    })),

  reset: () => set({ zodiacSigns: [], years: [], gender: "all", hobbies: [] }),
}));
