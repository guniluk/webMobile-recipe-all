import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const FAVORITE_RECIPES = [
  {
    id: '1',
    title: 'Avocado Toast',
    description: 'Crispy sourdough toast with mashed seasoned avocado.',
    image: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=300&auto=format&fit=crop&q=80',
    time: '10m',
    servings: '1'
  },
  {
    id: '3',
    title: 'Classic Pancakes',
    description: 'Fluffy buttermilk pancakes served with maple syrup.',
    image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=300&auto=format&fit=crop&q=80',
    time: '20m',
    servings: '3'
  }
];

const FavoritesScreen = () => {
  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: COLORS.text }]}>Favorites</Text>
      </View>

      {/* Favorites List */}
      <ScrollView contentContainerStyle={styles.favoritesScroll} showsVerticalScrollIndicator={false}>
        {FAVORITE_RECIPES.length > 0 ? (
          FAVORITE_RECIPES.map((recipe) => (
            <TouchableOpacity key={recipe.id} style={[styles.recipeCard, { backgroundColor: COLORS.card, shadowColor: COLORS.shadow }]}>
              <Image source={{ uri: recipe.image }} style={styles.recipeImage} contentFit="cover" />
              <View style={styles.recipeInfo}>
                <View style={styles.titleRow}>
                  <Text style={[styles.recipeTitle, { color: COLORS.text }]} numberOfLines={1}>{recipe.title}</Text>
                  <TouchableOpacity>
                    <Ionicons name="heart" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.recipeDesc, { color: COLORS.textLight }]} numberOfLines={2}>{recipe.description}</Text>
                <View style={styles.recipeMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="time-outline" size={14} color={COLORS.textLight} />
                    <Text style={[styles.metaText, { color: COLORS.textLight }]}>{recipe.time}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={14} color={COLORS.textLight} />
                    <Text style={[styles.metaText, { color: COLORS.textLight }]}>{recipe.servings} Servings</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={60} color={COLORS.border} />
            <Text style={[styles.emptyText, { color: COLORS.textLight }]}>No favorites yet</Text>
            <Text style={[styles.emptySubtext, { color: COLORS.textLight }]}>Tap the heart icon on any recipe to add it here</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  favoritesScroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
  },
  recipeCard: {
    flexDirection: 'row',
    borderRadius: 16,
    marginBottom: 15,
    overflow: 'hidden',
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
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  recipeDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 40,
  }
});

export default FavoritesScreen;
