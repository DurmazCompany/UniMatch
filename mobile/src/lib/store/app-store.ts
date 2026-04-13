import { create } from "zustand";

interface OnboardingData {
  name: string;
  birthDate: string;
  gender: string;
  university: string;
  department: string;
  year: number;
  photos: string[];
  hobbies: string[];
  bio: string;
  selfiePhoto: string;
  selfieVerified: boolean;
}

interface AppStore {
  onboarding: Partial<OnboardingData>;
  setOnboarding: (data: Partial<OnboardingData>) => void;
  resetOnboarding: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  onboarding: {},
  setOnboarding: (data) =>
    set((state) => ({ onboarding: { ...state.onboarding, ...data } })),
  resetOnboarding: () => set({ onboarding: {} }),
}));
