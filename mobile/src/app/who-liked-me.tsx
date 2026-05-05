import { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors, Spacing, Radius } from "@/lib/theme";
import { UMButton, UMCard } from "@/components/ui";
import { api } from "@/lib/api/api";
import { useWallet } from "@/lib/hooks/useWallet";
import { isPaywallError } from "@/lib/hooks/usePaywallOnError";
import { WhoLikedMeResponse, LikerProfile } from "@/lib/types";

function LikerCard({ profile, blurred }: { profile: LikerProfile; blurred: boolean }) {
  const photo = profile.photos?.[0];
  return (
    <View
      style={{
        flex: 1,
        borderRadius: Radius.card,
        overflow: "hidden",
        backgroundColor: Colors.cardDark,
        aspectRatio: 0.75,
      }}
    >
      {photo ? (
        <Image
          source={{ uri: photo === "blur" ? undefined : photo }}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        />
      ) : (
        <View
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: Colors.surfaceDark,
          }}
        />
      )}
      {blurred ? (
        <BlurView intensity={60} tint="dark" style={{ position: "absolute", inset: 0 }}>
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="lock-closed-outline" size={28} color="rgba(255,255,255,0.85)" />
          </View>
        </BlurView>
      ) : null}
      {!blurred ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding: 12,
            backgroundColor: "rgba(0,0,0,0.55)",
          }}
        >
          <Text
            style={{ color: Colors.white, fontSize: 14, fontFamily: "DMSans_700Bold" }}
            numberOfLines={1}
          >
            {profile.name ?? "—"}
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: 12,
              fontFamily: "DMSans_400Regular",
              marginTop: 2,
            }}
            numberOfLines={1}
          >
            {profile.department}
            {profile.year ? ` · ${profile.year}. Sınıf` : ""}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function WhoLikedMeScreen() {
  const insets = useSafeAreaInsets();
  const { data: wallet } = useWallet();
  const tier = wallet?.tier ?? "crush";

  const { data, isLoading, error } = useQuery<WhoLikedMeResponse | null>({
    queryKey: ["who-liked-me"],
    queryFn: async () => {
      const result = await api.get<WhoLikedMeResponse>("/api/campus/who-liked-me");
      return result ?? null;
    },
    retry: false,
  });

  useEffect(() => {
    if (error && isPaywallError(error)) {
      router.replace("/paywall");
    }
  }, [error]);

  const likers = data?.likers ?? [];
  const count = data?.count ?? 0;

  // Pair into rows of 2 for grid layout
  const rows: LikerProfile[][] = [];
  for (let i = 0; i < likers.length; i += 2) {
    rows.push(likers.slice(i, i + 2));
  }

  const renderEmpty = () => (
    <View style={{ alignItems: "center", paddingVertical: 60, paddingHorizontal: 24 }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: Colors.cardDark,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <Ionicons name="heart-outline" size={36} color={Colors.primaryLight} />
      </View>
      <Text
        style={{
          color: Colors.textOnDark,
          fontSize: 20,
          fontFamily: "DMSerifDisplay_400Regular",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        Henüz kimse seni beğenmedi
      </Text>
      <Text
        style={{
          color: Colors.textOnDarkMuted,
          fontSize: 14,
          fontFamily: "DMSans_400Regular",
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Profilini güçlendir ve daha fazla kişiye görün.
      </Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgDark }} testID="who-liked-me-screen">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          testID="who-liked-back"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: Colors.surfaceDark,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Ionicons name="chevron-back-outline" size={20} color={Colors.textOnDark} />
        </Pressable>
        <Text style={{ color: Colors.textOnDark, fontSize: 22, fontFamily: "DMSerifDisplay_400Regular" }}>
          Seni Beğenenler
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {tier === "crush" ? (
            <>
              <UMCard dark style={{ marginBottom: Spacing.lg, alignItems: "center", paddingVertical: 28 }}>
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: "rgba(124,111,247,0.18)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="heart" size={28} color={Colors.primaryLight} />
                </View>
                <Text
                  style={{
                    color: Colors.textOnDark,
                    fontSize: 28,
                    fontFamily: "DMSerifDisplay_400Regular",
                    marginBottom: 6,
                  }}
                >
                  {count} kişi seni beğendi
                </Text>
                <Text
                  style={{
                    color: Colors.textOnDarkMuted,
                    fontSize: 13,
                    fontFamily: "DMSans_400Regular",
                    textAlign: "center",
                    paddingHorizontal: 12,
                  }}
                >
                  Aşk paketiyle hepsini görebilir, eşleşmelerini hızlandırabilirsin.
                </Text>
              </UMCard>

              <UMButton
                variant="primary"
                label="Aşk paketi al"
                onPress={() => router.push("/paywall")}
              />

              {/* Blurred preview grid */}
              <View style={{ height: Spacing.xl }} />
              {rows.length > 0 ? (
                <View style={{ gap: 12 }}>
                  {rows.map((row, idx) => (
                    <View key={idx} style={{ flexDirection: "row", gap: 12 }}>
                      {row.map((p, j) => (
                        <LikerCard key={`${idx}-${j}`} profile={p} blurred />
                      ))}
                      {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
                    </View>
                  ))}
                </View>
              ) : null}
            </>
          ) : tier === "flort" ? (
            <>
              {likers.length === 0 ? (
                renderEmpty()
              ) : (
                <>
                  <Text
                    style={{
                      color: Colors.textOnDarkMuted,
                      fontSize: 13,
                      fontFamily: "DMSans_500Medium",
                      marginBottom: 12,
                    }}
                  >
                    {count} kişi seni beğendi
                  </Text>
                  <View style={{ gap: 12 }}>
                    {rows.map((row, idx) => {
                      const startIdx = idx * 2;
                      return (
                        <View key={idx} style={{ flexDirection: "row", gap: 12 }}>
                          {row.map((p, j) => {
                            const absoluteIdx = startIdx + j;
                            const blurred = absoluteIdx >= 10;
                            return <LikerCard key={`${idx}-${j}`} profile={p} blurred={blurred} />;
                          })}
                          {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
                        </View>
                      );
                    })}
                  </View>
                  {count > 10 ? (
                    <View style={{ marginTop: Spacing.xl }}>
                      <UMCard dark style={{ alignItems: "center", paddingVertical: 18 }}>
                        <Text
                          style={{
                            color: Colors.textOnDark,
                            fontSize: 15,
                            fontFamily: "DMSans_700Bold",
                            marginBottom: 4,
                          }}
                        >
                          +{count - 10} daha
                        </Text>
                        <Text
                          style={{
                            color: Colors.textOnDarkMuted,
                            fontSize: 12,
                            fontFamily: "DMSans_400Regular",
                            marginBottom: 12,
                          }}
                        >
                          Aşk ile gör
                        </Text>
                        <UMButton
                          variant="primary"
                          label="Aşk'a yükselt"
                          onPress={() => router.push("/paywall")}
                        />
                      </UMCard>
                    </View>
                  ) : null}
                </>
              )}
            </>
          ) : (
            <>
              {likers.length === 0 ? (
                renderEmpty()
              ) : (
                <>
                  <Text
                    style={{
                      color: Colors.textOnDarkMuted,
                      fontSize: 13,
                      fontFamily: "DMSans_500Medium",
                      marginBottom: 12,
                    }}
                  >
                    {count} kişi seni beğendi
                  </Text>
                  <View style={{ gap: 12 }}>
                    {rows.map((row, idx) => (
                      <View key={idx} style={{ flexDirection: "row", gap: 12 }}>
                        {row.map((p, j) => (
                          <LikerCard key={`${idx}-${j}`} profile={p} blurred={false} />
                        ))}
                        {row.length === 1 ? <View style={{ flex: 1 }} /> : null}
                      </View>
                    ))}
                  </View>
                </>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
