export interface ScoreEntity {
  id: number;
  projectId: number;
  judgeId: string;
  hackathonId: string;
  creativity?: number;
  technical?: number;
  implementation?: number;
  clarity?: number;
  growth?: number;
  challenge1?: number;
  challenge2?: number;
  challenge3?: number;
  total?: number;
  submitted?: boolean;
}

export interface ProjectEntity {
  id: number;
  name: string;
  hackathonId: string;
  categories?: string;
}

export interface ScoreCreateEntity extends Omit<ScoreEntity, "id"> {}

export interface ScoreUpdateEntity extends Partial<Omit<ScoreEntity, "id">> {}

export interface ScoreBreakdownJudgeEntity {
  id: string;
  firstName: string;
  lastName: string;
}

export interface ScoreBreakdownEntity extends Omit<ScoreEntity, "judgeId"> {
  judge: ScoreBreakdownJudgeEntity;
}

export interface ProjectBreakdownEntity extends ProjectEntity {
  average: number;
  creativity: number;
  implementation: number;
  clarity: number;
  growth: number;
  technical: number;
  challenge1: number;
  challenge2: number;
  challenge3: number;
  scores: ScoreBreakdownEntity[];
}

export interface JudgingAssignmentEntity {
  users: string[];
  projects: number[];
  projectsPerUser: number;
}
