import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { MealAPI } from "../../services/mealAPI";
import { searchStyles } from "../../assets/styles/search.styles";

// Helper function to filter out duplicate meals by id
const filterUniqueMeals = (mealsArray) => {
  const seen = new Set();
  return mealsArray.filter((meal) => {
    if (!meal || !meal.id) return false;
    const isDuplicate = seen.has(meal.id);
    seen.add(meal.id);
    return !isDuplicate;
  });
};

const SearchScreen = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [meals, setMeals] = useState([]);
  const [allFetchedMeals, setAllFetchedMeals] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isRandom, setIsRandom] = useState(true);

  const requestCountRef = useRef(0);

  // 1. 랜덤 레시피 6개 가져오기 - useCallback 적용
  const fetchRandomMeals = useCallback(async () => {
    const currentRequestId = ++requestCountRef.current;
    setLoading(true);
    try {
      const rawMeals = await MealAPI.getRandomMeals(6);
      if (currentRequestId !== requestCountRef.current) return;

      const transformed = rawMeals
        .map((meal) => MealAPI.transformMealData(meal))
        .filter((meal) => meal !== null); // null 항목 필터링으로 데이터 깨짐 방지
      setMeals(filterUniqueMeals(transformed));
      setIsRandom(true);
      setAllFetchedMeals([]);
      setPage(0);
    } catch (error) {
      console.error("Failed to fetch random meals:", error);
      if (currentRequestId === requestCountRef.current) {
        setMeals([]);
      }
    } finally {
      if (currentRequestId === requestCountRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // 2. 검색어로 검색하기 - useCallback 적용
  const handleSearch = useCallback(
    async (query) => {
      if (!query.trim()) {
        fetchRandomMeals();
        return;
      }

      const currentRequestId = ++requestCountRef.current;
      setLoading(true);
      try {
        let rawMeals = await MealAPI.searchMealByName(query);
        if (currentRequestId !== requestCountRef.current) return;

        // 이름으로 검색 결과가 없는 경우 재료로 검색
        if (!rawMeals || rawMeals.length === 0) {
          rawMeals = await MealAPI.filterByIngredient(query);
          if (currentRequestId !== requestCountRef.current) return;
        }

        const transformed = rawMeals
          .map((meal) => MealAPI.transformMealData(meal))
          .filter((meal) => meal !== null); // null 항목 필터링으로 데이터 깨짐 방지

        const uniqueMeals = filterUniqueMeals(transformed);
        setAllFetchedMeals(uniqueMeals);
        setPage(0);
        setIsRandom(false);

        // 검색 시 첫 12개 보여주기
        setMeals(uniqueMeals.slice(0, 12));
      } catch (error) {
        console.error("Search failed:", error);
        if (currentRequestId === requestCountRef.current) {
          setMeals([]);
          setAllFetchedMeals([]);
        }
      } finally {
        if (currentRequestId === requestCountRef.current) {
          setLoading(false);
        }
      }
    },
    [fetchRandomMeals],
  );

  // 컴포넌트 마운트 시 최초 랜덤 레시피 6개 로드
  useEffect(() => {
    fetchRandomMeals();
  }, [fetchRandomMeals]);

  // 검색어 입력 디바운스 적용 (600ms)
  useEffect(() => {
    if (searchQuery.trim() === "") {
      fetchRandomMeals();
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      handleSearch(searchQuery);
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, fetchRandomMeals, handleSearch]);

  // 3. 당겨서 새로고침 (랜덤 레시피 상태일 때만 작동)
  const onRefresh = useCallback(async () => {
    if (!isRandom) return;
    setRefreshing(true);
    try {
      const rawMeals = await MealAPI.getRandomMeals(6);
      const transformed = rawMeals
        .map((meal) => MealAPI.transformMealData(meal))
        .filter((meal) => meal !== null); // null 항목 필터링으로 데이터 깨짐 방지
      setMeals(filterUniqueMeals(transformed));
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing(false);
    }
  }, [isRandom]);

  // 4. 무한 스크롤 (Load More) - 12개 항목 끝 부분 도달 시 호출됨 - useCallback 적용
  const loadMoreMeals = useCallback(() => {
    if (isRandom || loading) return;

    const nextPage = page + 1;
    const startIndex = nextPage * 12;

    // 더 보여줄 데이터가 남아있는 경우 누적하여 추가
    if (startIndex < allFetchedMeals.length) {
      const nextBatch = allFetchedMeals.slice(startIndex, startIndex + 12);
      setMeals((prevMeals) => filterUniqueMeals([...prevMeals, ...nextBatch]));
      setPage(nextPage);
    }
  }, [isRandom, loading, page, allFetchedMeals]);

  // 개별 레시피 카드 렌더링 - useCallback 적용
  const renderRecipeItem = useCallback(
    ({ item }) => {
      if (!item) return null; // 방어 코드: item이 null일 경우 렌더링하지 않음
      return (
        <TouchableOpacity
          style={[
            styles.recipeCard,
            { backgroundColor: COLORS.card, shadowColor: COLORS.shadow },
          ]}
          onPress={() => router.push(`/recipe/${item.id}?from=search`)}
          activeOpacity={0.8}
        >
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.recipeImage}
            contentFit="cover"
          />
          <View style={styles.recipeInfo}>
            <Text
              style={[styles.recipeTitle, { color: COLORS.text }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              style={[styles.recipeDesc, { color: COLORS.textLight }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
            <View style={styles.recipeMeta}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={COLORS.textLight}
                />
                <Text style={[styles.metaText, { color: COLORS.textLight }]}>
                  {item.cookTime}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons
                  name="people-outline"
                  size={14}
                  color={COLORS.textLight}
                />
                <Text style={[styles.metaText, { color: COLORS.textLight }]}>
                  {item.servings} Servings
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [router],
  );

  const keyExtractor = useCallback(
    (item, index) => (item?.id ? item.id.toString() : index.toString()),
    [],
  );

  return (
    <View style={searchStyles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: COLORS.text }]}>
          Search Recipes
        </Text>
      </View>

      {/* Search Bar Container */}
      <View style={searchStyles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color={COLORS.textLight}
          style={searchStyles.searchIcon}
        />
        <TextInput
          style={searchStyles.searchInput}
          placeholder="Search recipes, ingredients..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          onSubmitEditing={() => handleSearch(searchQuery)}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={searchStyles.clearButton}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results Header (검색어 입력 후 결과가 있을 때만 표시) */}
      {!isRandom && meals.length > 0 && (
        <View style={[searchStyles.resultsHeader, { paddingHorizontal: 20 }]}>
          <Text style={searchStyles.resultsTitle}>Popular Recipes</Text>
          <Text style={searchStyles.resultsCount}>
            {allFetchedMeals.length} found
          </Text>
        </View>
      )}

      {/* Results List */}
      {loading && meals.length === 0 ? (
        <View style={searchStyles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={meals || []}
          renderItem={renderRecipeItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.resultsScroll}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreMeals}
          onEndReachedThreshold={0.3} // 리스트 끝 30% 영역 도달 시 자동 로드
          refreshControl={
            isRandom ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            ) : undefined
          }
          ListEmptyComponent={
            !loading && (
              <View style={searchStyles.emptyState}>
                <Ionicons
                  name="search-outline"
                  size={60}
                  color={COLORS.border}
                />
                <Text style={searchStyles.emptyTitle}>No recipes found</Text>
                <Text style={searchStyles.emptyDescription}>
                  Try searching for different keywords
                </Text>
              </View>
            )
          }
          ListFooterComponent={
            loading && meals.length > 0 ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={COLORS.primary} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
  },
  resultsScroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recipeCard: {
    flexDirection: "row",
    borderRadius: 16,
    marginBottom: 15,
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
  recipeTitle: {
    fontSize: 16,
    fontWeight: "bold",
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
  footerLoader: {
    paddingVertical: 15,
    alignItems: "center",
  },
});

export default SearchScreen;
