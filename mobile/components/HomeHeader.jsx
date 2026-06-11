import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { COLORS } from "../constants/colors";
import { homeStyles } from "../assets/styles/home.styles";

const HomeHeader = React.memo(
  ({
    userNickName,
    handleSignOut,
    topSectionHeight,
    categories,
    selectedCategory,
    setSelectedCategory,
    children, // index.jsx에서 전달할 LatestRecipe 컴포넌트
  }) => {
    return (
      <View>
        <View style={homeStyles.welcomeSection}>
          <View>
            <Text
              style={{
                fontSize: 14,
                color: COLORS.textLight,
                fontWeight: "500",
              }}
            >
              Welcome back,
            </Text>
            <Text style={homeStyles.welcomeText}>{userNickName} </Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={{ padding: 8 }}>
            <Ionicons name="log-out-outline" size={28} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.topSection, { height: topSectionHeight }]}>
          <View style={styles.topImageContainer}>
            <Image
              source={require("../assets/images/lamb.png")}
              style={styles.topImage}
              contentFit="cover"
            />
          </View>
          <View style={styles.topImageContainer}>
            <Image
              source={require("../assets/images/pork.png")}
              style={styles.topImage}
              contentFit="cover"
            />
          </View>
          <View style={styles.topImageContainer}>
            <Image
              source={require("../assets/images/chicken.png")}
              style={styles.topImage}
              contentFit="cover"
            />
          </View>
        </View>

        {/* index.jsx에서 전달받은 LatestRecipe 컴포넌트가 위치할 자리 */}
        {children}

        {categories.length > 0 && (
          <View style={homeStyles.categoryFilterContainer}>
            <Text
              style={[
                homeStyles.sectionTitle,
                { marginHorizontal: 20, marginBottom: 12 },
              ]}
            >
              Food Categories
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={homeStyles.categoryFilterScrollContent}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      homeStyles.categoryButton,
                      isSelected && homeStyles.selectedCategory,
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Image
                      source={{ uri: cat.image }}
                      style={[
                        homeStyles.categoryImage,
                        isSelected && homeStyles.selectedCategoryImage,
                      ]}
                      contentFit="cover"
                    />
                    <Text
                      style={[
                        homeStyles.categoryText,
                        isSelected && homeStyles.selectedCategoryText,
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {selectedCategory && (
          <View style={homeStyles.recipesSection}>
            <View style={homeStyles.sectionHeader}>
              <Text style={homeStyles.sectionTitle}>
                {selectedCategory.charAt(0).toUpperCase() +
                  selectedCategory.slice(1)}{" "}
                Recipes
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  },
);

HomeHeader.displayName = "HomeHeader";

const styles = StyleSheet.create({
  topSection: {
    flexDirection: "row",
    width: "100%",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 15,
  },
  topImageContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "transparent",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topImage: {
    width: "100%",
    height: "100%",
  },
});

export default HomeHeader;
