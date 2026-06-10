import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Linking,
  Dimensions,
  Share,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useUser } from "@clerk/expo";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { COLORS } from "../../constants/colors";
import { MealAPI } from "../../services/mealAPI";
import { API_URL } from "../../constants/api";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

const RecipeDetailScreen = () => {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // 1. 레시피 상세 데이터 & 즐겨찾기 상태 조회
  useEffect(() => {
    const loadRecipeData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // 레시피 정보 가져오기
        const rawMeal = await MealAPI.getMealById(id);
        if (rawMeal) {
          const transformed = MealAPI.transformMealData(rawMeal);
          setRecipe(transformed);
        } else {
          Alert.alert("Error", "Recipe not found.");
          router.back();
          return;
        }

        // 즐겨찾기 목록을 조회하여 즐겨찾기 여부 확인
        if (user) {
          const favResponse = await fetch(`${API_URL}/favorites/${user.id}`);
          if (favResponse.ok) {
            const favorites = await favResponse.json();
            const isFav = favorites.some(
              (fav) => fav.recipeId === parseInt(id),
            );
            setIsFavorite(isFav);
          }
        }
      } catch (error) {
        console.error("Error loading recipe details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadRecipeData();
  }, [id, user]);

  // 2. 즐겨찾기 추가/삭제 토글 - useCallback 적용
  const handleToggleFavorite = useCallback(async () => {
    if (!user) {
      Alert.alert(
        "로그인 필요",
        "즐겨찾기 기능을 사용하려면 로그인이 필요합니다.",
      );
      return;
    }
    if (!recipe || favoriteLoading) return;

    setFavoriteLoading(true);
    // 햅틱 진동 효과 (Premium UX)
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      // ignore
      console.log(e);
    }

    try {
      if (isFavorite) {
        // 삭제 요청
        const response = await fetch(`${API_URL}/favorites/${user.id}/${id}`, {
          method: "DELETE",
        });
        if (response.ok) {
          setIsFavorite(false);
        } else {
          console.error("Failed to delete favorite");
        }
      } else {
        // 추가 요청
        const response = await fetch(`${API_URL}/favorites`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            recipeId: parseInt(id),
            title: recipe.title,
            image: recipe.imageUrl,
            cookTime: recipe.cookTime || "30m",
            servings: recipe.servings?.toString() || "4",
          }),
        });
        if (response.ok) {
          setIsFavorite(true);
        } else {
          console.error("Failed to add favorite");
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    } finally {
      setFavoriteLoading(false);
    }
  }, [user, recipe, favoriteLoading, isFavorite, id]);

  // 3. 레시피 공유하기 기능 - useCallback 적용
  const handleShare = useCallback(async () => {
    if (!recipe) return;
    try {
      await Share.share({
        message: `Check out this delicious recipe: ${recipe.title}\n\nCategory: ${recipe.category}\nArea: ${recipe.area}\n\nEnjoy cooking!`,
      });
    } catch (error) {
      console.error("Error sharing recipe:", error);
    }
  }, [recipe]);

  // 4. 유튜브 영상 보기 - useCallback 적용
  const handleWatchVideo = useCallback((url) => {
    if (url) {
      Linking.openURL(url).catch((err) => {
        Alert.alert("Error", "Cannot open YouTube link.");
      });
    }
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: COLORS.textLight }]}>
          Loading recipe details...
        </Text>
      </View>
    );
  }

  if (!recipe) return null;

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 상단 이미지 배너 */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: recipe.imageUrl }}
            style={styles.image}
            contentFit="cover"
          />
          <View style={styles.imageOverlay} />

          {/* 플로팅 뒤로가기 버튼 */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          {/* 플로팅 공유 버튼 */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <Ionicons
              name="share-social-outline"
              size={22}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>

        {/* 바디 콘텐츠 */}
        <View style={[styles.cardContainer, { backgroundColor: COLORS.card }]}>
          {/* 타이틀 및 즐겨찾기 토글 영역 */}
          <View style={styles.titleRow}>
            <View style={styles.titleCol}>
              <Text style={[styles.categoryText, { color: COLORS.primary }]}>
                {recipe.category} • {recipe.area}
              </Text>
              <Text
                style={[styles.recipeTitle, { color: COLORS.text }]}
                numberOfLines={2}
              >
                {recipe.title}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.favButtonCircle,
                { backgroundColor: COLORS.background },
                isFavorite && styles.favButtonActive,
              ]}
              onPress={handleToggleFavorite}
              disabled={favoriteLoading}
              activeOpacity={0.8}
            >
              {favoriteLoading ? (
                <ActivityIndicator
                  size="small"
                  color={isFavorite ? COLORS.white : COLORS.primary}
                />
              ) : (
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={26}
                  color={isFavorite ? COLORS.white : COLORS.primary}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* 주요 정보 4칸 Grid (세로 2행 가로 2열 또는 가로 한줄 배치) */}
          <View style={styles.metaGrid}>
            <View
              style={[styles.metaCard, { backgroundColor: COLORS.background }]}
            >
              <Ionicons name="time" size={20} color={COLORS.primary} />
              <Text style={[styles.metaVal, { color: COLORS.text }]}>
                {recipe.cookTime || "30m"}
              </Text>
              <Text style={[styles.metaLabel, { color: COLORS.textLight }]}>
                Cook Time
              </Text>
            </View>

            <View
              style={[styles.metaCard, { backgroundColor: COLORS.background }]}
            >
              <Ionicons name="people" size={20} color={COLORS.primary} />
              <Text style={[styles.metaVal, { color: COLORS.text }]}>
                {recipe.servings || "4"}
              </Text>
              <Text style={[styles.metaLabel, { color: COLORS.textLight }]}>
                Servings
              </Text>
            </View>

            <View
              style={[styles.metaCard, { backgroundColor: COLORS.background }]}
            >
              <Ionicons name="restaurant" size={20} color={COLORS.primary} />
              <Text
                style={[styles.metaVal, { color: COLORS.text }]}
                numberOfLines={1}
              >
                {recipe.category}
              </Text>
              <Text style={[styles.metaLabel, { color: COLORS.textLight }]}>
                Category
              </Text>
            </View>

            <View
              style={[styles.metaCard, { backgroundColor: COLORS.background }]}
            >
              <Ionicons name="globe" size={20} color={COLORS.primary} />
              <Text
                style={[styles.metaVal, { color: COLORS.text }]}
                numberOfLines={1}
              >
                {recipe.area}
              </Text>
              <Text style={[styles.metaLabel, { color: COLORS.textLight }]}>
                Origin
              </Text>
            </View>
          </View>

          {/* 재료 리스트 Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="list" size={20} color={COLORS.primary} />
              <Text style={[styles.sectionTitle, { color: COLORS.text }]}>
                Ingredients
              </Text>
            </View>
            <View style={[styles.sectionCard, { borderColor: COLORS.border }]}>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.ingredientItem,
                      idx < recipe.ingredients.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: COLORS.border + "40",
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkbox-outline"
                      size={18}
                      color={COLORS.primary}
                    />
                    <Text
                      style={[styles.ingredientText, { color: COLORS.text }]}
                    >
                      {item}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: COLORS.textLight, padding: 12 }}>
                  No ingredients info.
                </Text>
              )}
            </View>
          </View>

          {/* 조리 순서 Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="book-outline" size={20} color={COLORS.primary} />
              <Text style={[styles.sectionTitle, { color: COLORS.text }]}>
                Instructions
              </Text>
            </View>
            {recipe.instructions && recipe.instructions.length > 0 ? (
              recipe.instructions.map((step, idx) => (
                <View
                  key={idx}
                  style={[styles.stepCard, { borderColor: COLORS.border }]}
                >
                  <View
                    style={[
                      styles.stepBadge,
                      { backgroundColor: COLORS.primary },
                    ]}
                  >
                    <Text style={styles.stepBadgeText}>{idx + 1}</Text>
                  </View>
                  <Text style={[styles.stepText, { color: COLORS.text }]}>
                    {step}
                  </Text>
                </View>
              ))
            ) : (
              <View
                style={[styles.sectionCard, { borderColor: COLORS.border }]}
              >
                <Text style={{ color: COLORS.textLight, padding: 12 }}>
                  No instructions info.
                </Text>
              </View>
            )}
          </View>

          {/* 유튜브 튜토리얼 비디오 링크 */}
          {recipe.originalData?.strYoutube ? (
            <TouchableOpacity
              style={styles.youtubeButton}
              onPress={() => handleWatchVideo(recipe.originalData.strYoutube)}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-youtube" size={24} color="#FFFFFF" />
              <Text style={styles.youtubeButtonText}>
                Watch Video on YouTube
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: "600",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  imageContainer: {
    width: width,
    height: 320,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    position: "absolute",
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -30,
    paddingHorizontal: 20,
    paddingTop: 30,
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 25,
  },
  titleCol: {
    flex: 1,
    marginRight: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 30,
  },
  favButtonCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  favButtonActive: {
    backgroundColor: "#FF5252",
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 30,
  },
  metaCard: {
    width: (width - 52) / 2,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  metaVal: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  ingredientText: {
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  stepCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  stepBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  stepText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "500",
    flex: 1,
  },
  youtubeButton: {
    backgroundColor: "#FF0000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  youtubeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default RecipeDetailScreen;
