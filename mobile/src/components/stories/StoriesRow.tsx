import { ScrollView, View } from "react-native";
import { StoryCircle } from "./StoryCircle";
import { StoryUser } from "./types";

interface StoriesRowProps {
  stories: StoryUser[];
  onStoryPress: (index: number) => void;
  currentUserId?: string;
}

export function StoriesRow({ stories, onStoryPress, currentUserId }: StoriesRowProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 8 }}
        style={{ flexGrow: 0 }}
      >
        {stories.map((storyUser, index) => (
          <StoryCircle
            key={storyUser.id}
            id={storyUser.id}
            name={storyUser.name}
            avatarUrl={storyUser.avatarUrl}
            hasUnwatched={storyUser.hasUnwatched}
            isOwn={storyUser.id === currentUserId}
            onPress={() => onStoryPress(index)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
