import React, { useEffect, useRef } from "react";
import { StyleSheet, Animated, Easing, View } from "react-native";
import { Image } from "expo-image";
import { COLORS } from "../constants/colors";

const AnimatedImage = Animated.createAnimatedComponent(Image);

const CustomRefreshLoader = ({ refreshing }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (refreshing) {
      // 1. 회전 애니메이션 시작 (무한 루프)
      rotateAnim.setValue(0);
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // 2. 나타날 때 슬라이드 다운 애니메이션
      Animated.spring(slideAnim, {
        toValue: 60, // Safe Area와 겹치지 않게 조절한 상단 여백
        useNativeDriver: true,
        tension: 40,
        friction: 6,
      }).start();
    } else {
      // 3. 사라질 때 슬라이드 업 애니메이션
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start(() => {
        rotateAnim.stopAnimation();
      });
    }
  }, [refreshing, rotateAnim, slideAnim]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="none" // 스크롤 등 터치 이벤트를 방해하지 않음
    >
      <View style={styles.card}>
        <AnimatedImage
          source={require("../assets/images/cooking_loader.jpg")}
          style={[styles.image, { transform: [{ rotate }] }]}
          contentFit="cover"
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 9999,
  },
  card: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 1.5,
    borderColor: COLORS.primary + "30", // 테마의 primary 색상 기반 투명한 보더
  },
  image: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
});

export default CustomRefreshLoader;
