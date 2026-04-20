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

function resolveApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL is missing for web build. Set it in Netlify environment variables to your Railway backend URL.',
    );
  }

  return 'http://localhost:8000';
}

const API_BASE_URL = resolveApiBaseUrl();

export class ApiError extends Error {
  status: number | null;
  detail: string;
  baseUrl: string;
  requestUrl: string;
  isNetworkError: boolean;

  constructor({
    message,
    status,
    detail,
    requestUrl,
    isNetworkError = false,
  }: {
    message: string;
    status: number | null;
    detail: string;
    requestUrl: string;
    isNetworkError?: boolean;
  }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
    this.baseUrl = API_BASE_URL;
    this.requestUrl = requestUrl;
    this.isNetworkError = isNetworkError;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

function buildRequestUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function shouldSkipNgrokWarning(baseUrl: string): boolean {
  try {
    const parsed = new URL(baseUrl);
    const host = parsed.hostname.toLowerCase();
    return host.endsWith('.ngrok-free.app') || host.endsWith('.ngrok-free.dev') || host.endsWith('.ngrok.io') || host.endsWith('.ngrok.app');
  } catch {
    return false;
  }
}

function normaliseDetailPayload(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload.trim();
  }
  if (Array.isArray(payload)) {
    return payload.map((entry) => normaliseDetailPayload(entry)).filter(Boolean).join(' ');
  }
  if (payload && typeof payload === 'object') {
    return JSON.stringify(payload);
  }
  return '';
}

function buildErrorMessage(status: number, detail: string): string {
  if (detail) {
    return detail;
  }
  if (status === 409) {
    return 'This action is blocked until the inspection is complete.';
  }
  if (status === 502) {
    return 'The AI service returned an invalid response. Try again in a moment.';
  }
  if (status === 503) {
    return 'The AI service is unavailable or not configured. Check the backend setup and try again.';
  }
  return `Request failed: ${status}`;
}

async function buildApiError(response: Response, requestUrl: string): Promise<ApiError> {
  const rawBody = await response.text();
  let detail = rawBody.trim();

  if (rawBody) {
    try {
      const payload = JSON.parse(rawBody) as {detail?: unknown};
      detail = normaliseDetailPayload(payload.detail) || detail;
    } catch {
      // Leave non-JSON bodies as-is.
    }
  }

  return new ApiError({
    message: buildErrorMessage(response.status, detail),
    status: response.status,
    detail,
    requestUrl,
  });
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const {body, headers: extraHeaders, ...rest} = init ?? {};
  const isFormData = body instanceof FormData;
  const requestUrl = buildRequestUrl(path);
  const skipNgrokWarning = shouldSkipNgrokWarning(API_BASE_URL);

  let response: Response;
  try {
    response = await fetch(requestUrl, {
      ...rest,
      body,
      headers: {
        ...(isFormData ? {} : {'Content-Type': 'application/json'}),
        ...(skipNgrokWarning ? {'ngrok-skip-browser-warning': 'true'} : {}),
        ...(extraHeaders as Record<string, string> | undefined),
      },
    });
  } catch (error) {
    throw new ApiError({
      message: `Couldn't reach the backend at ${API_BASE_URL}. Check that the API is running and reachable from this device.`,
      status: null,
      detail: error instanceof Error ? error.message : '',
      requestUrl,
      isNetworkError: true,
    });
  }

  if (!response.ok) {
    throw await buildApiError(response, requestUrl);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function checkBackendHealth() {
  return request<{status: string}>('/health');
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

export function resetItem(inspectionId: string, roomId: string, itemId: string) {
  return request<InspectionRecord>(`/api/inspections/${inspectionId}/rooms/${roomId}/items/${itemId}/reset`, {
    method: 'POST',
  });
}

export function runVideoScan(inspectionId: string, roomId: string) {
  return request<InspectionRecord>(`/api/inspections/${inspectionId}/rooms/${roomId}/video-scan`, {
    method: 'POST',
  });
}

export function updateSections(inspectionId: string, payload: UpdateSectionsPayload) {
  return request<InspectionRecord>(`/api/inspections/${inspectionId}/sections`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
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
