import React from "react";
import { Animated, Dimensions, Easing, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getProductImage } from "../utils/image";

type FlyPoint = {
  x: number;
  y: number;
  image?: string | null;
};

export function useFlyToCart() {
  const insets = useSafeAreaInsets();
  const flyProgress = React.useRef(new Animated.Value(0)).current;
  const [flyItem, setFlyItem] = React.useState<FlyPoint | null>(null);
  const FLY_SIZE = 84;

  const triggerFlyToCart = React.useCallback(
    (start: FlyPoint) => {
      setFlyItem({
        x: start.x - FLY_SIZE / 2,
        y: start.y - FLY_SIZE / 2,
        image: start.image,
      });
      flyProgress.setValue(0);

      Animated.timing(flyProgress, {
        toValue: 1,
        duration: 1400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => setFlyItem(null));
    },
    [flyProgress],
  );

  const FlyToCartOverlay = React.useMemo(() => {
    if (!flyItem) return null;

    const { width, height } = Dimensions.get("window");
    const TAB_BAR_HORIZONTAL_MARGIN = 20;
    const TAB_COUNT = 5;
    const CART_TAB_INDEX = 3;
    const TAB_BAR_FLOAT_BOTTOM = insets.bottom + 8;
    const TAB_BAR_HEIGHT = 68 + insets.bottom;
    const CART_ICON_CENTER_Y = height - TAB_BAR_FLOAT_BOTTOM - TAB_BAR_HEIGHT / 2;
    const tabSlotWidth = (width - TAB_BAR_HORIZONTAL_MARGIN * 2) / TAB_COUNT;
    const cartTabCenterX =
      TAB_BAR_HORIZONTAL_MARGIN + (CART_TAB_INDEX + 0.5) * tabSlotWidth;
    const targetX = cartTabCenterX - FLY_SIZE / 2;
    const targetY = CART_ICON_CENTER_Y - FLY_SIZE / 2;

    return (
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: flyItem.x,
          top: flyItem.y,
          width: FLY_SIZE,
          height: FLY_SIZE,
          borderRadius: 10,
          overflow: "hidden",
          zIndex: 9999,
          transform: [
            {
              translateX: flyProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, targetX - flyItem.x],
              }),
            },
            {
              translateY: flyProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, targetY - flyItem.y],
              }),
            },
            {
              scale: flyProgress.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.5],
              }),
            },
          ],
          opacity: flyProgress.interpolate({
            inputRange: [0, 0.8, 1],
            outputRange: [1, 1, 0.2],
          }),
        }}
      >
        <Image
          source={{ uri: getProductImage(flyItem.image) }}
          style={{ width: FLY_SIZE, height: FLY_SIZE }}
          resizeMode="cover"
        />
      </Animated.View>
    );
  }, [flyItem, flyProgress, insets.bottom]);

  return { triggerFlyToCart, FlyToCartOverlay };
}
