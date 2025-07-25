import React from 'react';
import { View, StyleSheet, Animated, useEffect, useRef } from 'react-native';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#e2e8f0', '#f1f5f9'],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

export const ProviderCardSkeleton: React.FC = () => (
  <View style={styles.cardSkeleton}>
    <View style={styles.headerSkeleton}>
      <SkeletonLoader width={60} height={60} borderRadius={30} />
      <View style={styles.infoSkeleton}>
        <SkeletonLoader width="70%" height={18} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="50%" height={14} style={{ marginBottom: 4 }} />
        <SkeletonLoader width="60%" height={14} />
      </View>
      <SkeletonLoader width={60} height={20} borderRadius={10} />
    </View>
    <View style={styles.detailsSkeleton}>
      <SkeletonLoader width="40%" height={16} />
      <SkeletonLoader width={80} height={24} borderRadius={12} />
    </View>
  </View>
);

export const MapSkeleton: React.FC = () => (
  <View style={styles.mapSkeleton}>
    <SkeletonLoader width="100%" height="100%" borderRadius={16} />
    <View style={styles.mapOverlaySkeleton}>
      <SkeletonLoader width={32} height={32} borderRadius={16} />
      <SkeletonLoader width="60%" height={20} style={{ marginTop: 8 }} />
      <SkeletonLoader width="40%" height={16} style={{ marginTop: 4 }} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e2e8f0',
  },
  cardSkeleton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerSkeleton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoSkeleton: {
    flex: 1,
    marginLeft: 12,
  },
  detailsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mapSkeleton: {
    position: 'relative',
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapOverlaySkeleton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});