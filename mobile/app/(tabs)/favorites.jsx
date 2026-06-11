import { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useAuth, useUser } from "@clerk/expo";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { API_URL } from "../../constants/api";
import { favoritesStyles } from "../../assets/styles/favorites.styles";

const FavoritesScreen = () => {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useAuth();

  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSignOut = useCallback(() => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/sign-in");
          } catch (err) {
            Alert.alert("Error", `error: ${JSON.stringify(err)}`);
          }
        },
      },
    ]);
  }, [signOut, router]);

  // 화면에 진입/포커스될 때마다 실시간으로 즐겨찾기 목록 fetch
  useFocusEffect(
    useCallback(() => {
      const fetchFavorites = async () => {
        if (!user) return;
        setLoading(true);
        try {
          const response = await fetch(`${API_URL}/favorites/${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setFavorites(data || []);
          } else {
            console.error("Failed to fetch favorites");
          }
        } catch (error) {
          console.error("Error fetching favorites:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchFavorites();
    }, [user]),
  );

  // 즐겨찾기 목록에서 삭제
  const handleRemoveFavorite = useCallback(
    async (recipeId) => {
      if (!user) return;
      try {
        const response = await fetch(
          `${API_URL}/favorites/${user.id}/${recipeId}`,
          {
            method: "DELETE",
          },
        );
        if (response.ok) {
          // 성공 시 로컬 상태 필터링하여 갱신
          setFavorites((prev) =>
            prev.filter((item) => item.recipeId !== recipeId),
          );
        } else {
          console.error("Failed to delete favorite");
        }
      } catch (error) {
        console.error("Error deleting favorite:", error);
      }
    },
    [user],
  );

  // 평균 요리 시간 계산 (분 단위 추출) - useMemo로 연산 최적화
  const averageCookTime = useMemo(() => {
    if (favorites.length === 0) return "0m";
    const total = favorites.reduce((acc, curr) => {
      const timeNum = parseInt(curr.cookTime) || 30; // '30m' 또는 '30 minutes' 등에서 숫자 추출
      return acc + timeNum;
    }, 0);
    return `${Math.round(total / favorites.length)}m`;
  }, [favorites]);

  const renderRecipeItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        style={[
          styles.recipeCard,
          { backgroundColor: COLORS.card, shadowColor: COLORS.shadow },
        ]}
        onPress={() => router.push(`/recipe/${item.recipeId}?from=favorites`)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.recipeImage}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
          recyclingKey={item.recipeId.toString()}
          placeholder={{ blurhash: "L6PZvn%e00t7_3afQ-fQ00ae~qj[" }}
        />
        <View style={styles.recipeInfo}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.recipeTitle, { color: COLORS.text }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <TouchableOpacity
              onPress={() => handleRemoveFavorite(item.recipeId)}
            >
              <Ionicons name="heart" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Text
            style={[styles.recipeDesc, { color: COLORS.textLight }]}
            numberOfLines={2}
          >
            Delicious recipe saved to your favorites list.
          </Text>
          <View style={styles.recipeMeta}>
            <View style={styles.metaItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={COLORS.textLight}
              />
              <Text style={[styles.metaText, { color: COLORS.textLight }]}>
                {item.cookTime || "30m"}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons
                name="people-outline"
                size={14}
                color={COLORS.textLight}
              />
              <Text style={[styles.metaText, { color: COLORS.textLight }]}>
                {item.servings || "4"} Servings
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleRemoveFavorite, router],
  );

  const keyExtractor = useCallback((item) => item.recipeId.toString(), []);

  if (!user) {
    return (
      <View
        style={[
          favoritesStyles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={favoritesStyles.container}>
      {/* Header */}
      <View style={favoritesStyles.header}>
        <Text style={favoritesStyles.title}>Favorites</Text>
        <TouchableOpacity
          style={favoritesStyles.logoutButton}
          onPress={handleSignOut}
        >
          <Ionicons name="log-out-outline" size={20} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Stats Cards (저장된 리스트가 있을 때만 표시) */}
      {!loading && favorites.length > 0 && (
        <View style={favoritesStyles.statsContainer}>
          <View style={favoritesStyles.statCard}>
            <View
              style={[
                favoritesStyles.statIcon,
                { backgroundColor: COLORS.primary + "15" },
              ]}
            >
              <Ionicons name="heart" size={20} color={COLORS.primary} />
            </View>
            <Text style={favoritesStyles.statValue}>
              {favorites.length} Recipes
            </Text>
            <Text
              style={{ fontSize: 12, color: COLORS.textLight, marginTop: 4 }}
            >
              Saved Items
            </Text>
          </View>
          <View style={favoritesStyles.statCard}>
            <View
              style={[
                favoritesStyles.statIcon,
                { backgroundColor: COLORS.secondary + "15" },
              ]}
            >
              <Ionicons name="time" size={20} color={COLORS.secondary} />
            </View>
            <Text style={favoritesStyles.statValue}>{averageCookTime}</Text>
            <Text
              style={{ fontSize: 12, color: COLORS.textLight, marginTop: 4 }}
            >
              Avg. Cook Time
            </Text>
          </View>
        </View>
      )}

      {/* Favorites List */}
      {loading ? (
        <View style={favoritesStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderRecipeItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={[
            favoritesStyles.recipesSection,
            favoritesStyles.recipesGrid,
          ]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
          ListEmptyComponent={
            <View style={favoritesStyles.emptyState}>
              <View style={favoritesStyles.emptyIconContainer}>
                <Ionicons
                  name="heart-outline"
                  size={50}
                  color={COLORS.border}
                />
              </View>
              <Text style={favoritesStyles.emptyTitle}>No favorites yet</Text>
              <TouchableOpacity
                style={favoritesStyles.exploreButton}
                onPress={() => router.push("/")}
              >
                <Text style={favoritesStyles.exploreButtonText}>
                  Explore Recipes
                </Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  recipeCard: {
    flexDirection: "row",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  recipeImage: {
    width: 100,
    height: 100,
  },
  recipeInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  recipeDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  recipeMeta: {
    flexDirection: "row",
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
});

export default FavoritesScreen;
