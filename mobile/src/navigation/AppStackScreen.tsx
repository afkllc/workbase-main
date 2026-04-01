import type {ReactNode} from 'react';
import Feather from '@expo/vector-icons/Feather';
import {Alert, Pressable, StyleSheet, Text} from 'react-native';
import {Stack, useNavigation, useRouter} from 'expo-router';
import {useNavigationState, usePreventRemove} from '@react-navigation/native';
import type {InspectionRecord} from '../lib/types';
import {isMainTabRoute} from '../lib/utils';
import {colours, spacing, typography} from '../theme';

type RouteStateLike = {
  index?: number;
  routes: RouteLike[];
};

type RouteLike = {
  name: string;
  params?: Record<string, unknown>;
  state?: RouteStateLike;
};

type AppStackScreenProps = {
  title: string;
  fallbackBackLabel: string;
  fallbackHref: string;
  inspection?: InspectionRecord | null;
  preventRemove?: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  headerRight?: () => ReactNode;
};

function getFocusedRoute(route: RouteLike): RouteLike {
  let current = route;

  while (current.state?.routes?.length) {
    const index = current.state.index ?? current.state.routes.length - 1;
    const next = current.state.routes[index];
    if (!next) {
      break;
    }
    current = next;
  }

  return current;
}

function getParamString(route: RouteLike, key: string): string | null {
  const value = route.params?.[key];
  return typeof value === 'string' ? value : null;
}

function getRoomName(inspection: InspectionRecord | null | undefined, roomId: string | null): string | null {
  if (!inspection || !roomId) {
    return null;
  }

  const room = inspection.rooms.find((entry) => entry.id === roomId);
  return room?.name ?? null;
}

function getRouteLabel(route: RouteLike | undefined, inspection: InspectionRecord | null | undefined): string | null {
  if (!route) {
    return null;
  }

  const focusedRoute = getFocusedRoute(route);

  switch (focusedRoute.name) {
    case '(tabs)':
      return 'Home';
    case 'index':
      return 'Home';
    case 'inspections':
      return 'Inspections';
    case 'reports':
      return 'Reports';
    case 'settings':
      return 'Settings';
    case 'new-inspection':
      return 'New Inspection';
    case 'template-builder':
      return 'Template Builder';
    case 'inspection/[inspectionId]':
      return 'Inspection';
    case 'inspection/[inspectionId]/sections':
      return 'Inspection Sections';
    case 'inspection/[inspectionId]/review':
      return 'Review Inspection';
    case 'inspection/[inspectionId]/room/[roomId]': {
      const roomName = getRoomName(inspection, getParamString(focusedRoute, 'roomId'));
      return roomName ? `${roomName} - Capture` : 'Room Capture';
    }
    case 'inspection/[inspectionId]/room/[roomId]/video-scan': {
      const roomName = getRoomName(inspection, getParamString(focusedRoute, 'roomId'));
      return roomName ? `${roomName} - Video Scan` : 'Video Scan';
    }
    default:
      return null;
  }
}

function HeaderBackButton({
  label,
  onPress,
  tintColor,
}: {
  label: string | null;
  onPress: () => void;
  tintColor?: string;
}) {
  return (
    <Pressable hitSlop={12} onPress={onPress} style={styles.backButton}>
      <Feather color={tintColor ?? colours.textPrimary} name="chevron-left" size={20} />
      {label ? <Text numberOfLines={1} style={[styles.backLabel, {color: tintColor ?? colours.textPrimary}]}>{label}</Text> : null}
    </Pressable>
  );
}

export function AppStackScreen({
  title,
  fallbackBackLabel,
  fallbackHref,
  inspection,
  preventRemove = false,
  confirmTitle = 'Leave this screen?',
  confirmMessage = 'Unsaved changes will be lost.',
  headerRight,
}: AppStackScreenProps) {
  const navigation = useNavigation();
  const router = useRouter();
  const state = useNavigationState((currentState) => currentState);
  const previousRoute = state.routes[state.index - 1] as RouteLike | undefined;

  const previousFocused = previousRoute ? getFocusedRoute(previousRoute) : undefined;
  const returningToMainTab = previousFocused ? isMainTabRoute(previousFocused.name) : false;
  const backLabel = returningToMainTab ? null : (getRouteLabel(previousRoute, inspection) ?? fallbackBackLabel);

  usePreventRemove(preventRemove, ({data}) => {
    Alert.alert(confirmTitle, confirmMessage, [
      {text: 'Stay', style: 'cancel'},
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () => {
          navigation.dispatch(data.action);
        },
      },
    ]);
  });

  function handleBackPress() {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    const leave = () => {
      router.replace(fallbackHref);
    };

    if (preventRemove) {
      Alert.alert(confirmTitle, confirmMessage, [
        {text: 'Stay', style: 'cancel'},
        {text: 'Leave', style: 'destructive', onPress: leave},
      ]);
      return;
    }

    leave();
  }

  return (
    <Stack.Screen
      options={{
        headerShown: true,
        headerBackVisible: false,
        headerTitle: title,
        headerTitleStyle: styles.headerTitle,
        headerStyle: styles.header,
        headerTintColor: colours.textPrimary,
        headerShadowVisible: false,
        headerLeft: ({tintColor}) => <HeaderBackButton label={backLabel} onPress={handleBackPress} tintColor={tintColor} />,
        headerRight,
      }}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colours.background,
  },
  headerTitle: {
    color: colours.textPrimary,
    ...typography.cardTitle,
  },
  backButton: {
    maxWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 48,
    marginLeft: spacing.screenGutter - 4,
    paddingVertical: 6,
    paddingRight: 8,
  },
  backLabel: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});
