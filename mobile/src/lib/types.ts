export type Condition = 'good' | 'fair' | 'poor' | 'damaged' | 'na';
export type InspectionStatus = 'draft' | 'processing' | 'completed';
export type RoomStatus = 'not_started' | 'capturing' | 'review' | 'confirmed';
export type CaptureMode = 'photo' | 'video';
export type ItemSource = 'manual' | 'photo_ai' | 'video_ai';
export type TemplateSource = 'built_in' | 'custom';

export interface TemplateSummary {
  key: string;
  name: string;
  property_type: string;
  version: string;
  source: TemplateSource;
  is_editable: boolean;
}

export interface TemplateItem {
  key: string;
  name: string;
  display_order: number;
  condition_options: Condition[];
  photo_required: boolean;
  max_photos: number;
  guidance_note: string;
  ai_hints: string[];
}

export interface TemplateRoom {
  key: string;
  name: string;
  display_order: number;
  is_required: boolean;
  items: TemplateItem[];
}

export interface TemplateDetail extends TemplateSummary {
  rooms: TemplateRoom[];
  optional_rooms: TemplateRoom[];
  fixed_sections: Record<string, unknown>;
}

export interface ItemRecord {
  id: string;
  key: string;
  name: string;
  photo_required: boolean;
  condition: Condition | null;
  description: string;
  ai_confidence: 'high' | 'medium' | 'low' | null;
  source: ItemSource;
  is_confirmed: boolean;
  photos: string[];
}

export interface RoomRecord {
  id: string;
  key: string;
  name: string;
  display_order: number;
  status: RoomStatus;
  capture_mode: CaptureMode;
  items_total: number;
  items_confirmed: number;
  items: ItemRecord[];
}

export interface MeterReadings {
  gas: string;
  electric: string;
  water: string;
}

export interface GeneralObservations {
  smoke_alarms: boolean;
  co_detector: boolean;
  overall_cleanliness: string;
  additional_notes: string;
}

export interface InspectionSections {
  meter_readings: MeterReadings;
  keys_and_fobs: Record<string, number>;
  general_observations: GeneralObservations;
}

export interface InspectionRecord {
  id: string;
  template_key: string;
  property_type: string;
  property_address: string;
  postcode: string;
  landlord_name: string;
  tenant_names: string;
  created_at: string;
  inspection_date: string;
  status: InspectionStatus;
  rooms: RoomRecord[];
  sections: InspectionSections;
  sections_completed: boolean;
  is_archived: boolean;
  archived_at: string | null;
  report_url: string | null;
}

export interface InspectionSummary {
  id: string;
  property_address: string;
  postcode: string;
  property_type: string;
  inspection_date: string;
  status: InspectionStatus;
  rooms_count: number;
  confirmed_items: number;
  total_items: number;
  is_archived: boolean;
  archived_at: string | null;
  report_url: string | null;
}

export interface CreateInspectionPayload {
  template_key: string;
  property_address: string;
  postcode: string;
  landlord_name: string;
  tenant_names: string;
  inspection_date: string;
}

export interface EditableTemplateItem {
  key: string;
  name: string;
  condition_options: Condition[];
  photo_required: boolean;
  max_photos: number;
  guidance_note: string;
  ai_hints: string[];
}

export interface EditableTemplateRoom {
  key: string;
  name: string;
  is_required: boolean;
  items: EditableTemplateItem[];
}

export interface TemplateEditorPayload {
  name: string;
  property_type: string;
  rooms: EditableTemplateRoom[];
}

export interface UpdateSectionsPayload {
  meter_readings?: MeterReadings;
  keys_and_fobs?: Record<string, number>;
  general_observations?: GeneralObservations;
}

export interface AnalysisSuggestion {
  suggested_item_id: string;
  suggested_item_name: string;
  suggested_item_key: string;
  condition: Condition;
  confidence: 'high' | 'medium' | 'low';
  description: string;
  photo_name: string;
}
