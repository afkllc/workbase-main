import {useEffect, useState} from 'react';
import type {ReactNode} from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import {SafeAreaView} from 'react-native-safe-area-context';
import {formatDisplayName, statusTone} from '../lib/utils';
import {borders, colours, placeholderText, radii, shadows, spacing, surfaces, typography, withAlpha} from '../theme';

export function Screen({
  title,
  subtitle,
  children,
  right,
  scroll = true,
  showHeader = true,
  includeTopInset = true,
  contentContainerStyle,
  onScrollBeginDrag,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  right?: ReactNode;
  scroll?: boolean;
  showHeader?: boolean;
  includeTopInset?: boolean;
  contentContainerStyle?: object;
  onScrollBeginDrag?: () => void;
}) {
  const content = scroll ? (
    <KeyboardAwareScrollView
      contentContainerStyle={[styles.content, !showHeader ? styles.headerlessContent : null, contentContainerStyle]}
      enableOnAndroid
      extraScrollHeight={24}
      keyboardShouldPersistTaps="handled"
      onScrollBeginDrag={onScrollBeginDrag}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </KeyboardAwareScrollView>
  ) : (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flexFill}>
      <View style={[styles.content, !showHeader ? styles.headerlessContent : null, contentContainerStyle]}>{children}</View>
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView edges={includeTopInset ? ['top', 'left', 'right', 'bottom'] : ['left', 'right', 'bottom']} style={styles.safeArea}>
      {showHeader ? (
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {right ? <View>{right}</View> : null}
        </View>
      ) : null}
      {content}
    </SafeAreaView>
  );
}

export function Card({children}: {children: ReactNode}) {
  return <View style={styles.card}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
}) {
  const isPrimary = variant === 'primary';
  const isDestructive = variant === 'destructive';

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.button,
        isPrimary ? styles.primaryButton : isDestructive ? styles.destructiveButton : styles.secondaryButton,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.buttonPressed : null,
      ]}
    >
      <Text style={isPrimary ? styles.primaryButtonText : isDestructive ? styles.destructiveButtonText : styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}

export function Label({children}: {children: ReactNode}) {
  return <Text style={styles.label}>{children}</Text>;
}

export function TextField({
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <TextInput
      multiline={multiline}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={placeholderText}
      style={[styles.input, multiline ? styles.multilineInput : null]}
      value={value}
    />
  );
}

export function StatusBadge({value}: {value: string}) {
  const tone = statusTone(value);

  return (
    <View style={[styles.badge, {backgroundColor: tone.backgroundColor, borderColor: tone.borderColor}]}>
      <Text style={[styles.badgeText, {color: tone.color}]}>{formatDisplayName(value)}</Text>
    </View>
  );
}

export function Notice({children}: {children: ReactNode}) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>{children}</Text>
    </View>
  );
}

export function LoadingRow({label}: {label: string}) {
  return (
    <View style={styles.loadingRow}>
      <ActivityIndicator color={colours.primary} />
      <Text style={styles.loadingText}>{label}</Text>
    </View>
  );
}

export function SuccessBanner({message, onDismiss}: {message: string; onDismiss: () => void}) {
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {toValue: 0, duration: 300, useNativeDriver: true}).start(() => onDismiss());
    }, 2500);

    return () => clearTimeout(timer);
  }, [opacity, onDismiss]);

  return (
    <Animated.View style={[styles.successBanner, {opacity}]}>
      <Text style={styles.successBannerText}>{message}</Text>
    </Animated.View>
  );
}

export function ToggleRow({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        onValueChange={onValueChange}
        trackColor={{false: withAlpha(colours.textSecondary, 0.24), true: withAlpha(colours.primary, 0.34)}}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colours.background,
  },
  flexFill: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenGutter,
    paddingTop: 18,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.compactGap,
  },
  headerText: {
    flex: 1,
  },
  title: {
    ...typography.screenTitle,
    color: colours.textPrimary,
  },
  subtitle: {
    marginTop: 6,
    ...typography.body,
    color: colours.textSecondary,
  },
  content: {
    paddingHorizontal: spacing.screenGutter,
    paddingBottom: 40,
    gap: spacing.sectionGap,
  },
  headerlessContent: {
    paddingTop: 16,
  },
  card: {
    backgroundColor: colours.surface,
    borderColor: borders.subtle,
    borderWidth: 1,
    borderRadius: radii.card,
    padding: spacing.cardPadding,
    gap: spacing.compactGap,
    ...shadows.card,
  },
  button: {
    minHeight: 52,
    borderRadius: radii.button,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colours.primary,
  },
  secondaryButton: {
    backgroundColor: colours.surface,
    borderColor: borders.subtle,
    borderWidth: 1,
  },
  destructiveButton: {
    backgroundColor: colours.destructive,
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonPressed: {
    opacity: 0.92,
  },
  primaryButtonText: {
    color: colours.surface,
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  secondaryButtonText: {
    color: colours.textPrimary,
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  destructiveButtonText: {
    color: colours.surface,
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  label: {
    ...typography.label,
    color: colours.textSecondary,
  },
  input: {
    backgroundColor: surfaces.muted,
    borderColor: borders.subtle,
    borderWidth: 1,
    borderRadius: radii.input,
    paddingHorizontal: spacing.inputPaddingX,
    paddingVertical: spacing.inputPaddingY,
    color: colours.textPrimary,
    fontSize: 15,
  },
  multilineInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.badge,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
  },
  badgeText: {
    ...typography.label,
    letterSpacing: 0.6,
  },
  notice: {
    borderRadius: radii.input,
    backgroundColor: surfaces.destructiveSoft,
    borderColor: borders.destructive,
    borderWidth: 1,
    padding: 14,
  },
  noticeText: {
    color: colours.destructive,
    ...typography.body,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  loadingText: {
    color: colours.textSecondary,
    ...typography.body,
  },
  successBanner: {
    borderRadius: radii.input,
    backgroundColor: surfaces.successSoft,
    borderColor: withAlpha(colours.success, 0.24),
    borderWidth: 1,
    padding: 14,
  },
  successBannerText: {
    color: colours.success,
    ...typography.body,
    fontFamily: 'Inter_600SemiBold',
  },
  toggleRow: {
    backgroundColor: colours.surface,
    borderColor: borders.subtle,
    borderWidth: 1,
    borderRadius: radii.input,
    paddingHorizontal: spacing.inputPaddingX,
    paddingVertical: spacing.inputPaddingY,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    color: colours.textPrimary,
    ...typography.body,
    fontFamily: 'Inter_500Medium',
    flex: 1,
    paddingRight: 12,
  },
});
