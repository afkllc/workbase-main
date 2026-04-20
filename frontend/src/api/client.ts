import type {
  AnalysisSuggestion,
  CreateInspectionPayload,
  InspectionRecord,
  InspectionSummary,
  TemplateSummary,
  UpdateSectionsPayload,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

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
  const requestUrl = buildRequestUrl(path);
  let response: Response;
  try {
    response = await fetch(requestUrl, {
      headers: {
        ...(init?.body instanceof FormData ? {} : {'Content-Type': 'application/json'}),
        ...init?.headers,
      },
      ...init,
    });
  } catch (error) {
    throw new ApiError({
      message: `Couldn't reach the backend at ${API_BASE_URL}. Check that the API is running and reachable from this browser.`,
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
