import { useState, useEffect, useCallback } from "react";
import {
  View,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
  FlatList,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  Text,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth, useUser } from "@clerk/expo";
import { COLORS } from "../../constants/colors";
import { MealAPI } from "../../services/mealAPI";
import { homeStyles } from "../../assets/styles/home.styles";
import RecipeItem from "../../components/RecipeItem";
import HomeHeader from "../../components/HomeHeader";
import HomeFooter from "../../components/HomeFooter";
import LatestRecipe from "../../components/LatestRecipe";

// Android에서 LayoutAnimation을 사용하기 위한 설정
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// 컴포넌트 언마운트 시 선택된 카테고리 상태를 보존하기 위한 모듈 범위 백업 변수
let lastSelectedCategory = null;

const HomeScreen = () => {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useAuth();
  const { height } = useWindowDimensions();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [latestRecipe, setLatestRecipe] = useState(null);
  const [allRecipes, setAllRecipes] = useState([]);
  const [displayedRecipes, setDisplayedRecipes] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // 당겨서 새로고침 상태

  // 1. 초기 데이터 로드 (카테고리 목록 & 최신 레시피)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // 카테고리 목록 가져오기
        const apiCategories = await MealAPI.getCategories();
        const mappedCategories = apiCategories.map((cat) => ({
          id: cat.strCategory.toLowerCase(),
          name: cat.strCategory,
          image: cat.strCategoryThumb,
        }));
        setCategories(mappedCategories);

        if (mappedCategories.length > 0) {
          // 저장된 이전 카테고리가 있으면 복원하고, 없으면 첫 번째 카테고리를 선택
          setSelectedCategory(lastSelectedCategory || mappedCategories[0].id);
        }

        // 최신 레시피 가져오기 (랜덤 레시피 1개)
        const randomMeal = await MealAPI.getRandomMeal();
        if (randomMeal) {
          const transformed = MealAPI.transformMealData(randomMeal);
          setLatestRecipe({
            id: transformed.id,
            title: transformed.title,
            time: "25m", // API에서 별도 조리 시간이 오지 않으므로 임의 지정
            servings: "2 Servings",
            image: transformed.imageUrl,
            area:
              transformed.area && transformed.area !== "Unknown"
                ? transformed.area
                : "Anywhere", // 국가/지역 정보가 없거나 Unknown이면 Anywhere로 표기
          });
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        Alert.alert("오류", "데이터를 불러오는 중 문제가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // selectedCategory 상태 변화 시 백업 변수에 저장하여 컴포넌트 리마운트 시 복구 가능하게 함
  useEffect(() => {
    if (selectedCategory) {
      lastSelectedCategory = selectedCategory;
    }
  }, [selectedCategory]);

  // 2. 카테고리 선택에 따른 레시피 조회
  useEffect(() => {
    if (!selectedCategory || categories.length === 0) return;

    const fetchRecipes = async () => {
      try {
        // 기존 레시피 목록을 부드럽게 비우며 로딩 표시 작동
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setRecipesLoading(true);
        setDisplayedRecipes([]);
        setLoadingMore(false);

        const currentCat = categories.find(
          (cat) => cat.id === selectedCategory,
        );
        if (!currentCat) {
          setRecipesLoading(false);
          return;
        }

        const meals = await MealAPI.filterByCategory(currentCat.name);
        const formattedRecipes = meals.map((meal) => ({
          id: meal.idMeal,
          title: meal.strMeal,
          image: meal.strMealThumb,
          time: "30m", // 기본값
          servings: "4", // 기본값
          area: null, // 상세 API 조회 전까지 null
        }));

        setAllRecipes(formattedRecipes);

        // 첫 번째 배치(4개)에 대해 상세 정보(area 등) 병렬 로드
        const initialBatch = formattedRecipes.slice(0, 4);
        const detailedBatch = await Promise.all(
          initialBatch.map(async (recipe) => {
            const detail = await MealAPI.getMealById(recipe.id);
            return {
              ...recipe,
              area:
                detail && detail.strArea && detail.strArea !== "Unknown"
                  ? detail.strArea
                  : "Anywhere", // 국가/지역 정보가 없거나 Unknown이면 Anywhere로 표기
            };
          }),
        );

        // 데이터가 화면에 채워질 때 스무스하게 레이아웃 변화 적용
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setDisplayedRecipes(detailedBatch);
        setPage(1);
        setHasMore(formattedRecipes.length > 4);
      } catch (error) {
        console.error("Failed to fetch recipes:", error);
      } finally {
        setRecipesLoading(false);
      }
    };

    fetchRecipes();
  }, [selectedCategory, categories]);

  // 무한 스크롤 및 추가 로드 시 상세(area) 데이터 병렬 패치
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const itemsToLoad = nextPage * 4;

      // page * 4를 명확한 시작 인덱스로 사용하여 상태 지연 업데이트로 인한 오동작 방지
      const startIndex = page * 4;
      const nextBatch = allRecipes.slice(startIndex, itemsToLoad);

      if (nextBatch.length === 0) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      const detailedNextBatch = await Promise.all(
        nextBatch.map(async (recipe) => {
          const detail = await MealAPI.getMealById(recipe.id);
          return {
            ...recipe,
            area:
              detail && detail.strArea && detail.strArea !== "Unknown"
                ? detail.strArea
                : "Anywhere", // 국가/지역 정보가 없거나 Unknown이면 Anywhere로 표기
          };
        }),
      );

      // 무한 스크롤로 데이터가 더해질 때도 부드러운 애니메이션 효과
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      // 중복 아이템 유입을 원천 차단하기 위해 ID 기준으로 필터링하여 결합
      setDisplayedRecipes((prev) => {
        const prevIds = new Set(prev.map((item) => item.id));
        const filteredNext = detailedNextBatch.filter(
          (item) => !prevIds.has(item.id),
        );
        return [...prev, ...filteredNext];
      });

      setPage(nextPage);
      setHasMore(allRecipes.length > itemsToLoad);
    } catch (error) {
      console.error("Error loading more recipes:", error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, allRecipes]);

  // 당겨서 새로고침 실행
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // 1. 카테고리 목록 다시 가져오기
      const apiCategories = await MealAPI.getCategories();
      const mappedCategories = apiCategories.map((cat) => ({
        id: cat.strCategory.toLowerCase(),
        name: cat.strCategory,
        image: cat.strCategoryThumb,
      }));
      setCategories(mappedCategories);

      // 2. 추천 레시피(랜덤) 새로고침
      const randomMeal = await MealAPI.getRandomMeal();
      if (randomMeal) {
        const transformed = MealAPI.transformMealData(randomMeal);
        setLatestRecipe({
          id: transformed.id,
          title: transformed.title,
          time: "25m",
          servings: "2 Servings",
          image: transformed.imageUrl,
          area:
            transformed.area && transformed.area !== "Unknown"
              ? transformed.area
              : "Anywhere",
        });
      }

      // 3. 현재 탭(선택된 카테고리)의 레시피 목록 리로드
      if (selectedCategory) {
        const currentCat = mappedCategories.find(
          (cat) => cat.id === selectedCategory,
        ) || { name: selectedCategory };
        const meals = await MealAPI.filterByCategory(currentCat.name);
        const formattedRecipes = meals.map((meal) => ({
          id: meal.idMeal,
          title: meal.strMeal,
          image: meal.strMealThumb,
          time: "30m",
          servings: "4",
          area: null,
        }));
        setAllRecipes(formattedRecipes);

        const initialBatch = formattedRecipes.slice(0, 4);
        const detailedBatch = await Promise.all(
          initialBatch.map(async (recipe) => {
            const detail = await MealAPI.getMealById(recipe.id);
            return {
              ...recipe,
              area:
                detail && detail.strArea && detail.strArea !== "Unknown"
                  ? detail.strArea
                  : "Anywhere",
            };
          }),
        );

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setDisplayedRecipes(detailedBatch);
        setPage(1);
        setHasMore(formattedRecipes.length > 4);
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [selectedCategory]);

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

  const renderItem = useCallback(({ item }) => <RecipeItem item={item} />, []);
  const keyExtractor = useCallback((item) => item.id.toString(), []);

  const userEmail = user?.emailAddresses?.[0]?.emailAddress || "Guest";
  const userNickName = userEmail.split("@")[0];

  const topSectionHeight = height * 0.2;
  const recentSectionHeight = height * 0.33;

  if (loading) {
    return (
      <View style={[homeStyles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={homeStyles.container}>
      <FlatList
        data={displayedRecipes}
        extraData={{
          latestRecipe,
          categories,
          selectedCategory,
          recipesLoading,
        }}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
        ListHeaderComponent={
          <HomeHeader
            userNickName={userNickName}
            handleSignOut={handleSignOut}
            topSectionHeight={topSectionHeight}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
          >
            <LatestRecipe
              latestRecipe={latestRecipe}
              recentSectionHeight={recentSectionHeight}
            />
          </HomeHeader>
        }
        ListFooterComponent={<HomeFooter loadingMore={loadingMore} />}
        ListEmptyComponent={
          recipesLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={{ color: COLORS.textLight, fontSize: 14 }}>
                No recipes found
              </Text>
            </View>
          )
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={homeStyles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.text}
            colors={[COLORS.text]}
          />
        }
      />
    </View>
  );
};

// home.styles.js에 명시되지 않은 일부 컴포넌트 고유 스타일만 로컬에 유지합니다.
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  columnWrapper: {
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  emptyContainer: {
    paddingVertical: 60,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
});

export default HomeScreen;
