import type * as ImagePicker from 'expo-image-picker';
import type {
  AnalysisSuggestion,
  CreateInspectionPayload,
  TemplateDetail,
  TemplateEditorPayload,
  InspectionRecord,
  InspectionSummary,
  TemplateSummary,
  UpdateSectionsPayload,
} from './types';

import {Platform} from 'react-native';

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const {body, headers: extraHeaders, ...rest} = init ?? {};
  const isFormData = body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    body,
    headers: {
      ...(isFormData ? {} : {'Content-Type': 'application/json'}),
      ...(extraHeaders as Record<string, string> | undefined),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function getReportUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

export function listTemplates() {
  return request<TemplateSummary[]>('/api/templates');
}

export function getTemplate(templateKey: string) {
  return request<TemplateDetail>(`/api/templates/${templateKey}`);
}

export function createTemplate(payload: TemplateEditorPayload) {
  return request<TemplateDetail>('/api/templates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTemplate(templateKey: string, payload: TemplateEditorPayload) {
  return request<TemplateDetail>(`/api/templates/${templateKey}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function listInspections() {
  return request<InspectionSummary[]>('/api/inspections');
}

export function createInspection(payload: CreateInspectionPayload) {
  return request<InspectionRecord>('/api/inspections', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getInspection(inspectionId: string) {
  return request<InspectionRecord>(`/api/inspections/${inspectionId}`);
}

async function buildPhotoFormData(asset: ImagePicker.ImagePickerAsset, itemId?: string): Promise<FormData> {
  const formData = new FormData();
  const fileName = asset.fileName ?? 'capture.jpg';
  const mimeType = asset.mimeType ?? 'image/jpeg';

  if (Platform.OS === 'web') {
    // On web, the {uri, name, type} pattern doesn't work — FormData expects a Blob.
    // Fetch the data URI (or object URL) and convert it to a File/Blob.
    const response = await fetch(asset.uri);
    const blob = await response.blob();
    formData.append('photo', new File([blob], fileName, {type: mimeType}));
  } else {
    // On native (iOS/Android), React Native's FormData polyfill handles the
    // {uri, name, type} object directly — no blob conversion needed.
    formData.append('photo', {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
  }

  if (itemId) {
    formData.append('item_id', itemId);
  }

  return formData;
}

export async function analysePhoto(inspectionId: string, roomId: string, asset: ImagePicker.ImagePickerAsset, itemId?: string) {
  const formData = await buildPhotoFormData(asset, itemId);

  return request<AnalysisSuggestion>(`/api/inspections/${inspectionId}/rooms/${roomId}/analyse-photo`, {
    method: 'POST',
    body: formData,
  });
}

export function updateItem(
  inspectionId: string,
  roomId: string,
  payload: {
    item_id: string;
    condition: string;
    description: string;
    is_confirmed?: boolean;
    source?: string;
    photo_name?: string;
  },
) {
  return request<InspectionRecord>(`/api/inspections/${inspectionId}/rooms/${roomId}/items`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function updateSections(inspectionId: string, payload: UpdateSectionsPayload) {
  return request<InspectionRecord>(`/api/inspections/${inspectionId}/sections`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function runVideoScan(inspectionId: string, roomId: string) {
  return request<InspectionRecord>(`/api/inspections/${inspectionId}/rooms/${roomId}/video-scan`, {
    method: 'POST',
  });
}

export function generateReport(inspectionId: string) {
  return request<InspectionRecord>(`/api/inspections/${inspectionId}/generate`, {
    method: 'POST',
  });
}

export function archiveReport(inspectionId: string) {
  return request<void>(`/api/reports/${inspectionId}/archive`, {
    method: 'PATCH',
  });
}
