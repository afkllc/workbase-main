import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {JSX} from 'react';
import {AppShell, ScreenStage} from './components/layout';
import {
  analysePhoto,
  createInspection,
  generateReport,
  getApiBaseUrl,
  getInspection,
  listInspections,
  listTemplates,
  runVideoScan,
  updateItem,
  updateSections,
} from './api/client';
import {HomeScreen} from './screens/HomeScreen';
import {NewInspectionScreen} from './screens/NewInspectionScreen';
import {RoomListScreen} from './screens/RoomListScreen';
import {RoomCaptureScreen} from './screens/RoomCaptureScreen';
import {GeneralScreen, KeysScreen, MeterReadingsScreen} from './screens/SectionScreens';
import {ReportsScreen} from './screens/ReportsScreen';
import {ReviewScreen} from './screens/ReviewScreen';
import type {
  AnalysisSuggestion,
  Condition,
  CreateInspectionPayload,
  InspectionRecord,
  InspectionSummary,
  Screen,
  TemplateSummary,
} from './types';

type SuggestionDraft = AnalysisSuggestion & {
  selectedItemId: string;
  descriptionDraft: string;
  conditionDraft: Condition;
  previewUrl: string | null;
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [inspection, setInspection] = useState<InspectionRecord | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<SuggestionDraft | null>(null);
  const [prefillAddress, setPrefillAddress] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    successTimerRef.current = setTimeout(() => setSuccessMessage(null), 3000);
  }, []);

  const selectedRoom = useMemo(
    () => inspection?.rooms.find((room) => room.id === selectedRoomId) ?? null,
    [inspection, selectedRoomId],
  );
  const totalConfirmed = inspection ? inspection.rooms.reduce((count, room) => count + room.items_confirmed, 0) : 0;
  const totalItems = inspection ? inspection.rooms.reduce((count, room) => count + room.items_total, 0) : 0;
  const allItemsConfirmed = totalItems === 0 || totalConfirmed === totalItems;

  useEffect(() => {
    void loadBootstrap();
  }, []);

  async function loadBootstrap() {
    setLoading(true);
    setError(null);
    try {
      const [templateList, inspectionList] = await Promise.all([listTemplates(), listInspections()]);
      setTemplates(templateList);
      setInspections(inspectionList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load app data.');
    } finally {
      setLoading(false);
    }
  }

  async function refreshInspections() {
    setInspections(await listInspections());
  }

  async function openInspection(inspectionId: string, nextScreen: Screen = 'room-list') {
    setLoading(true);
    setError(null);
    try {
      const detail = await getInspection(inspectionId);
      setInspection(detail);
      setSelectedRoomId(detail.rooms[0]?.id ?? null);
      setScreen(nextScreen);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open inspection.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateInspection(payload: CreateInspectionPayload) {
    setSaving(true);
    setError(null);
    try {
      const created = await createInspection(payload);
      setInspection(created);
      setSelectedRoomId(created.rooms[0]?.id ?? null);
      setScreen('room-list');
      await refreshInspections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create inspection.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAnalysePhoto(file: File) {
    if (!inspection || !selectedRoom) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const analysis = await analysePhoto(inspection.id, selectedRoom.id, file);
      setSuggestion({
        ...analysis,
        selectedItemId: analysis.suggested_item_id,
        descriptionDraft: analysis.description,
        conditionDraft: analysis.condition,
        previewUrl: URL.createObjectURL(file),
      });
      setInspection(await getInspection(inspection.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyse photo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmSuggestion() {
    if (!inspection || !selectedRoom || !suggestion) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await updateItem(inspection.id, selectedRoom.id, {
        item_id: suggestion.selectedItemId,
        condition: suggestion.conditionDraft,
        description: suggestion.descriptionDraft,
        is_confirmed: true,
        source: 'photo_ai',
        photo_name: suggestion.photo_name,
      });
      setInspection(updated);
      setSuggestion(null);
      await refreshInspections();
      showSuccess('Item confirmed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm item.');
    } finally {
      setSaving(false);
    }
  }

  async function handleVideoScan() {
    if (!inspection || !selectedRoom) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      setInspection(await runVideoScan(inspection.id, selectedRoom.id));
      await refreshInspections();
      showSuccess('Room scan complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run room scan.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSections(payload: Parameters<typeof updateSections>[1]) {
    if (!inspection) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      setInspection(await updateSections(inspection.id, payload));
      showSuccess('Section saved');
      setScreen('room-list');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save section.');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmReviewItem(roomId: string, itemId: string, condition: Condition, description: string, photoName?: string) {
    if (!inspection) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      setInspection(
        await updateItem(inspection.id, roomId, {
          item_id: itemId,
          condition,
          description,
          is_confirmed: true,
          source: 'manual',
          photo_name: photoName,
        }),
      );
      await refreshInspections();
      showSuccess('Item confirmed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm review item.');
    } finally {
      setSaving(false);
    }
  }

  async function handleBulkConfirm(items: Array<{roomId: string; itemId: string; condition: Condition; description: string; photoName?: string}>) {
    if (!inspection) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      let latest: InspectionRecord = inspection;
      for (const item of items) {
        latest = await updateItem(inspection.id, item.roomId, {
          item_id: item.itemId,
          condition: item.condition,
          description: item.description,
          is_confirmed: true,
          source: 'manual',
          photo_name: item.photoName,
        });
      }
      setInspection(latest);
      await refreshInspections();
      showSuccess(`${items.length} items confirmed`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to bulk confirm items.');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateReport() {
    if (!inspection) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      setInspection(await generateReport(inspection.id));
      await refreshInspections();
      showSuccess('Report generated');
      setScreen('reports');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report.');
    } finally {
      setSaving(false);
    }
  }

  const completedReports = inspections.filter((entry) => entry.status === 'completed' && !entry.is_archived);
  const stageKey = `${screen}:${inspection?.id ?? 'none'}:${selectedRoomId ?? 'none'}`;

  let screenContent: JSX.Element | null = null;

  if (screen === 'home') {
    screenContent = (
      <HomeScreen
        loading={loading}
        inspections={inspections}
        onOpenInspection={(id) => void openInspection(id)}
        onNewInspection={(address) => {
          setPrefillAddress(address);
          setScreen('new-inspection');
        }}
        onNavigate={(s) => setScreen(s as Screen)}
      />
    );
  }

  if (screen === 'new-inspection') {
    screenContent = (
      <NewInspectionScreen
        templates={templates}
        saving={saving}
        initialAddress={prefillAddress}
        onBack={() => {
          setPrefillAddress(undefined);
          setScreen('home');
        }}
        onSubmit={handleCreateInspection}
      />
    );
  }

  if (screen === 'room-list' && inspection) {
    screenContent = (
      <RoomListScreen
        inspection={inspection}
        onBack={() => setScreen('home')}
        onOpenRoom={(room) => {
          setSelectedRoomId(room.id);
          setSuggestion(null);
          setScreen('room-capture');
        }}
        onGoToReview={() => setScreen('review')}
        onGoToMeters={() => setScreen('meter-readings')}
        onGoToKeys={() => setScreen('keys')}
        onGoToGeneral={() => setScreen('general')}
      />
    );
  }

  if (screen === 'room-capture' && inspection && selectedRoom) {
    screenContent = (
      <RoomCaptureScreen
        inspection={inspection}
        room={selectedRoom}
        suggestion={suggestion}
        saving={saving}
        fileInputRef={fileInputRef}
        onBack={() => setScreen('room-list')}
        onUploadClick={() => fileInputRef.current?.click()}
        onFileChange={(file) => void handleAnalysePhoto(file)}
        onVideoScan={() => void handleVideoScan()}
        onSuggestionChange={setSuggestion}
        onConfirmSuggestion={() => void handleConfirmSuggestion()}
      />
    );
  }

  if (screen === 'meter-readings' && inspection) {
    screenContent = <MeterReadingsScreen inspection={inspection} saving={saving} onBack={() => setScreen('room-list')} onSave={(meter_readings) => void handleSaveSections({meter_readings})} />;
  }

  if (screen === 'keys' && inspection) {
    screenContent = <KeysScreen inspection={inspection} saving={saving} onBack={() => setScreen('room-list')} onSave={(keys_and_fobs) => void handleSaveSections({keys_and_fobs})} />;
  }

  if (screen === 'general' && inspection) {
    screenContent = <GeneralScreen inspection={inspection} saving={saving} onBack={() => setScreen('room-list')} onSave={(general_observations) => void handleSaveSections({general_observations})} />;
  }

  if (screen === 'review' && inspection) {
    screenContent = (
      <ReviewScreen
        inspection={inspection}
        totalConfirmed={totalConfirmed}
        totalItems={totalItems}
        allItemsConfirmed={allItemsConfirmed}
        saving={saving}
        onBack={() => setScreen('room-list')}
        onGenerate={() => void handleGenerateReport()}
        onConfirmItem={(roomId, itemId, condition, description, photoName) => void handleConfirmReviewItem(roomId, itemId, condition, description, photoName)}
        onBulkConfirm={(items) => void handleBulkConfirm(items)}
      />
    );
  }

  if (screen === 'reports') {
    screenContent = <ReportsScreen baseUrl={getApiBaseUrl()} loading={loading} reports={completedReports} onBack={() => setScreen('home')} />;
  }

  return (
    <AppShell currentScreen={screen} error={error} setScreen={setScreen} successMessage={successMessage}>
      <ScreenStage key={stageKey} stageKey={stageKey}>{screenContent}</ScreenStage>
    </AppShell>
  );
}
