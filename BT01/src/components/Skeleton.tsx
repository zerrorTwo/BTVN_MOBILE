import React from "react";
import { View, ViewStyle } from "react-native";
import { MotiView } from "moti";
import { colors } from "../theme";

/**
 * Generic shimmer block — drop it anywhere you'd normally put a Text / Image / View
 * to show a loading placeholder. Uses moti's loop animation (no external deps).
 */
interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = "100%",
  height = 14,
  borderRadius = 6,
  style,
}) => {
  return (
    <MotiView
      from={{ opacity: 0.4 }}
      animate={{ opacity: 0.9 }}
      transition={{
        type: "timing",
        duration: 800,
        loop: true,
        repeatReverse: true,
      }}
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.border.light,
        },
        style as ViewStyle,
      ]}
    />
  );
};

/**
 * Placeholder matching OrderCard dimensions. Used in OrdersScreen while loading.
 */
export const OrderCardSkeleton: React.FC = () => (
  <View
    style={{
      backgroundColor: colors.background.paper,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border.light,
    }}
  >
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
      <Skeleton width={120} height={16} />
      <Skeleton width={80} height={20} borderRadius={10} />
    </View>
    <View style={{ flexDirection: "row", marginBottom: 12 }}>
      <Skeleton width={60} height={60} borderRadius={8} style={{ marginRight: 8 }} />
      <Skeleton width={60} height={60} borderRadius={8} style={{ marginRight: 8 }} />
      <Skeleton width={60} height={60} borderRadius={8} />
    </View>
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border.light,
      }}
    >
      <View>
        <Skeleton width={60} height={10} style={{ marginBottom: 6 }} />
        <Skeleton width={100} height={16} />
      </View>
      <Skeleton width={90} height={16} />
    </View>
  </View>
);

/**
 * Placeholder for OrderDetailScreen loading state.
 */
export const OrderDetailSkeleton: React.FC = () => (
  <View style={{ padding: 16 }}>
    {/* Timeline */}
    <View
      style={{
        backgroundColor: colors.background.paper,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton width="60%" height={14} />
          </View>
        </View>
      ))}
    </View>
    {/* Info rows */}
    <View
      style={{
        backgroundColor: colors.background.paper,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      <Skeleton width="40%" height={16} style={{ marginBottom: 12 }} />
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <Skeleton width="30%" height={12} />
          <Skeleton width="40%" height={12} />
        </View>
      ))}
    </View>
    {/* Items */}
    <View
      style={{
        backgroundColor: colors.background.paper,
        padding: 16,
        borderRadius: 12,
      }}
    >
      <Skeleton width="30%" height={16} style={{ marginBottom: 12 }} />
      {[0, 1].map((i) => (
        <View key={i} style={{ flexDirection: "row", marginBottom: 12 }}>
          <Skeleton width={80} height={80} borderRadius={8} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Skeleton width="80%" height={14} style={{ marginBottom: 8 }} />
            <Skeleton width="40%" height={12} style={{ marginBottom: 8 }} />
            <Skeleton width="50%" height={16} />
          </View>
        </View>
      ))}
    </View>
  </View>
);

/**
 * Placeholder matching CartItem dimensions.
 */
export const CartItemSkeleton: React.FC = () => (
  <View
    style={{
      flexDirection: "row",
      backgroundColor: colors.background.paper,
      padding: 12,
      borderRadius: 12,
      marginBottom: 8,
    }}
  >
    <Skeleton width={80} height={80} borderRadius={8} />
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Skeleton width="90%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="50%" height={12} style={{ marginBottom: 10 }} />
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton width={70} height={16} />
        <Skeleton width={90} height={28} borderRadius={14} />
      </View>
    </View>
  </View>
);
