import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { COLORS } from "../constants/colors";
import { recipeCardStyles } from "../assets/styles/home.styles";

const RecipeItem = React.memo(({ item }) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[recipeCardStyles.container, { marginBottom: 12 }]}
      onPress={() => router.push(`/recipe/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={recipeCardStyles.imageContainer}>
        <Image
          source={{ uri: item.image }}
          style={recipeCardStyles.image}
          contentFit="cover"
        />
      </View>
      <View style={recipeCardStyles.content}>
        <Text style={recipeCardStyles.title} numberOfLines={1}>
          {item.title}
        </Text>
        {item.area ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginBottom: 4,
            }}
          >
            <Ionicons name="globe-outline" size={12} color={COLORS.primary} />
            <Text
              style={{ fontSize: 11, color: COLORS.primary, fontWeight: "700" }}
            >
              {item.area}
            </Text>
          </View>
        ) : (
          <ActivityIndicator
            size="small"
            color={COLORS.primary}
            style={{ alignSelf: "flex-start", marginBottom: 4 }}
          />
        )}
        <View style={recipeCardStyles.footer}>
          <View style={recipeCardStyles.timeContainer}>
            <Ionicons name="time-outline" size={14} color={COLORS.textLight} />
            <Text style={recipeCardStyles.timeText}>{item.time}</Text>
          </View>
          <View style={recipeCardStyles.servingsContainer}>
            <Ionicons name="people-outline" size={14} color={COLORS.textLight} />
            <Text style={recipeCardStyles.servingsText}>
              {item.servings} Servings
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

RecipeItem.displayName = "RecipeItem";

export default RecipeItem;

