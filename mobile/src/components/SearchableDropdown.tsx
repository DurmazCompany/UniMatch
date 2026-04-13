import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  Modal,
  Keyboard,
  Dimensions,
} from "react-native";
import { Search, ChevronDown, Check } from "lucide-react-native";
import { theme } from "@/lib/theme";

interface SearchableDropdownProps {
  items: string[];
  value: string;
  onSelect: (item: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  testID?: string;
  isLoading?: boolean;
}

export function SearchableDropdown({
  items,
  value,
  onSelect,
  placeholder = "Ara...",
  emptyMessage = "Sonuc bulunamadi",
  testID,
  isLoading = false,
}: SearchableDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [inputLayout, setInputLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const inputRef = useRef<View>(null);

  const filteredItems = items.filter((item) =>
    item.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSelect = (item: string) => {
    onSelect(item);
    setSearchText("");
    setIsOpen(false);
    Keyboard.dismiss();
  };

  const handleOpen = () => {
    inputRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setInputLayout({ x: pageX, y: pageY, width, height });
    });
    setIsOpen(true);
  };

  const handleClose = () => {
    setSearchText("");
    setIsOpen(false);
    Keyboard.dismiss();
  };

  return (
    <View ref={inputRef} collapsable={false}>
      {/* Trigger button */}
      <Pressable
        onPress={handleOpen}
        testID={testID}
        style={{
          backgroundColor: "#1A1A1A",
          borderWidth: 1.5,
          borderColor: "rgba(255,255,255,0.08)",
          borderRadius: 14,
          paddingHorizontal: 18,
          paddingVertical: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Search size={20} color={theme.textPlaceholder} />
        <Text
          style={{
            flex: 1,
            color: value ? theme.textPrimary : theme.textPlaceholder,
            fontSize: 16,
          }}
          numberOfLines={1}
        >
          {isLoading ? "Yukleniyor..." : value || placeholder}
        </Text>
        <ChevronDown size={20} color={theme.textPlaceholder} />
      </Pressable>

      {/* Dropdown Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)" }}
          onPress={handleClose}
        >
          <View
            style={{
              position: "absolute",
              top: inputLayout.y,
              left: inputLayout.x,
              width: inputLayout.width,
            }}
          >
            {/* Search input */}
            <View
              style={{
                backgroundColor: "#1A1A1A",
                borderWidth: 1.5,
                borderColor: theme.primary,
                borderRadius: 14,
                paddingHorizontal: 18,
                paddingVertical: 4,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Search size={20} color={theme.primary} />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder={placeholder}
                placeholderTextColor={theme.textPlaceholder}
                autoFocus
                style={{
                  flex: 1,
                  color: theme.textPrimary,
                  fontSize: 16,
                  paddingVertical: 12,
                }}
              />
            </View>

            {/* Dropdown list */}
            <View
              style={{
                marginTop: 8,
                backgroundColor: "#1A1A1A",
                borderWidth: 1.5,
                borderColor: "rgba(255,255,255,0.08)",
                borderRadius: 14,
                maxHeight: 250,
                overflow: "hidden",
              }}
            >
              {filteredItems.length > 0 ? (
                <FlatList
                  data={filteredItems}
                  keyExtractor={(item) => item}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item, index }) => {
                    const isSelected = item === value;
                    const isLast = index === filteredItems.length - 1;
                    return (
                      <Pressable
                        onPress={() => handleSelect(item)}
                        style={({ pressed }) => ({
                          paddingHorizontal: 18,
                          paddingVertical: 14,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          backgroundColor: pressed
                            ? "rgba(225,29,72,0.15)"
                            : isSelected
                            ? "rgba(225,29,72,0.1)"
                            : "transparent",
                          borderBottomWidth: isLast ? 0 : 1,
                          borderBottomColor: "rgba(255,255,255,0.05)",
                        })}
                      >
                        <Text
                          style={{
                            color: isSelected
                              ? theme.accent
                              : theme.textPrimary,
                            fontSize: 15,
                            flex: 1,
                          }}
                          numberOfLines={1}
                        >
                          {item}
                        </Text>
                        {isSelected ? (
                          <Check size={18} color={theme.primary} />
                        ) : null}
                      </Pressable>
                    );
                  }}
                />
              ) : (
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Text style={{ color: theme.textSecondary, fontSize: 14 }}>
                    {emptyMessage}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
