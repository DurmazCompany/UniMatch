export interface Story {
  id: string;
  imageUrl: string;
  timestamp: number;
}

export interface StoryUser {
  id: string;
  name: string;
  avatarUrl: string;
  stories: Story[];
  hasUnwatched: boolean;
}
