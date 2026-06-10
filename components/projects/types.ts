export type Assignment = {
  id?: string;
  userId: string | null;
  name: string;
  role: string;
  effort: number;
  effortUnit: string;
};

export type ProjectData = {
  id: string;
  type: string;
  name: string;
  subtitle: string;
  remark: string;
  client: string;
  summary: string;
  effort: number;
  effortUnit: string;
  effortDetail: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
  archived: boolean;
  emailContent: string;
  opEpicUrl: string;
  opEffortUrl: string;
  opQaUrl: string;
  opUserIds: string[];
  assignments: Assignment[];
};

export type MemberLite = {
  id: string;
  name: string;
  role: string;
  team: string | null;
  capacity: number;
};

export type PersonalEventData = {
  id: string;
  title: string;
  type: string;
  color: string;
  startDate: string;
  endDate: string | null;
  memo: string;
};
