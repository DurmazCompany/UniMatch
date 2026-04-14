import { StoryUser } from "./types";

// Mock story data for testing
export const mockStories: StoryUser[] = [
  {
    id: "user1",
    name: "Elif",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    hasUnwatched: true,
    stories: [
      {
        id: "story1-1",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop",
        timestamp: Date.now() - 1800000, // 30 min ago
      },
      {
        id: "story1-2",
        imageUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=800&h=1200&fit=crop",
        timestamp: Date.now() - 900000, // 15 min ago
      },
    ],
  },
  {
    id: "user2",
    name: "Ahmet",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    hasUnwatched: true,
    stories: [
      {
        id: "story2-1",
        imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&h=1200&fit=crop",
        timestamp: Date.now() - 3600000, // 1 hour ago
      },
    ],
  },
  {
    id: "user3",
    name: "Zeynep",
    avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    hasUnwatched: true,
    stories: [
      {
        id: "story3-1",
        imageUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800&h=1200&fit=crop",
        timestamp: Date.now() - 7200000, // 2 hours ago
      },
      {
        id: "story3-2",
        imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&h=1200&fit=crop",
        timestamp: Date.now() - 5400000, // 1.5 hours ago
      },
      {
        id: "story3-3",
        imageUrl: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=1200&fit=crop",
        timestamp: Date.now() - 3600000, // 1 hour ago
      },
    ],
  },
  {
    id: "user4",
    name: "Mert",
    avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&h=200&fit=crop",
    hasUnwatched: false,
    stories: [
      {
        id: "story4-1",
        imageUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&h=1200&fit=crop",
        timestamp: Date.now() - 14400000, // 4 hours ago
      },
    ],
  },
  {
    id: "user5",
    name: "Selin",
    avatarUrl: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop",
    hasUnwatched: true,
    stories: [
      {
        id: "story5-1",
        imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=1200&fit=crop",
        timestamp: Date.now() - 1200000, // 20 min ago
      },
    ],
  },
  {
    id: "user6",
    name: "Deniz",
    avatarUrl: "https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=200&h=200&fit=crop",
    hasUnwatched: true,
    stories: [
      {
        id: "story6-1",
        imageUrl: "https://images.unsplash.com/photo-1504730030853-eff311f57d3c?w=800&h=1200&fit=crop",
        timestamp: Date.now() - 600000, // 10 min ago
      },
    ],
  },
];
