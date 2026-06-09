import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const MOCK_RECIPES = [
  {
    id: '1',
    title: 'Avocado Toast',
    description: 'Crispy sourdough toast with mashed seasoned avocado.',
    image: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=300&auto=format&fit=crop&q=80',
    time: '10m',
    servings: '1'
  },
  {
    id: '2',
    title: 'Smoothie Bowl',
    description: 'Refreshing smoothie blend topped with fresh berries.',
    image: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=300&auto=format&fit=crop&q=80',
    time: '15m',
    servings: '2'
  },
  {
    id: '3',
    title: 'Classic Pancakes',
    description: 'Fluffy buttermilk pancakes served with maple syrup.',
    image: 'https://images.unsplash.com/photo-1528207776546-365bb710ee93?w=300&auto=format&fit=crop&q=80',
    time: '20m',
    servings: '3'
  },
  {
    id: '4',
    title: 'Tomato Pasta',
    description: 'Rich tomato basil sauce tossed with fresh al dente pasta.',
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&auto=format&fit=crop&q=80',
    time: '25m',
    servings: '2'
  }
];

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Healthy'];

  const filteredRecipes = MOCK_RECIPES.filter(recipe => {
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          recipe.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = true;
    if (selectedCategory !== 'All') {
      if (selectedCategory === 'Breakfast') {
        matchesCategory = ['Avocado Toast', 'Smoothie Bowl', 'Classic Pancakes'].includes(recipe.title);
      } else if (selectedCategory === 'Lunch' || selectedCategory === 'Dinner') {
        matchesCategory = ['Tomato Pasta'].includes(recipe.title);
      } else if (selectedCategory === 'Healthy') {
        matchesCategory = ['Avocado Toast', 'Smoothie Bowl'].includes(recipe.title);
      }
    }
    return matchesSearch && matchesCategory;
  });

  return (
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: COLORS.text }]}>Search Recipes</Text>
      </View>

      {/* Search Bar Container */}
      <View style={[styles.searchContainer, { backgroundColor: COLORS.card, borderColor: COLORS.border }]}>
        <Ionicons name="search-outline" size={20} color={COLORS.textLight} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: COLORS.text }]}
          placeholder="Search recipes, ingredients..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryBadge,
                  { 
                    backgroundColor: isSelected ? COLORS.primary : COLORS.card,
                    borderColor: COLORS.border
                  }
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryText, 
                  { color: isSelected ? COLORS.white : COLORS.text }
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Results List */}
      <ScrollView contentContainerStyle={styles.resultsScroll} showsVerticalScrollIndicator={false}>
        {filteredRecipes.length > 0 ? (
          filteredRecipes.map((recipe) => (
            <TouchableOpacity key={recipe.id} style={[styles.recipeCard, { backgroundColor: COLORS.card, shadowColor: COLORS.shadow }]}>
              <Image source={{ uri: recipe.image }} style={styles.recipeImage} contentFit="cover" />
              <View style={styles.recipeInfo}>
                <Text style={[styles.recipeTitle, { color: COLORS.text }]} numberOfLines={1}>{recipe.title}</Text>
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
            <Ionicons name="search-outline" size={60} color={COLORS.border} />
            <Text style={[styles.emptyText, { color: COLORS.textLight }]}>No recipes found</Text>
            <Text style={[styles.emptySubtext, { color: COLORS.textLight }]}>Try searching for different keywords</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  categoriesContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  categoriesScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultsScroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
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
    marginTop: 60,
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
  }
});

export default SearchScreen;
