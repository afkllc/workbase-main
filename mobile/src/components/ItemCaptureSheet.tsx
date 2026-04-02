import Feather from '@expo/vector-icons/Feather';
import BottomSheet, {BottomSheetBackdrop, BottomSheetScrollView, BottomSheetTextInput} from '@gorhom/bottom-sheet';
import type {BottomSheetBackdropProps} from '@gorhom/bottom-sheet';
import * as ImagePicker from 'expo-image-picker';
import {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {analysePhoto} from '../lib/api';
import type {Condition, ItemRecord, ItemSource} from '../lib/types';
import {formatCondition, statusTone} from '../lib/utils';
import {borders, colours, placeholderText, radii, shadows, spacing, surfaces, typography, withAlpha} from '../theme';
import {AiPill} from './AiPill';
import {Button, Notice} from './ui';

type CaptureState = 'idle' | 'uploading' | 'analysing' | 'review' | 'confirmed';
type SheetCondition = Extract<Condition, 'good' | 'fair' | 'poor' | 'na'>;

export type ItemCaptureSheetMode = 'fallback' | 'manual_review' | 'edit';

export type ItemCaptureConfirmPayload = {
  itemId: string;
  condition: Condition;
  description: string;
  source: Extract<ItemSource, 'manual' | 'photo_ai'>;
  photoName?: string;
};

type ItemCaptureSheetProps = {
  item: ItemRecord;
  inspectionId: string;
  roomId: string;
  mode: ItemCaptureSheetMode;
  onConfirm: (payload: ItemCaptureConfirmPayload) => void;
  onDismiss: () => void;
  initialAsset?: ImagePicker.ImagePickerAsset;
  initialError?: string | null;
  initialCondition?: Condition | null;
  initialDescription?: string;
  initialPhotoName?: string;
};

const SHEET_SNAP_POINTS: Array<string | number> = ['50%', '92%'];
const SHEET_CONDITIONS: SheetCondition[] = ['good', 'fair', 'poor', 'na'];
const DescriptionInput = Platform.OS === 'web' ? TextInput : BottomSheetTextInput;

function normaliseCondition(condition: Condition | null | undefined): SheetCondition {
  if (condition === 'good' || condition === 'fair' || condition === 'poor' || condition === 'na') {
    return condition;
  }

  if (condition === 'damaged') {
    return 'poor';
  }

  return 'na';
}

export function ItemCaptureSheet({
  item,
  inspectionId,
  roomId,
  mode,
  onConfirm,
  onDismiss,
  initialAsset,
  initialError = null,
  initialCondition,
  initialDescription,
  initialPhotoName,
}: ItemCaptureSheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const requestIdRef = useRef(0);
  const isClosingRef = useRef(false);
  const [captureState, setCaptureState] = useState<CaptureState>(mode === 'fallback' ? 'idle' : 'review');
  const [selectedAsset, setSelectedAsset] = useState<ImagePicker.ImagePickerAsset | null>(initialAsset ?? null);
  const [conditionDraft, setConditionDraft] = useState<SheetCondition>(normaliseCondition(initialCondition ?? item.condition));
  const [descriptionDraft, setDescriptionDraft] = useState(initialDescription ?? item.description);
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [analysisSucceeded, setAnalysisSucceeded] = useState(mode === 'edit' && item.source === 'photo_ai');
  const [photoName, setPhotoName] = useState<string | undefined>(initialPhotoName ?? initialAsset?.fileName ?? undefined);

  const isBusy = captureState === 'uploading' || captureState === 'analysing';
  const canSkipPhoto = !item.photo_required;
  const initialIndex = mode === 'fallback' ? 0 : 1;

  useEffect(() => {
    isClosingRef.current = false;

    return () => {
      isClosingRef.current = true;
      requestIdRef.current += 1;
    };
  }, []);

  function renderBackdrop(props: BottomSheetBackdropProps) {
    return <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.24} pressBehavior="close" />;
  }

  function dismissSheet() {
    isClosingRef.current = true;
    requestIdRef.current += 1;
    bottomSheetRef.current?.close();
  }

  function handleClosed() {
    onDismiss();
  }

  function seedReviewDraft(params?: {
    asset?: ImagePicker.ImagePickerAsset;
    condition?: Condition | null;
    description?: string;
    photoName?: string;
    error?: string | null;
    analysisSucceeded?: boolean;
  }) {
    if (params?.asset) {
      setSelectedAsset(params.asset);
    }
    if (params?.photoName !== undefined) {
      setPhotoName(params.photoName);
    }

    setConditionDraft(normaliseCondition(params?.condition ?? initialCondition ?? item.condition));
    setDescriptionDraft(params?.description ?? initialDescription ?? item.description);
    setAnalysisSucceeded(params?.analysisSucceeded ?? false);
    setErrorMessage(params?.error ?? null);
    setCaptureState('review');
    bottomSheetRef.current?.snapToIndex(1);
  }

  async function startAnalysis(asset: ImagePicker.ImagePickerAsset) {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setSelectedAsset(asset);
    setPhotoName(asset.fileName ?? 'capture.jpg');
    setAnalysisSucceeded(false);
    setErrorMessage(null);
    setCaptureState('uploading');
    bottomSheetRef.current?.snapToIndex(1);
    setCaptureState('analysing');

    try {
      const analysis = await analysePhoto(inspectionId, roomId, asset, item.id);
      if (isClosingRef.current || requestId !== requestIdRef.current) {
        return;
      }

      seedReviewDraft({
        asset,
        condition: analysis.condition,
        description: analysis.description,
        photoName: analysis.photo_name,
        analysisSucceeded: true,
      });
    } catch (error) {
      if (isClosingRef.current || requestId !== requestIdRef.current) {
        return;
      }

      seedReviewDraft({
        asset,
        photoName: asset.fileName ?? 'capture.jpg',
        error: error instanceof Error ? error.message : 'AI analysis failed. You can continue manually.',
        analysisSucceeded: false,
      });
    }
  }

  async function handleTakePhoto() {
    setErrorMessage(null);

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setCaptureState('idle');
      setErrorMessage('Camera permission is required to capture inspection photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      setCaptureState('idle');
      setErrorMessage('Camera capture cancelled.');
      return;
    }

    void startAnalysis(result.assets[0]);
  }

  async function handleChooseFromLibrary() {
    setErrorMessage(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setCaptureState('idle');
      setErrorMessage('Photo library permission is required to choose an inspection photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      setCaptureState('idle');
      setErrorMessage('Photo selection cancelled.');
      return;
    }

    void startAnalysis(result.assets[0]);
  }

  function handleConfirm() {
    let source: Extract<ItemSource, 'manual' | 'photo_ai'> = 'manual';
    if (selectedAsset && analysisSucceeded) {
      source = 'photo_ai';
    } else if (mode === 'edit' && item.source === 'photo_ai') {
      source = 'photo_ai';
    }

    setCaptureState('confirmed');
    onConfirm({
      itemId: item.id,
      condition: conditionDraft,
      description: descriptionDraft,
      source,
      photoName: selectedAsset ? photoName : undefined,
    });
    dismissSheet();
  }

  function handleSkipPhoto() {
    setCaptureState('confirmed');
    onConfirm({
      itemId: item.id,
      condition: 'na',
      description: descriptionDraft,
      source: 'manual',
    });
    dismissSheet();
  }

  function renderIdleState() {
    return (
      <View style={styles.section}>
        <View style={styles.titleBlock}>
          <Text style={styles.itemTitle}>{item.name}</Text>
          <Text style={styles.supportingCopy}>Take a photo now, choose one from your library, or continue without a photo when it is not required.</Text>
        </View>

        {errorMessage ? <Notice>{errorMessage}</Notice> : null}

        <View style={styles.actionCard}>
          <Feather color={colours.primary} name="camera" size={28} />
          <Text style={styles.actionCardTitle}>Ready to capture</Text>
          <Text style={styles.actionCardCopy}>Open the camera again or use a saved photo to generate a condition and short description.</Text>
        </View>

        <View style={styles.buttonStack}>
          <Button label="Take photo" onPress={() => void handleTakePhoto()} />
          <Button label="Choose from library" onPress={() => void handleChooseFromLibrary()} variant="secondary" />
        </View>

        {canSkipPhoto ? (
          <Pressable hitSlop={8} onPress={handleSkipPhoto} style={styles.linkButton}>
            <Text style={styles.linkText}>Skip photo</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  function renderAnalysingState() {
    return (
      <View style={styles.section}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        {selectedAsset?.uri ? <Image source={{uri: selectedAsset.uri}} style={styles.preview} /> : null}
        <View style={styles.analysisPanel}>
          <AiPill />
          <View style={styles.loadingCopy}>
            <Text style={styles.loadingTitle}>Analysing photo...</Text>
            <Text style={styles.loadingBody}>Generating a condition and a short description for this checklist item.</Text>
          </View>
          <ActivityIndicator color={colours.primary} />
        </View>
      </View>
    );
  }

  function renderReviewState() {
    const supportingCopy =
      mode === 'edit'
        ? 'Adjust the saved condition or description, or retake the photo if needed.'
        : 'Review the draft and confirm, or retake if this result needs correcting.';

    return (
      <View style={styles.section}>
        <View style={styles.titleBlock}>
          <Text style={styles.itemTitle}>{item.name}</Text>
          <Text style={styles.supportingCopy}>{supportingCopy}</Text>
        </View>
        {selectedAsset?.uri ? <Image source={{uri: selectedAsset.uri}} style={styles.preview} /> : null}

        {errorMessage ? <Notice>{errorMessage}</Notice> : null}

        <View style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <View style={styles.reviewHeaderCopy}>
              <Text style={styles.fieldLabel}>Condition</Text>
              <Text style={styles.supportingCopy}>Choose the best match for this item.</Text>
            </View>
          </View>

          <View style={styles.conditionGrid}>
            {SHEET_CONDITIONS.map((condition) => {
              const isSelected = conditionDraft === condition;
              const tone = statusTone(condition);

              return (
                <Pressable
                  key={condition}
                  hitSlop={6}
                  onPress={() => setConditionDraft(condition)}
                  style={({pressed}) => [
                    styles.conditionOption,
                    isSelected
                      ? {
                          backgroundColor: tone.backgroundColor,
                          borderColor: tone.borderColor,
                        }
                      : styles.conditionOptionIdle,
                    pressed ? styles.conditionOptionPressed : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.conditionOptionText,
                      isSelected ? {color: tone.color} : styles.conditionOptionTextIdle,
                    ]}
                  >
                    {formatCondition(condition)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.descriptionField}>
            <Text style={styles.fieldLabel}>Description</Text>
            <DescriptionInput
              multiline
              numberOfLines={4}
              onChangeText={setDescriptionDraft}
              placeholder="Add a short condition note"
              placeholderTextColor={placeholderText}
              style={styles.textInput}
              textAlignVertical="top"
              value={descriptionDraft}
            />
          </View>
        </View>

        <View style={styles.buttonStack}>
          <Button label="Confirm" onPress={handleConfirm} disabled={isBusy} />
        </View>

        <View style={styles.secondaryActions}>
          <Button label="Retake photo" onPress={() => void handleTakePhoto()} variant="secondary" disabled={isBusy} />
          <Button label="Choose from library" onPress={() => void handleChooseFromLibrary()} variant="secondary" disabled={isBusy} />
        </View>

        {canSkipPhoto ? (
          <Pressable hitSlop={8} onPress={handleSkipPhoto} style={styles.linkButton}>
            <Text style={styles.linkText}>Skip photo</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <BottomSheet
      ref={bottomSheetRef}
      animateOnMount
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
      index={initialIndex}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onClose={handleClosed}
      snapPoints={SHEET_SNAP_POINTS}
    >
      <BottomSheetScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        {captureState === 'idle' ? renderIdleState() : null}
        {captureState === 'uploading' || captureState === 'analysing' ? renderAnalysingState() : null}
        {captureState === 'review' ? renderReviewState() : null}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colours.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleIndicator: {
    backgroundColor: withAlpha(colours.textSecondary, 0.24),
    width: 48,
  },
  contentContainer: {
    paddingHorizontal: spacing.screenGutter,
    paddingBottom: 36,
  },
  section: {
    gap: spacing.sectionGap,
  },
  titleBlock: {
    gap: spacing.tightGap,
  },
  itemTitle: {
    ...typography.sectionTitle,
    color: colours.textPrimary,
  },
  supportingCopy: {
    ...typography.body,
    color: colours.textSecondary,
  },
  actionCard: {
    alignItems: 'center',
    borderRadius: radii.card,
    borderColor: borders.subtle,
    borderWidth: 1,
    backgroundColor: colours.surface,
    paddingHorizontal: spacing.cardPadding,
    paddingVertical: spacing.cardPadding + 6,
    gap: spacing.tightGap,
    ...shadows.card,
  },
  actionCardTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  actionCardCopy: {
    ...typography.body,
    color: colours.textSecondary,
    textAlign: 'center',
  },
  buttonStack: {
    gap: spacing.compactGap,
  },
  secondaryActions: {
    gap: spacing.tightGap,
  },
  linkButton: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.tightGap,
  },
  linkText: {
    ...typography.body,
    color: colours.primary,
    fontFamily: 'Inter_600SemiBold',
  },
  preview: {
    width: '100%',
    height: 240,
    borderRadius: radii.card,
    backgroundColor: surfaces.muted,
  },
  analysisPanel: {
    borderRadius: radii.card,
    borderColor: borders.subtle,
    borderWidth: 1,
    backgroundColor: colours.surface,
    padding: spacing.cardPadding,
    gap: spacing.compactGap,
    ...shadows.card,
  },
  loadingCopy: {
    gap: 4,
  },
  loadingTitle: {
    ...typography.cardTitle,
    color: colours.textPrimary,
  },
  loadingBody: {
    ...typography.body,
    color: colours.textSecondary,
  },
  reviewCard: {
    borderRadius: radii.card,
    borderColor: borders.subtle,
    borderWidth: 1,
    backgroundColor: colours.surface,
    padding: spacing.cardPadding,
    gap: spacing.sectionGap,
    ...shadows.card,
  },
  reviewHeader: {
    gap: spacing.tightGap,
  },
  reviewHeaderCopy: {
    gap: 4,
  },
  fieldLabel: {
    ...typography.label,
    color: colours.textSecondary,
  },
  conditionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.tightGap,
  },
  conditionOption: {
    minHeight: 52,
    minWidth: '47%',
    flexGrow: 1,
    borderRadius: radii.input,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.inputPaddingX,
    paddingVertical: spacing.inputPaddingY - 2,
  },
  conditionOptionIdle: {
    backgroundColor: colours.surface,
    borderColor: borders.subtle,
  },
  conditionOptionPressed: {
    opacity: 0.9,
  },
  conditionOptionText: {
    ...typography.body,
    fontFamily: 'Inter_600SemiBold',
  },
  conditionOptionTextIdle: {
    color: colours.textSecondary,
  },
  descriptionField: {
    gap: spacing.tightGap,
  },
  textInput: {
    minHeight: 110,
    borderRadius: radii.input,
    borderColor: borders.subtle,
    borderWidth: 1,
    backgroundColor: surfaces.muted,
    paddingHorizontal: spacing.inputPaddingX,
    paddingVertical: spacing.inputPaddingY,
    color: colours.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
});
