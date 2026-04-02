import {Fragment, type ComponentProps} from 'react';
import Feather from '@expo/vector-icons/Feather';
import {useRouter} from 'expo-router';
import type {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {borders, colours, layout, radii, shadows, spacing, surfaces, typography} from '../theme';

type FeatherName = ComponentProps<typeof Feather>['name'];

const TAB_CONFIG: Record<string, {label: string; icon: FeatherName}> = {
  index: {label: 'Home', icon: 'home'},
  inspections: {label: 'Inspections', icon: 'clipboard'},
  reports: {label: 'Reports', icon: 'file-text'},
  settings: {label: 'Settings', icon: 'settings'},
};

export function AppTabBar({state, descriptors, navigation}: BottomTabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.shell, {paddingBottom: Math.max(insets.bottom, spacing.tabBarBottomPadding)}]}>
      <Pressable accessibilityLabel="New inspection" onPress={() => router.push('/new-inspection')} style={styles.centerAction}>
        <Feather color={colours.surface} name="plus" size={26} />
      </Pressable>

      <View style={styles.tabRow}>
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG[route.name] ?? {
            label: descriptors[route.key]?.options?.title ?? route.name,
            icon: 'circle' as FeatherName,
          };
          const isFocused = state.index === index;

          return (
            <Fragment key={route.key}>
              {index === 2 ? <View pointerEvents="none" style={styles.centerSpacer} /> : null}
              <Pressable
                accessibilityLabel={config.label}
                accessibilityRole="button"
                accessibilityState={{selected: isFocused}}
                onPress={() => {
                  const event = navigation.emit({type: 'tabPress', target: route.key, canPreventDefault: true});
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                }}
                style={styles.tabItem}
              >
                <View style={[styles.tabIconShell, isFocused ? styles.tabIconShellActive : null]}>
                  <Feather color={isFocused ? colours.primary : colours.textSecondary} name={config.icon} size={20} />
                </View>
                <Text ellipsizeMode="tail" numberOfLines={1} style={[styles.tabLabel, isFocused ? styles.tabLabelActive : null]}>
                  {config.label}
                </Text>
              </Pressable>
            </Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
    borderTopColor: colours.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    backgroundColor: colours.surface,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  tabRow: {
    minHeight: layout.tabBarHeight,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: 18,
  },
  tabItem: {
    minWidth: 0,
    minHeight: layout.minTouchTarget,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  tabIconShell: {
    minWidth: layout.minTouchTarget - spacing.compactGap,
    height: layout.minTouchTarget - spacing.compactGap,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconShellActive: {
    borderWidth: 1,
    borderColor: borders.primary,
    backgroundColor: surfaces.primarySoft,
  },
  tabLabel: {
    ...typography.label,
    maxWidth: '100%',
    textAlign: 'center',
    flexShrink: 1,
    fontSize: 11,
    color: colours.textSecondary,
    letterSpacing: 0.6,
  },
  tabLabelActive: {
    fontFamily: 'Inter_600SemiBold',
    color: colours.primary,
  },
  centerSpacer: {
    width: layout.centerActionSize + 18,
  },
  centerAction: {
    position: 'absolute',
    top: -18,
    left: '50%',
    width: layout.centerActionSize,
    height: layout.centerActionSize,
    marginLeft: -(layout.centerActionSize / 3),
    borderRadius: radii.badge,
    backgroundColor: colours.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.floating,
  },
});
