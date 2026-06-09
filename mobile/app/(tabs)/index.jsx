import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
  StyleSheet,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/expo';
import { COLORS } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const LATEST_RECIPE = {
  id: 'latest_1',
  title: 'Mediterranean Herb Salmon',
  time: '25m',
  servings: '2 Servings',
  image:
    'https://images.unsplash.com/photo-1485962398705-ef6a13c41e8f?w=800&auto=format&fit=crop&q=80',
};

const CATEGORIES = [
  {
    id: 'pork',
    name: 'Pork',
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'chicken',
    name: 'Chicken',
    image:
      'https://images.unsplash.com/photo-1598908314732-07113901949e?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'beef',
    name: 'Beef',
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'lamb',
    name: 'Lamb',
    image:
      'https://images.unsplash.com/photo-1514516345957-556ca7d90a29?w=200&auto=format&fit=crop&q=80',
  },
  {
    id: 'dessert',
    name: 'Dessert',
    image:
      'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&auto=format&fit=crop&q=80',
  },
];

const RECIPES_DATA = {
  pork: [
    {
      id: 'p1',
      title: 'Crispy Pork Belly',
      time: '50m',
      servings: '3',
      image:
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'p2',
      title: 'Pork Ramen',
      time: '35m',
      servings: '2',
      image:
        'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'p3',
      title: 'Sweet & Sour Pork',
      time: '30m',
      servings: '4',
      image:
        'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'p4',
      title: 'BBQ Pulled Pork',
      time: '120m',
      servings: '6',
      image:
        'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'p5',
      title: 'Pork Chops',
      time: '40m',
      servings: '2',
      image:
        'https://images.unsplash.com/photo-1432139548535-c89d5218973b?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'p6',
      title: 'Spicy Pork Stir-fry',
      time: '20m',
      servings: '2',
      image:
        'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'p7',
      title: 'Pork Dumplings',
      time: '30m',
      servings: '4',
      image:
        'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'p8',
      title: 'Ginger Pork',
      time: '15m',
      servings: '2',
      image:
        'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=400&auto=format&fit=crop&q=80',
    },
  ],
  chicken: [
    {
      id: 'c1',
      title: 'Fried Chicken',
      time: '30m',
      servings: '4',
      image:
        'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'c2',
      title: 'Chicken Alfredo',
      time: '25m',
      servings: '2',
      image:
        'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'c3',
      title: 'Chicken Tikka',
      time: '45m',
      servings: '3',
      image:
        'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'c4',
      title: 'Chicken Salad',
      time: '15m',
      servings: '1',
      image:
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'c5',
      title: 'Chicken Soup',
      time: '60m',
      servings: '4',
      image:
        'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'c6',
      title: 'Honey Garlic Chicken',
      time: '20m',
      servings: '2',
      image:
        'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'c7',
      title: 'Chicken Curry',
      time: '40m',
      servings: '3',
      image:
        'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'c8',
      title: 'Chicken Parmesan',
      time: '35m',
      servings: '2',
      image:
        'https://images.unsplash.com/photo-1632778149955-e80f8ceca3e8?w=400&auto=format&fit=crop&q=80',
    },
  ],
  beef: [
    {
      id: 'b1',
      title: 'Ribeye Steak',
      time: '20m',
      servings: '2',
      image:
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'b2',
      title: 'Beef Bourguignon',
      time: '150m',
      servings: '4',
      image:
        'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'b3',
      title: 'Beef Tacos',
      time: '15m',
      servings: '3',
      image:
        'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'b4',
      title: 'Beef Lasagna',
      time: '60m',
      servings: '6',
      image:
        'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'b5',
      title: 'Beef Bulgogi',
      time: '25m',
      servings: '2',
      image:
        'https://images.unsplash.com/photo-1594911774802-8822a7079ae1?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'b6',
      title: 'Beef Burger',
      time: '15m',
      servings: '1',
      image:
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'b7',
      title: 'Beef Stir-fry',
      time: '20m',
      servings: '2',
      image:
        'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'b8',
      title: 'Beef Stew',
      time: '90m',
      servings: '4',
      image:
        'https://images.unsplash.com/photo-1547592165-e1d17f8e07cc?w=400&auto=format&fit=crop&q=80',
    },
  ],
  lamb: [
    {
      id: 'l1',
      title: 'Lamb Chops',
      time: '20m',
      servings: '2',
      image:
        'https://images.unsplash.com/photo-1514516345957-556ca7d90a29?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'l2',
      title: 'Lamb Curry',
      time: '90m',
      servings: '4',
      image:
        'https://images.unsplash.com/photo-1542362567-b07eac790abc?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'l3',
      title: 'Roast Leg of Lamb',
      time: '120m',
      servings: '8',
      image:
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'l4',
      title: 'Lamb Kebab',
      time: '25m',
      servings: '4',
      image:
        'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'l5',
      title: 'Lamb Stew',
      time: '80m',
      servings: '4',
      image:
        'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'l6',
      title: 'Lamb Shank',
      time: '150m',
      servings: '2',
      image:
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80',
    },
  ],
  dessert: [
    {
      id: 'd1',
      title: 'Chocolate Lava Cake',
      time: '15m',
      servings: '2',
      image:
        'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'd2',
      title: 'New York Cheesecake',
      time: '60m',
      servings: '8',
      image:
        'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'd3',
      title: 'Macarons',
      time: '40m',
      servings: '6',
      image:
        'https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'd4',
      title: 'Tiramisu',
      time: '30m',
      servings: '6',
      image:
        'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'd5',
      title: 'Apple Pie',
      time: '50m',
      servings: '8',
      image:
        'https://images.unsplash.com/photo-1519869325930-281384150729?w=400&auto=format&fit=crop&q=80',
    },
    {
      id: 'd6',
      title: 'Chocolate Brownies',
      time: '25m',
      servings: '9',
      image:
        'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop&q=80',
    },
  ],
};

const HomeScreen = () => {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useAuth();
  const { height, width } = useWindowDimensions();

  const [selectedCategory, setSelectedCategory] = useState('pork');
  const [displayedRecipes, setDisplayedRecipes] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const initialData = RECIPES_DATA[selectedCategory].slice(0, 4);
    setDisplayedRecipes(initialData);
    setPage(1);
    setHasMore(RECIPES_DATA[selectedCategory].length > 4);
  }, [selectedCategory]);

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    setTimeout(() => {
      const nextPage = page + 1;
      const allCategoryRecipes = RECIPES_DATA[selectedCategory];
      const itemsToLoad = nextPage * 4;
      const newBatch = allCategoryRecipes.slice(0, itemsToLoad);

      setDisplayedRecipes(newBatch);
      setPage(nextPage);
      setLoadingMore(false);
      setHasMore(allCategoryRecipes.length > itemsToLoad);
    }, 1000);
  };

  const handleSignOut = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/sign-in');
          } catch (err) {
            Alert.alert('Error', `error: ${JSON.stringify(err)}`);
          }
        },
      },
    ]);
  };

  const userEmail = user?.emailAddresses?.[0]?.emailAddress || 'Guest';
  const userNickName = userEmail.split('@')[0];

  const topSectionHeight = height * 0.2;
  const recentSectionHeight = height * 0.33;
  const cardWidth = (width - 52) / 2;

  const renderRecipeItem = ({ item }) => (
    <TouchableOpacity style={[styles.gridCard, { width: cardWidth }]}>
      <Image
        source={{ uri: item.image }}
        style={styles.gridImage}
        contentFit="cover"
      />
      <View style={styles.gridCardOverlay}>
        <Text style={styles.gridRecipeTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.gridMeta}>
          <View style={styles.gridMetaItem}>
            <Ionicons name="time-outline" size={12} color={COLORS.white} />
            <Text style={styles.gridMetaText}>{item.time}</Text>
          </View>
          <View style={styles.gridMetaItem}>
            <Ionicons name="people-outline" size={12} color={COLORS.white} />
            <Text style={styles.gridMetaText}>{item.servings} Servings</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.welcomeSection}>
        <View>
          <Text
            style={{ fontSize: 14, color: COLORS.textLight, fontWeight: '500' }}
          >
            Welcome back,
          </Text>
          <Text style={styles.welcomeText}>{userNickName} 👋</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={{ padding: 8 }}>
          <Ionicons name="log-out-outline" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <View style={[styles.topSection, { height: topSectionHeight }]}>
        <View style={styles.topImageContainer}>
          <Image
            source={require('../../assets/images/lamb.png')}
            style={styles.topImage}
            contentFit="cover"
          />
        </View>
        <View style={styles.topImageContainer}>
          <Image
            source={require('../../assets/images/pork.png')}
            style={styles.topImage}
            contentFit="cover"
          />
        </View>
        <View style={styles.topImageContainer}>
          <Image
            source={require('../../assets/images/chicken.png')}
            style={styles.topImage}
            contentFit="cover"
          />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.recentSection, { height: recentSectionHeight }]}
      >
        <Image
          source={{ uri: LATEST_RECIPE.image }}
          style={styles.recentImage}
          contentFit="cover"
        />
        <View style={styles.recentOverlay}>
          <View style={styles.recentBadge}>
            <Text style={styles.recentBadgeText}>Latest Recipe</Text>
          </View>
          <View style={styles.recentTextContainer}>
            <Text style={styles.recentTitle}>{LATEST_RECIPE.title}</Text>
            <View style={styles.recentMeta}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.white} />
                <Text style={styles.recentMetaText}>{LATEST_RECIPE.time}</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons
                  name="people-outline"
                  size={16}
                  color={COLORS.white}
                />
                <Text style={styles.recentMetaText}>
                  {LATEST_RECIPE.servings}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.categoriesContainer}>
        <Text style={[styles.sectionTitle, { color: COLORS.text }]}>
          Food Categories
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContent}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryCard,
                  { borderColor: isSelected ? COLORS.primary : COLORS.border },
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Image
                  source={{ uri: cat.image }}
                  style={styles.categoryImage}
                  contentFit="cover"
                />
                <View
                  style={[
                    styles.categoryOverlay,
                    isSelected && { backgroundColor: 'rgba(0,0,0,0.2)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryName,
                      isSelected && { fontWeight: 'bold' },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.listHeaderContainer}>
        <Text style={[styles.listHeaderTitle, { color: COLORS.text }]}>
          {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}{' '}
          Recipes
        </Text>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <FlatList
        data={displayedRecipes}
        renderItem={renderRecipeItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flatListContent: {
    paddingBottom: 20,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  topSection: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 15,
  },
  topImageContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'transparent',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topImage: {
    width: '100%',
    height: '100%',
  },
  recentSection: {
    position: 'relative',
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  recentImage: {
    width: '100%',
    height: '100%',
  },
  recentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'space-between',
    padding: 20,
  },
  recentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  recentBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  recentTextContainer: {
    marginTop: 'auto',
  },
  recentTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  recentMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  recentMetaText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  categoryScrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  categoryCard: {
    width: 90,
    height: 90,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2.5,
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  listHeaderContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  gridCard: {
    height: 170,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    position: 'relative',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridCardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  gridRecipeTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  gridMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  gridMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridMetaText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '500',
  },
  footerLoader: {
    paddingVertical: 15,
    alignItems: 'center',
  },
});

export default HomeScreen;
