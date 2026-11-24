export interface PeriodSummary {
  id: number;
  code: string;
  name: string;
}

export interface DashboardMaterial {
  id: number;
  subjectId: number;
  authorId: number;
  academicPeriodId: number;
  title: string;
  description: string | null;
  materialType: string;
  visibility: string;
  currentVersion: number;
  syllabusChangesNote: string | null;
  downloadCount: number;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    firstName: string;
    lastName: string;
  };
  subject: {
    id: number;
    code: string;
    name: string;
  };
  academicPeriod: PeriodSummary;
}

export interface DashboardSummary {
  currentPeriod: PeriodSummary | null;
  counts: {
    activeCareers: number;
    activeSubjects: number;
    visibleMaterials: number;
    myAssignments: number | null;
    myMaterials: number | null;
  };
  recentMaterials: DashboardMaterial[];
}
