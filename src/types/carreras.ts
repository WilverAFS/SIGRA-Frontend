// Contrato v1.2, sección 5.4.5 (CareerResource) y 5.5.8 (CareerRequest)

export type Carrera = {
  id: number;
  instituteId: number;
  curriculumCode: string;
  name: string;
  shortName: string;
  totalSemesters: number;
  isActive: boolean;
};

export type CarreraPayload = {
  instituteId: number;
  curriculumCode: string;
  name: string;
  shortName: string;
  totalSemesters: number;
  isActive: boolean;
};

export type FiltrosCarreras = {
  page?: number;
  limit?: number;
  search?: string;
  instituteId?: number;
};