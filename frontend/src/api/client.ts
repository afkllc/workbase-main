import type {
  AnalysisSuggestion,
  CreateInspectionPayload,
  InspectionRecord,
  InspectionSummary,
  TemplateSummary,
  UpdateSectionsPayload,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      ...(init?.body instanceof FormData ? {} : {'Content-Type': 'application/json'}),
      ...init?.headers,
    },
    ...init,
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

export function listTemplates() {
  return request<TemplateSummary[]>('/api/templates');
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

export function analysePhoto(inspectionId: string, roomId: string, file: File) {
  const formData = new FormData();
  formData.append('photo', file);
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
