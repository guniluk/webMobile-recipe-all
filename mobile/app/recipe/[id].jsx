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
import { recipeDetailStyles } from "../../assets/styles/recipe-detail.styles";

const { width } = Dimensions.get("window");

const RecipeDetailScreen = () => {
  const { id, from } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useUser();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // 뒤로가기 공통 처리 핸들러
  const handleBack = useCallback(() => {
    if (from === "favorites") {
      router.replace("/(tabs)/favorites");
    } else if (from === "search") {
      router.replace("/(tabs)/search");
    } else if (from === "home") {
      router.replace("/(tabs)");
    } else {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [from, router]);

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
          handleBack();
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
  }, [id, user, handleBack]);

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
    <View
      style={[
        recipeDetailStyles.container,
        { backgroundColor: COLORS.background },
      ]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 상단 이미지 배너 */}
        <View style={recipeDetailStyles.headerContainer}>
          <View style={recipeDetailStyles.imageContainer}>
            <Image
              source={{ uri: recipe.imageUrl }}
              style={recipeDetailStyles.headerImage}
              contentFit="cover"
              transition={300}
              cachePolicy="memory-disk"
              priority="high"
              placeholder={{ blurhash: "L6PZvn%e00t7_3afQ-fQ00ae~qj[" }}
            />
          </View>
          <View style={styles.imageOverlay} />

          <View style={recipeDetailStyles.floatingButtons}>
            {/* 플로팅 뒤로가기 버튼 */}
            <TouchableOpacity
              style={recipeDetailStyles.floatingButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.white} />
            </TouchableOpacity>

            {/* 플로팅 공유 버튼 */}
            <TouchableOpacity
              style={recipeDetailStyles.floatingButton}
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
        </View>

        {/* 바디 콘텐츠 */}
        <View
          style={[
            recipeDetailStyles.contentSection,
            { backgroundColor: COLORS.card },
          ]}
        >
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
              <Text
                style={[recipeDetailStyles.statValue, { color: COLORS.text }]}
              >
                {recipe.cookTime || "30m"}
              </Text>
              <Text
                style={[
                  recipeDetailStyles.statLabel,
                  { color: COLORS.textLight },
                ]}
              >
                Cook Time
              </Text>
            </View>

            <View
              style={[styles.metaCard, { backgroundColor: COLORS.background }]}
            >
              <Ionicons name="people" size={20} color={COLORS.primary} />
              <Text
                style={[recipeDetailStyles.statValue, { color: COLORS.text }]}
              >
                {recipe.servings || "4"}
              </Text>
              <Text
                style={[
                  recipeDetailStyles.statLabel,
                  { color: COLORS.textLight },
                ]}
              >
                Servings
              </Text>
            </View>

            <View
              style={[styles.metaCard, { backgroundColor: COLORS.background }]}
            >
              <Ionicons name="restaurant" size={20} color={COLORS.primary} />
              <Text
                style={[recipeDetailStyles.statValue, { color: COLORS.text }]}
                numberOfLines={1}
              >
                {recipe.category}
              </Text>
              <Text
                style={[
                  recipeDetailStyles.statLabel,
                  { color: COLORS.textLight },
                ]}
              >
                Category
              </Text>
            </View>

            <View
              style={[styles.metaCard, { backgroundColor: COLORS.background }]}
            >
              <Ionicons name="globe" size={20} color={COLORS.primary} />
              <Text
                style={[recipeDetailStyles.statValue, { color: COLORS.text }]}
                numberOfLines={1}
              >
                {recipe.area}
              </Text>
              <Text
                style={[
                  recipeDetailStyles.statLabel,
                  { color: COLORS.textLight },
                ]}
              >
                Origin
              </Text>
            </View>
          </View>

          {/* 재료 리스트 Section */}
          <View style={recipeDetailStyles.sectionContainer}>
            <View style={recipeDetailStyles.sectionTitleRow}>
              <Ionicons name="list" size={20} color={COLORS.primary} />
              <Text
                style={[
                  recipeDetailStyles.sectionTitle,
                  { color: COLORS.text },
                ]}
              >
                Ingredients
              </Text>
            </View>
            <View style={recipeDetailStyles.ingredientsGrid}>
              {recipe.ingredients && recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((item, idx) => (
                  <View key={idx} style={recipeDetailStyles.ingredientCard}>
                    <Ionicons
                      name="checkbox-outline"
                      size={18}
                      color={COLORS.primary}
                    />
                    <Text
                      style={[
                        recipeDetailStyles.ingredientText,
                        { color: COLORS.text },
                      ]}
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
          <View style={recipeDetailStyles.sectionContainer}>
            <View style={recipeDetailStyles.sectionTitleRow}>
              <Ionicons name="book-outline" size={20} color={COLORS.primary} />
              <Text
                style={[
                  recipeDetailStyles.sectionTitle,
                  { color: COLORS.text },
                ]}
              >
                Instructions
              </Text>
            </View>
            <View style={recipeDetailStyles.instructionsContainer}>
              {recipe.instructions && recipe.instructions.length > 0 ? (
                recipe.instructions.map((step, idx) => (
                  <View key={idx} style={recipeDetailStyles.instructionCard}>
                    <View
                      style={[
                        recipeDetailStyles.stepIndicator,
                        { backgroundColor: COLORS.primary },
                      ]}
                    >
                      <Text style={recipeDetailStyles.stepNumber}>
                        {idx + 1}
                      </Text>
                    </View>
                    <Text
                      style={[
                        recipeDetailStyles.instructionText,
                        { color: COLORS.text, marginBottom: 0 },
                      ]}
                    >
                      {step}
                    </Text>
                  </View>
                ))
              ) : (
                <View
                  style={[
                    recipeDetailStyles.sectionCard,
                    { borderColor: COLORS.border },
                  ]}
                >
                  <Text style={{ color: COLORS.textLight, padding: 12 }}>
                    No instructions info.
                  </Text>
                </View>
              )}
            </View>
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
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
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
