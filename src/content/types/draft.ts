export interface DraftData {
  to: string;
  subject: string;
  body: string;
  attachments?: File[];
  isDirty: boolean;
  timestamp: number;
}
