import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/colors';
import { homeStyles } from '../assets/styles/home.styles';

const LatestRecipe = React.memo(({ latestRecipe, recentSectionHeight }) => {
  const router = useRouter();

  if (!latestRecipe) return null;
  
  return (
    <View style={homeStyles.featuredSection}>
      <TouchableOpacity
        style={[homeStyles.featuredCard, { height: recentSectionHeight }]}
        onPress={() => router.push(`/recipe/${latestRecipe.id}`)}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: latestRecipe.image }}
          style={homeStyles.featuredImage}
          contentFit="cover"
        />
        <View style={homeStyles.featuredOverlay}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={homeStyles.featuredBadge}>
              <Text style={homeStyles.featuredBadgeText}>Latest Recipe</Text>
            </View>
            {latestRecipe.area && (
              <View style={[homeStyles.featuredBadge, { backgroundColor: 'rgba(255, 255, 255, 0.25)', flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
                <Ionicons name="globe-outline" size={12} color={COLORS.white} />
                <Text style={homeStyles.featuredBadgeText}>{latestRecipe.area}</Text>
              </View>
            )}
          </View>
          <View style={homeStyles.featuredContent}>
            <Text style={homeStyles.featuredTitle}>{latestRecipe.title}</Text>
            <View style={homeStyles.featuredMeta}>
              <View style={homeStyles.metaItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.white} />
                <Text style={homeStyles.metaText}>{latestRecipe.time}</Text>
              </View>
              <View style={homeStyles.metaItem}>
                <Ionicons
                  name="people-outline"
                  size={16}
                  color={COLORS.white}
                />
                <Text style={homeStyles.metaText}>
                  {latestRecipe.servings}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

LatestRecipe.displayName = 'LatestRecipe';

export default LatestRecipe;
