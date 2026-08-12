import api from "../api";

/* =========================================================
   PROJECT ENUMS

   Values backend Project model ke bilkul same hain.
   ========================================================= */

export type ProjectStatus =
  | "draft"
  | "active"
  | "on_hold"
  | "completed"
  | "archived";

export type ProjectScheduleStatus =
  | "not_started"
  | "on_track"
  | "overdue"
  | "completed_early"
  | "completed_on_time"
  | "completed_late"
  | "archived";

export type ProjectPriority =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type OverallRiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical"
  | "high_to_critical";

export type ProjectType =
  | "electrical_audit"
  | "energy_audit"
  | "risk_rectification"
  | "solar_installation"
  | "testing_commissioning"
  | "other";

/* =========================================================
   PROJECT NESTED TYPES
   ========================================================= */

export type ProjectClient = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
};

export type ProjectSite = {
  name?: string;
  location?: string;
  city?: string;
  province?: string;
  country?: string;
};

export type ProjectSettings = {
  /*
    false:
    Risk Register ID field Risk form mein hidden.

    true:
    Risk Register ID field Risk form mein visible.
  */

  riskRegisterIdEnabled: boolean;
};

export type ProjectProgress = {
  overall: number;
  rectification: number;
  evidence: number;
  testing: number;
  actionPlan: number;
};

export type ProjectRiskSummary = {
  totalRiskGroups: number;
  totalEvidence: number;

  extreme: number;
  high: number;
  medium: number;
  low: number;

  open: number;
  inProgress: number;
  awaitingVerification: number;
  closed: number;
};

export type ProjectUserReference = {
  _id?: string;
  id?: string;

  name?: string;
  email?: string;
  phone?: string;

  role?: string;
  avatar?: string;
};

export type ProjectCreatedBy =
  ProjectUserReference;

export type ClientAccess = {
  isEnabled: boolean;

  accessToken?: string;

  expiresAt?: string | null;

  createdAt?: string;
};

export type ClientAccessResponse = {
  clientAccessEnabled: boolean;

  clientAccessToken?: string;

  /*
    projectCode internal compatibility field hai.

    Frontend display ke liye projectReferenceNo use hoga.
  */

  projectCode?: string;
  projectReferenceNo?: string;

  publicUrl?: string;
};

/* =========================================================
   PUBLIC CLIENT TRACKER TYPES

   Public project link se yeh read-only data backend se aata
   hai. Client ko login/JWT ki zarurat nahi hoti.
   ========================================================= */

export type ProjectRiskStatus =
  | "in_progress"
  | "complete";

export type ProjectEvidenceType =
  | "before"
  | "after";

export type ProjectEvidence = {
  _id: string;
  id?: string;

  projectId?: string;
  projectCode?: string;

  riskId?: string;
  riskRegisterId?: string;

  evidenceType: ProjectEvidenceType;

  imagePath: string;

  createdAt?: string;
  updatedAt?: string;
};

export type ProjectRiskEvidence = {
  before: ProjectEvidence[];
  after: ProjectEvidence[];

  beforeCount: number;
  afterCount: number;
  totalCount: number;

  canMarkComplete: boolean;
};

export type ProjectRisk = {
  _id: string;
  id?: string;

  projectId?: string;
  projectCode?: string;

  serialNo?: number;
  riskRegisterId?: string;

  description: string;
  remarksEffect?: string;

  status: ProjectRiskStatus;

  evidence: ProjectRiskEvidence;

  createdAt?: string;
  updatedAt?: string;
};

export type ProjectTrackerSummary = {
  totalRisks: number;
  complete: number;
  inProgress: number;
  totalEvidence: number;

  overallProgress: number;
  evidenceProgress: number;
};

/* =========================================================
   DEFAULT VALUES
   ========================================================= */

export const EMPTY_PROJECT_SETTINGS: ProjectSettings =
  {
    riskRegisterIdEnabled: false,
  };

export const EMPTY_PROJECT_PROGRESS: ProjectProgress =
  {
    overall: 0,
    rectification: 0,
    evidence: 0,
    testing: 0,
    actionPlan: 0,
  };

export const EMPTY_RISK_SUMMARY: ProjectRiskSummary =
  {
    totalRiskGroups: 0,
    totalEvidence: 0,

    extreme: 0,
    high: 0,
    medium: 0,
    low: 0,

    open: 0,
    inProgress: 0,
    awaitingVerification: 0,
    closed: 0,
  };

/*
  Backward compatibility exports.

  Fake / Excel baseline values intentionally remove kar diye
  gaye hain. Client tracker sirf live backend data use karega.
*/

export const EXCEL_BASELINE_RISK_SUMMARY: ProjectRiskSummary =
  {
    ...EMPTY_RISK_SUMMARY,
  };

export const EXCEL_BASELINE_PROJECT_PROGRESS: ProjectProgress =
  {
    ...EMPTY_PROJECT_PROGRESS,
  };

/* =========================================================
   NORMALIZED FRONTEND PROJECT
   ========================================================= */

export type Project = {
  _id: string;
  id?: string;

  /*
    projectReferenceNo frontend display field hai.

    projectCode existing backend compatibility field hai.
  */

  projectReferenceNo?: string;
  projectCode?: string;

  title: string;
  description?: string;

  projectType: ProjectType;

  client: ProjectClient;
  site: ProjectSite;

  systemCapacityKW?: number;

  auditDate?: string;

  startDate?: string;

  expectedCompletionDate?: string;

  actualCompletionDate?: string | null;

  /*
    Existing frontend pages ke liye temporary alias.
  */

  completedAt?: string | null;

  status: ProjectStatus;

  overallRiskLevel: OverallRiskLevel;

  settings: ProjectSettings;

  progressBreakdown: ProjectProgress;

  riskSummary: ProjectRiskSummary;

  /*
    Public client tracker data.

    Protected admin project responses mein arrays empty ho
    sakti hain. Public token response mein actual risks aur
    Before / After evidence yahan normalize honge.
  */

  risks: ProjectRisk[];

  trackerSummary: ProjectTrackerSummary;

  projectLead?:
    | string
    | ProjectUserReference
    | null;

  teamMembers?: Array<
    string | ProjectUserReference
  >;

  clientAccessEnabled: boolean;

  clientAccessToken?: string;

  clientAccessExpiresAt?: string | null;

  lastClientAccessAt?: string | null;

  clientAccess?: ClientAccess;

  notes?: string;

  createdBy?: ProjectCreatedBy;

  updatedBy?:
    | string
    | ProjectUserReference
    | null;

  createdAt?: string;
  updatedAt?: string;

  startedAt?: string | null;
  putOnHoldAt?: string | null;
  resumedAt?: string | null;
  archivedAt?: string | null;

  scheduleStatus: ProjectScheduleStatus;
  isOverdue: boolean;
  daysOverdue: number;

  /* =======================================================
     TEMPORARY FRONTEND COMPATIBILITY PROPERTIES
     ======================================================= */

  priority?: ProjectPriority;

  progress?: number;

  location?: string;
  siteAddress?: string;

  capacity?: number;
  capacityUnit?: string;

  expectedEndDate?: string;

  risksCount?: number;
  openRisksCount?: number;
  criticalRisksCount?: number;

  isArchived?: boolean;
};

/* =========================================================
   API PAYLOAD TYPES
   ========================================================= */

export type CreateProjectPayload = {
  title: string;
  description?: string;

  projectType?: ProjectType;

  client?: ProjectClient;
  site?: ProjectSite;

  systemCapacityKW?: number;

  auditDate?: string;

  startDate?: string;

  expectedCompletionDate?: string;

  status?: ProjectStatus;

  overallRiskLevel?: OverallRiskLevel;

  settings?: Partial<ProjectSettings>;

  progress?:
    | ProjectProgress
    | number;

  riskSummary?: Partial<ProjectRiskSummary>;

  projectLead?: string | null;

  teamMembers?: string[];

  clientAccessEnabled?: boolean;

  clientAccessExpiresAt?:
    | string
    | null;

  notes?: string;

  /* =======================================================
     LEGACY FORM COMPATIBILITY

     Yeh properties purane frontend forms compile rakhne ke
     liye hain.

     projectCode aur projectReferenceNo backend ko nahi
     bheje jayenge.
     ======================================================= */

  projectCode?: string;
  projectReferenceNo?: string;

  location?: string;
  siteAddress?: string;

  priority?: ProjectPriority;

  expectedEndDate?: string;

  capacity?: number;
  capacityUnit?: string;
};

export type UpdateProjectPayload =
  Omit<
    Partial<CreateProjectPayload>,
    "status"
  >;

export type ProjectQueryParams = {
  page?: number;
  limit?: number;

  search?: string;

  status?:
    | ProjectStatus
    | "";

  overallRiskLevel?:
    | OverallRiskLevel
    | "";

  projectType?:
    | ProjectType
    | "";

  city?: string;

  sortBy?: string;

  sortOrder?:
    | "asc"
    | "desc";

  /*
    Legacy frontend filter.

    Backend archive state status="archived" se manage hoti hai.
  */

  archived?: boolean;

  priority?:
    | ProjectPriority
    | "";
};

export type ProjectListResponse = {
  projects: Project[];

  total: number;

  page: number;

  limit: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
};


/* =========================================================
   PROJECT DASHBOARD STATS

   Dashboard top cards ke liye project-level live counts.
   Backend list endpoint ki pagination totals use hongi.
   ========================================================= */

export type ProjectDashboardStats = {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;

  draftProjects: number;
  onHoldProjects: number;
  archivedProjects: number;
};

/* =========================================================
   INTERNAL API TYPES
   ========================================================= */

type ApiObject =
  Record<string, unknown>;

type ApiPagination = {
  total?: number;
  totalItems?: number;
  totalDocs?: number;
  totalProjects?: number;

  page?: number;
  currentPage?: number;

  limit?: number;
  pageSize?: number;

  totalPages?: number;
  pages?: number;

  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
};

/* =========================================================
   TYPE GUARDS
   ========================================================= */

const isObject = (
  value: unknown
): value is ApiObject => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
};

const isString = (
  value: unknown
): value is string => {
  return (
    typeof value === "string"
  );
};

const getNumber = (
  value: unknown,
  fallback = 0
): number => {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim() !== ""
  ) {
    const parsedValue =
      Number(value);

    if (
      Number.isFinite(
        parsedValue
      )
    ) {
      return parsedValue;
    }
  }

  return fallback;
};

const clampPercentage = (
  value: unknown
): number => {
  return Math.min(
    Math.max(
      Math.round(
        getNumber(
          value,
          0
        )
      ),
      0
    ),
    100
  );
};

/* =========================================================
   NORMALIZERS
   ========================================================= */

const normalizeProgress = (
  value: unknown
): ProjectProgress => {
  if (
    typeof value ===
    "number"
  ) {
    const overall =
      clampPercentage(
        value
      );

    return {
      overall,
      rectification:
        overall,
      evidence:
        overall,
      testing:
        overall,
      actionPlan:
        overall,
    };
  }

  if (!isObject(value)) {
    return {
      ...EMPTY_PROJECT_PROGRESS,
    };
  }

  return {
    overall:
      clampPercentage(
        value.overall
      ),

    rectification:
      clampPercentage(
        value.rectification
      ),

    evidence:
      clampPercentage(
        value.evidence
      ),

    testing:
      clampPercentage(
        value.testing
      ),

    actionPlan:
      clampPercentage(
        value.actionPlan
      ),
  };
};

const normalizeRiskSummary = (
  value: unknown
): ProjectRiskSummary => {
  if (!isObject(value)) {
    return {
      ...EMPTY_RISK_SUMMARY,
    };
  }

  return {
    totalRiskGroups:
      getNumber(
        value.totalRiskGroups
      ),

    totalEvidence:
      getNumber(
        value.totalEvidence
      ),

    extreme:
      getNumber(
        value.extreme
      ),

    high:
      getNumber(
        value.high
      ),

    medium:
      getNumber(
        value.medium
      ),

    low:
      getNumber(
        value.low
      ),

    open:
      getNumber(
        value.open
      ),

    inProgress:
      getNumber(
        value.inProgress
      ),

    awaitingVerification:
      getNumber(
        value.awaitingVerification
      ),

    closed:
      getNumber(
        value.closed
      ),
  };
};

const normalizeSettings = (
  value: unknown
): ProjectSettings => {
  if (!isObject(value)) {
    return {
      ...EMPTY_PROJECT_SETTINGS,
    };
  }

  return {
    riskRegisterIdEnabled:
      value
        .riskRegisterIdEnabled ===
      true,
  };
};

const normalizeClient = (
  value: unknown
): ProjectClient => {
  if (!isObject(value)) {
    return {};
  }

  return {
    ...(isString(
      value.name
    )
      ? {
          name:
            value.name,
        }
      : {}),

    ...(isString(
      value.company
    )
      ? {
          company:
            value.company,
        }
      : {}),

    ...(isString(
      value.email
    )
      ? {
          email:
            value.email,
        }
      : {}),

    ...(isString(
      value.phone
    )
      ? {
          phone:
            value.phone,
        }
      : {}),
  };
};

const normalizeSite = (
  value: unknown
): ProjectSite => {
  if (!isObject(value)) {
    return {};
  }

  return {
    ...(isString(
      value.name
    )
      ? {
          name:
            value.name,
        }
      : {}),

    ...(isString(
      value.location
    )
      ? {
          location:
            value.location,
        }
      : {}),

    ...(isString(
      value.city
    )
      ? {
          city:
            value.city,
        }
      : {}),

    ...(isString(
      value.province
    )
      ? {
          province:
            value.province,
        }
      : {}),

    ...(isString(
      value.country
    )
      ? {
          country:
            value.country,
        }
      : {}),
  };
};

const normalizeUserReference = (
  value: unknown
):
  | ProjectUserReference
  | undefined => {
  if (!isObject(value)) {
    return undefined;
  }

  return {
    ...(isString(
      value._id
    )
      ? {
          _id:
            value._id,
        }
      : {}),

    ...(isString(
      value.id
    )
      ? {
          id:
            value.id,
        }
      : {}),

    ...(isString(
      value.name
    )
      ? {
          name:
            value.name,
        }
      : {}),

    ...(isString(
      value.email
    )
      ? {
          email:
            value.email,
        }
      : {}),

    ...(isString(
      value.phone
    )
      ? {
          phone:
            value.phone,
        }
      : {}),

    ...(isString(
      value.role
    )
      ? {
          role:
            value.role,
        }
      : {}),

    ...(isString(
      value.avatar
    )
      ? {
          avatar:
            value.avatar,
        }
      : {}),
  };
};

const normalizeUserOrId = (
  value: unknown
):
  | string
  | ProjectUserReference
  | null => {
  if (isString(value)) {
    return value;
  }

  const normalizedUser =
    normalizeUserReference(
      value
    );

  return (
    normalizedUser ??
    null
  );
};

const normalizeTeamMembers = (
  value: unknown
): Array<
  string | ProjectUserReference
> => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(
      (member) =>
        normalizeUserOrId(
          member
        )
    )
    .filter(
      (
        member
      ): member is
        | string
        | ProjectUserReference =>
        member !== null
    );
};


const normalizeProjectRiskStatus = (
  value: unknown
): ProjectRiskStatus => {
  switch (value) {
    case "complete":
    case "completed":
    case "closed":
      return "complete";

    case "in_progress":
    case "open":
    default:
      return "in_progress";
  }
};

const normalizeProjectEvidenceType = (
  value: unknown
): ProjectEvidenceType => {
  return value === "after"
    ? "after"
    : "before";
};

const normalizeProjectEvidence = (
  value: unknown,
  fallbackType: ProjectEvidenceType
): ProjectEvidence | null => {
  if (!isObject(value)) {
    return null;
  }

  const id =
    (
      isString(value._id) &&
      value._id
    ) ||
    (
      isString(value.id) &&
      value.id
    ) ||
    "";

  const imagePath =
    isString(value.imagePath)
      ? value.imagePath.trim()
      : "";

  if (!imagePath) {
    return null;
  }

  return {
    _id: id || imagePath,

    ...(isString(value.id)
      ? {
          id: value.id,
        }
      : {}),

    ...(isString(value.projectId)
      ? {
          projectId:
            value.projectId,
        }
      : {}),

    ...(isString(value.projectCode)
      ? {
          projectCode:
            value.projectCode,
        }
      : {}),

    ...(isString(value.riskId)
      ? {
          riskId:
            value.riskId,
        }
      : {}),

    ...(isString(value.riskRegisterId)
      ? {
          riskRegisterId:
            value.riskRegisterId,
        }
      : {}),

    evidenceType:
      value.evidenceType !==
      undefined
        ? normalizeProjectEvidenceType(
            value.evidenceType
          )
        : fallbackType,

    imagePath,

    ...(isString(value.createdAt)
      ? {
          createdAt:
            value.createdAt,
        }
      : {}),

    ...(isString(value.updatedAt)
      ? {
          updatedAt:
            value.updatedAt,
        }
      : {}),
  };
};

const normalizeProjectEvidenceList = (
  value: unknown,
  evidenceType: ProjectEvidenceType
): ProjectEvidence[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) =>
      normalizeProjectEvidence(
        item,
        evidenceType
      )
    )
    .filter(
      (
        item
      ): item is ProjectEvidence =>
        item !== null
    );
};

const normalizeProjectRiskEvidence = (
  value: unknown
): ProjectRiskEvidence => {
  if (!isObject(value)) {
    return {
      before: [],
      after: [],
      beforeCount: 0,
      afterCount: 0,
      totalCount: 0,
      canMarkComplete: false,
    };
  }

  const before =
    normalizeProjectEvidenceList(
      value.before,
      "before"
    );

  const after =
    normalizeProjectEvidenceList(
      value.after,
      "after"
    );

  const beforeCount =
    Math.max(
      before.length,
      getNumber(
        value.beforeCount
      )
    );

  const afterCount =
    Math.max(
      after.length,
      getNumber(
        value.afterCount
      )
    );

  const totalCount =
    Math.max(
      beforeCount +
        afterCount,
      getNumber(
        value.totalCount
      )
    );

  return {
    before,
    after,

    beforeCount,
    afterCount,
    totalCount,

    canMarkComplete:
      typeof value
        .canMarkComplete ===
      "boolean"
        ? value
            .canMarkComplete
        : beforeCount > 0 &&
          afterCount > 0,
  };
};

const normalizeProjectRisk = (
  value: unknown
): ProjectRisk | null => {
  if (!isObject(value)) {
    return null;
  }

  const id =
    (
      isString(value._id) &&
      value._id
    ) ||
    (
      isString(value.id) &&
      value.id
    ) ||
    "";

  if (!id) {
    return null;
  }

  const evidence =
    normalizeProjectRiskEvidence(
      value.evidence
    );

  return {
    _id: id,

    ...(isString(value.id)
      ? {
          id: value.id,
        }
      : {}),

    ...(isString(value.projectId)
      ? {
          projectId:
            value.projectId,
        }
      : {}),

    ...(isString(value.projectCode)
      ? {
          projectCode:
            value.projectCode,
        }
      : {}),

    ...(value.serialNo !==
    undefined
      ? {
          serialNo:
            getNumber(
              value.serialNo
            ),
        }
      : {}),

    ...(isString(value.riskRegisterId)
      ? {
          riskRegisterId:
            value.riskRegisterId,
        }
      : {}),

    description:
      isString(value.description)
        ? value.description
        : "Risk record",

    ...(isString(value.remarksEffect)
      ? {
          remarksEffect:
            value.remarksEffect,
        }
      : {}),

    status:
      normalizeProjectRiskStatus(
        value.status
      ),

    evidence,

    ...(isString(value.createdAt)
      ? {
          createdAt:
            value.createdAt,
        }
      : {}),

    ...(isString(value.updatedAt)
      ? {
          updatedAt:
            value.updatedAt,
        }
      : {}),
  };
};

const normalizeProjectRisks = (
  value: unknown
): ProjectRisk[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(
      normalizeProjectRisk
    )
    .filter(
      (
        risk
      ): risk is ProjectRisk =>
        risk !== null
    );
};

const buildTrackerSummaryFromRisks = (
  risks: ProjectRisk[]
): ProjectTrackerSummary => {
  const totalRisks =
    risks.length;

  const complete =
    risks.filter(
      (risk) =>
        risk.status ===
        "complete"
    ).length;

  const inProgress =
    risks.filter(
      (risk) =>
        risk.status ===
        "in_progress"
    ).length;

  const totalEvidence =
    risks.reduce(
      (
        total,
        risk
      ) =>
        total +
        risk.evidence
          .totalCount,
      0
    );

  const evidenceComplete =
    risks.filter(
      (risk) =>
        risk.evidence
          .beforeCount > 0 &&
        risk.evidence
          .afterCount > 0
    ).length;

  const overallProgress =
    totalRisks > 0
      ? Math.round(
          (
            complete /
            totalRisks
          ) * 100
        )
      : 0;

  const evidenceProgress =
    totalRisks > 0
      ? Math.round(
          (
            evidenceComplete /
            totalRisks
          ) * 100
        )
      : 0;

  return {
    totalRisks,
    complete,
    inProgress,
    totalEvidence,
    overallProgress,
    evidenceProgress,
  };
};

const normalizeTrackerSummary = (
  value: unknown,
  risks: ProjectRisk[],
  storedRiskSummary: ProjectRiskSummary,
  storedProgress: ProjectProgress
): ProjectTrackerSummary => {
  const derived =
    buildTrackerSummaryFromRisks(
      risks
    );

  /*
    Public client endpoint risks array return na kare to
    backend ke synchronized riskSummary/progress ko fallback
    source of truth use karein.

    Is se public tracker par Risk Groups / Evidence / Progress
    zero nahi dikhenge jab project summary backend mein
    correctly synchronized ho.
  */

  const fallback: ProjectTrackerSummary = {
    totalRisks:
      storedRiskSummary
        .totalRiskGroups,

    complete:
      storedRiskSummary.closed,

    inProgress:
      storedRiskSummary
        .inProgress,

    totalEvidence:
      storedRiskSummary
        .totalEvidence,

    overallProgress:
      storedProgress.overall,

    evidenceProgress:
      storedProgress.evidence,
  };

  if (!isObject(value)) {
    return risks.length > 0
      ? derived
      : fallback;
  }

  return {
    totalRisks:
      risks.length > 0
        ? derived.totalRisks
        : getNumber(
            value.totalRisks,
            fallback.totalRisks
          ),

    complete:
      risks.length > 0
        ? derived.complete
        : getNumber(
            value.complete,
            fallback.complete
          ),

    inProgress:
      risks.length > 0
        ? derived.inProgress
        : getNumber(
            value.inProgress,
            fallback.inProgress
          ),

    totalEvidence:
      risks.length > 0
        ? derived.totalEvidence
        : getNumber(
            value.totalEvidence,
            fallback.totalEvidence
          ),

    overallProgress:
      risks.length > 0
        ? derived.overallProgress
        : clampPercentage(
            value.overallProgress ??
            fallback.overallProgress
          ),

    evidenceProgress:
      risks.length > 0
        ? derived.evidenceProgress
        : clampPercentage(
            value.evidenceProgress ??
            fallback.evidenceProgress
          ),
  };
};

const mergeLiveRiskSummary = (
  storedSummary: ProjectRiskSummary,
  trackerSummary: ProjectTrackerSummary,
  risks: ProjectRisk[]
): ProjectRiskSummary => {
  const hasLiveTrackerData =
    risks.length > 0 ||
    trackerSummary.totalRisks > 0;

  if (!hasLiveTrackerData) {
    return storedSummary;
  }

  return {
    ...storedSummary,

    totalRiskGroups:
      trackerSummary.totalRisks,

    totalEvidence:
      trackerSummary.totalEvidence,

    open: 0,

    inProgress:
      trackerSummary.inProgress,

    awaitingVerification:
      0,

    closed:
      trackerSummary.complete,
  };
};

const mergeLiveProgress = (
  storedProgress: ProjectProgress,
  trackerSummary: ProjectTrackerSummary,
  risks: ProjectRisk[]
): ProjectProgress => {
  const hasLiveTrackerData =
    risks.length > 0 ||
    trackerSummary.totalRisks > 0;

  if (!hasLiveTrackerData) {
    return storedProgress;
  }

  return {
    overall:
      trackerSummary
        .overallProgress,

    rectification:
      trackerSummary
        .overallProgress,

    evidence:
      trackerSummary
        .evidenceProgress,

    testing:
      storedProgress.testing,

    actionPlan:
      storedProgress
        .actionPlan,
  };
};

/* =========================================================
   COMPATIBILITY MAPPERS
   ========================================================= */

const mapRiskLevelToPriority = (
  riskLevel: OverallRiskLevel
): ProjectPriority => {
  switch (riskLevel) {
    case "critical":
    case "high_to_critical":
      return "critical";

    case "high":
      return "high";

    case "medium":
      return "medium";

    case "low":
    default:
      return "low";
  }
};

const mapPriorityToRiskLevel = (
  priority: ProjectPriority
): OverallRiskLevel => {
  switch (priority) {
    case "critical":
      return "critical";

    case "high":
      return "high";

    case "medium":
      return "medium";

    case "low":
    default:
      return "low";
  }
};

const normalizeOverallRiskLevel = (
  value: unknown
): OverallRiskLevel => {
  switch (value) {
    case "low":
    case "medium":
    case "high":
    case "critical":
    case "high_to_critical":
      return value;

    default:
      return "high_to_critical";
  }
};

const normalizeStatus = (
  value: unknown
): ProjectStatus => {
  switch (value) {
    case "draft":
    case "active":
    case "on_hold":
    case "completed":
    case "archived":
      return value;

    /*
      Purane frontend ke planning status ko draft samjhenge.
    */

    case "planning":
      return "draft";

    default:
      return "draft";
  }
};

const normalizeScheduleStatus = (
  value: unknown,
  status: ProjectStatus,
  isOverdue: boolean
): ProjectScheduleStatus => {
  switch (value) {
    case "not_started":
    case "on_track":
    case "overdue":
    case "completed_early":
    case "completed_on_time":
    case "completed_late":
    case "archived":
      return value;

    default:
      if (status === "archived") {
        return "archived";
      }

      if (status === "completed") {
        return "completed_on_time";
      }

      return isOverdue
        ? "overdue"
        : "on_track";
  }
};

const normalizeProjectType = (
  value: unknown
): ProjectType => {
  switch (value) {
    case "electrical_audit":
    case "energy_audit":
    case "risk_rectification":
    case "solar_installation":
    case "testing_commissioning":
    case "other":
      return value;

    /*
      Purane frontend values ki compatibility.
    */

    case "solar_pv":
      return "solar_installation";

    case "maintenance":
      return "other";

    default:
      return "risk_rectification";
  }
};

/* =========================================================
   PROJECT NORMALIZER
   ========================================================= */

const normalizeProject = (
  value: unknown,
  responseClientAccessToken?: string,
  responseProjectReferenceNo?: string
): Project => {
  if (!isObject(value)) {
    throw new Error(
      "Invalid project response received from server."
    );
  }

  const id =
    (
      isString(value._id) &&
      value._id
    ) ||
    (
      isString(value.id) &&
      value.id
    ) ||
    "";

  const title =
    isString(value.title) &&
    value.title.trim()
      ? value.title
      : "Untitled Project";

  const projectCode =
    isString(
      value.projectCode
    )
      ? value.projectCode
      : undefined;

  const projectReferenceNo =
    (
      isString(
        value.projectReferenceNo
      ) &&
      value.projectReferenceNo
    ) ||
    responseProjectReferenceNo ||
    projectCode;

  const client =
    normalizeClient(
      value.client
    );

  const site =
    normalizeSite(
      value.site
    );

  const status =
    normalizeStatus(
      value.status
    );

  const overallRiskLevel =
    normalizeOverallRiskLevel(
      value.overallRiskLevel
    );

  const settings =
    normalizeSettings(
      value.settings
    );

  const risks =
    normalizeProjectRisks(
      value.risks
    );

  const storedProgress =
    normalizeProgress(
      value.progressBreakdown ??
      value.progress
    );

  const storedRiskSummary =
    normalizeRiskSummary(
      value.riskSummary
    );

  const trackerSummary =
    normalizeTrackerSummary(
      value.trackerSummary,
      risks,
      storedRiskSummary,
      storedProgress
    );

  const progressBreakdown =
    mergeLiveProgress(
      storedProgress,
      trackerSummary,
      risks
    );

  const riskSummary =
    mergeLiveRiskSummary(
      storedRiskSummary,
      trackerSummary,
      risks
    );

  const systemCapacityKW =
    value.systemCapacityKW !==
    undefined
      ? getNumber(
          value.systemCapacityKW
        )
      : undefined;

  const clientAccessToken =
    responseClientAccessToken ||
    (
      isString(
        value.clientAccessToken
      )
        ? value.clientAccessToken
        : undefined
    );

  const clientAccessEnabled =
    typeof value
      .clientAccessEnabled ===
    "boolean"
      ? value
          .clientAccessEnabled
      : Boolean(
          clientAccessToken
        );

  const siteLocation =
    site.location ||
    site.city ||
    site.name ||
    "";

  const expectedCompletionDate =
    isString(
      value.expectedCompletionDate
    )
      ? value
          .expectedCompletionDate
      : undefined;

  const actualCompletionDate =
    isString(
      value.actualCompletionDate
    )
      ? value
          .actualCompletionDate
      : isString(
            value.completedAt
          )
        ? value.completedAt
        : null;

  const projectLead =
    normalizeUserOrId(
      value.projectLead
    );

  const teamMembers =
    normalizeTeamMembers(
      value.teamMembers
    );

  const createdBy =
    normalizeUserReference(
      value.createdBy
    );

  const updatedBy =
    normalizeUserOrId(
      value.updatedBy
    );

  const isOverdue =
    value.isOverdue === true;

  const scheduleStatus =
    normalizeScheduleStatus(
      value.scheduleStatus,
      status,
      isOverdue
    );

  const daysOverdue =
    Math.max(
      0,
      getNumber(
        value.daysOverdue
      )
    );

  return {
    _id: id,

    ...(isString(
      value.id
    )
      ? {
          id:
            value.id,
        }
      : {}),

    ...(projectCode
      ? {
          projectCode,
        }
      : {}),

    ...(projectReferenceNo
      ? {
          projectReferenceNo,
        }
      : {}),

    title,

    ...(isString(
      value.description
    )
      ? {
          description:
            value.description,
        }
      : {}),

    projectType:
      normalizeProjectType(
        value.projectType
      ),

    client,
    site,

    ...(systemCapacityKW !==
    undefined
      ? {
          systemCapacityKW,
        }
      : {}),

    ...(isString(
      value.auditDate
    )
      ? {
          auditDate:
            value.auditDate,
        }
      : {}),

    ...(isString(
      value.startDate
    )
      ? {
          startDate:
            value.startDate,
        }
      : {}),

    ...(expectedCompletionDate
      ? {
          expectedCompletionDate,
        }
      : {}),

    actualCompletionDate,

    completedAt:
      actualCompletionDate,

    status,
    overallRiskLevel,

    settings,

    progressBreakdown,

    riskSummary,

    risks,

    trackerSummary,

    projectLead,

    teamMembers,

    clientAccessEnabled,

    ...(clientAccessToken
      ? {
          clientAccessToken,
        }
      : {}),

    ...(isString(
      value.clientAccessExpiresAt
    )
      ? {
          clientAccessExpiresAt:
            value
              .clientAccessExpiresAt,
        }
      : {}),

    ...(isString(
      value.lastClientAccessAt
    )
      ? {
          lastClientAccessAt:
            value
              .lastClientAccessAt,
        }
      : {}),

    clientAccess: {
      isEnabled:
        clientAccessEnabled,

      ...(clientAccessToken
        ? {
            accessToken:
              clientAccessToken,
          }
        : {}),

      ...(isString(
        value.clientAccessExpiresAt
      )
        ? {
            expiresAt:
              value
                .clientAccessExpiresAt,
          }
        : {}),
    },

    ...(isString(
      value.notes
    )
      ? {
          notes:
            value.notes,
        }
      : {}),

    createdBy,
    updatedBy,

    ...(isString(
      value.createdAt
    )
      ? {
          createdAt:
            value.createdAt,
        }
      : {}),

    ...(isString(
      value.updatedAt
    )
      ? {
          updatedAt:
            value.updatedAt,
        }
      : {}),

    startedAt:
      isString(value.startedAt)
        ? value.startedAt
        : null,

    putOnHoldAt:
      isString(value.putOnHoldAt)
        ? value.putOnHoldAt
        : null,

    resumedAt:
      isString(value.resumedAt)
        ? value.resumedAt
        : null,

    archivedAt:
      isString(value.archivedAt)
        ? value.archivedAt
        : null,

    scheduleStatus,
    isOverdue,
    daysOverdue,

    /* =====================================================
       COMPATIBILITY ALIASES
       ===================================================== */

    priority:
      mapRiskLevelToPriority(
        overallRiskLevel
      ),

    progress:
      progressBreakdown
        .overall,

    location:
      site.city ||
      site.location ||
      site.name ||
      "",

    siteAddress:
      siteLocation,

    capacity:
      systemCapacityKW,

    capacityUnit:
      "kW",

    expectedEndDate:
      expectedCompletionDate,

    risksCount:
      riskSummary
        .totalRiskGroups,

    openRisksCount:
      riskSummary.open +
      riskSummary.inProgress,

    criticalRisksCount:
      riskSummary.extreme,

    isArchived:
      status ===
        "archived" ||
      value.isArchived ===
        true,
  };
};

/* =========================================================
   RESPONSE EXTRACTORS
   ========================================================= */

const getResponseData = (
  responseBody: unknown
): unknown => {
  if (
    isObject(responseBody) &&
    "data" in responseBody
  ) {
    return responseBody.data;
  }

  return responseBody;
};

const extractProjectResponse = (
  responseBody: unknown
): Project => {
  const responseData =
    getResponseData(
      responseBody
    );

  let rawProject:
    unknown = responseData;

  let clientAccessToken:
    | string
    | undefined;

  let projectReferenceNo:
    | string
    | undefined;

  if (
    isObject(
      responseData
    )
  ) {
    if (
      isObject(
        responseData.project
      )
    ) {
      rawProject = {
        ...responseData.project,

        ...(
          Array.isArray(
            responseData.risks
          )
            ? {
                risks:
                  responseData.risks,
              }
            : {}
        ),

        ...(
          isObject(
            responseData
              .trackerSummary
          )
            ? {
                trackerSummary:
                  responseData
                    .trackerSummary,
              }
            : {}
        ),

        ...(
          isObject(
            responseData
              .riskSummary
          )
            ? {
                riskSummary:
                  responseData
                    .riskSummary,
              }
            : {}
        ),

        ...(
          responseData
            .progress !==
          undefined
            ? {
                progress:
                  responseData
                    .progress,
              }
            : {}
        ),
      };
    }

    if (
      isString(
        responseData
          .clientAccessToken
      )
    ) {
      clientAccessToken =
        responseData
          .clientAccessToken;
    }

    if (
      isString(
        responseData
          .projectReferenceNo
      )
    ) {
      projectReferenceNo =
        responseData
          .projectReferenceNo;
    }
  }

  if (
    !clientAccessToken &&
    isObject(responseBody) &&
    isString(
      responseBody
        .clientAccessToken
    )
  ) {
    clientAccessToken =
      responseBody
        .clientAccessToken;
  }

  if (
    !projectReferenceNo &&
    isObject(responseBody) &&
    isString(
      responseBody
        .projectReferenceNo
    )
  ) {
    projectReferenceNo =
      responseBody
        .projectReferenceNo;
  }

  return normalizeProject(
    rawProject,
    clientAccessToken,
    projectReferenceNo
  );
};

const extractProjectListResponse = (
  responseBody: unknown,
  fallbackPage: number,
  fallbackLimit: number
): ProjectListResponse => {
  if (!isObject(responseBody)) {
    return {
      projects: [],
      total: 0,
      page: fallbackPage,
      limit: fallbackLimit,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  const responseData =
    responseBody.data;

  let rawProjects:
    unknown[] = [];

  if (
    Array.isArray(
      responseData
    )
  ) {
    rawProjects =
      responseData;
  } else if (
    isObject(
      responseData
    ) &&
    Array.isArray(
      responseData.projects
    )
  ) {
    rawProjects =
      responseData.projects;
  } else if (
    Array.isArray(
      responseBody.projects
    )
  ) {
    rawProjects =
      responseBody.projects;
  }

  const rawPagination =
    isObject(
      responseBody.pagination
    )
      ? responseBody
          .pagination
      : isObject(
            responseData
          ) &&
          isObject(
            responseData.pagination
          )
        ? responseData
            .pagination
        : {};

  const pagination =
    rawPagination as ApiPagination;

  const projects =
    rawProjects.map(
      (project) =>
        normalizeProject(
          project
        )
    );

  const total =
    getNumber(
      pagination.total ??
        pagination.totalItems ??
        pagination.totalDocs ??
        pagination.totalProjects,
      projects.length
    );

  const page =
    getNumber(
      pagination.page ??
        pagination.currentPage,
      fallbackPage
    );

  const limit =
    getNumber(
      pagination.limit ??
        pagination.pageSize,
      fallbackLimit
    );

  const calculatedTotalPages =
    total > 0 &&
    limit > 0
      ? Math.ceil(
          total / limit
        )
      : 0;

  const totalPages =
    getNumber(
      pagination.totalPages ??
        pagination.pages,
      calculatedTotalPages
    );

  const hasNextPage =
    typeof pagination
      .hasNextPage ===
    "boolean"
      ? pagination
          .hasNextPage
      : page <
        totalPages;

  const hasPreviousPage =
    typeof pagination
      .hasPreviousPage ===
    "boolean"
      ? pagination
          .hasPreviousPage
      : page > 1;

  return {
    projects,
    total,
    page,
    limit,
    totalPages,
    hasNextPage,
    hasPreviousPage,
  };
};

/* =========================================================
   PAYLOAD HELPERS
   ========================================================= */

const removeUndefinedValues = (
  value: Record<
    string,
    unknown
  >
): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(
      value
    ).filter(
      ([, itemValue]) =>
        itemValue !==
        undefined
    )
  );
};

const createSitePayload = (
  payload:
    CreateProjectPayload
): ProjectSite => {
  if (payload.site) {
    return removeUndefinedValues(
      {
        name:
          payload.site.name,

        location:
          payload.site
            .location,

        city:
          payload.site.city,

        province:
          payload.site
            .province,

        country:
          payload.site
            .country ||
          "Pakistan",
      }
    ) as ProjectSite;
  }

  return removeUndefinedValues(
    {
      name:
        payload.location ||
        "Main Project Site",

      location:
        payload.siteAddress ||
        payload.location,

      city:
        payload.location,

      province: "",

      country:
        "Pakistan",
    }
  ) as ProjectSite;
};

const createProgressPayload = (
  progress:
    | ProjectProgress
    | number
): ProjectProgress => {
  return normalizeProgress(
    progress
  );
};

const createRiskSummaryPayload = (
  riskSummary:
    Partial<ProjectRiskSummary>
): ProjectRiskSummary => {
  return {
    ...EMPTY_RISK_SUMMARY,
    ...riskSummary,
  };
};

const createSettingsPayload = (
  settings:
    Partial<ProjectSettings>
): ProjectSettings => {
  return {
    riskRegisterIdEnabled:
      settings
        .riskRegisterIdEnabled ===
      true,
  };
};

/* =========================================================
   CREATE PAYLOAD

   projectCode aur projectReferenceNo intentionally backend
   ko nahi bheje ja rahe.

   Project model reference number automatically generate
   karega.
   ========================================================= */

const prepareCreatePayload = (
  payload:
    CreateProjectPayload
): Record<string, unknown> => {
  const selectedRiskLevel =
    payload.overallRiskLevel ??
    (
      payload.priority
        ? mapPriorityToRiskLevel(
            payload.priority
          )
        : undefined
    );

  return removeUndefinedValues({
    title:
      payload.title.trim(),

    description:
      payload.description
        ?.trim() ||
      undefined,

    projectType:
      payload.projectType ||
      "risk_rectification",

    client:
      payload.client,

    site:
      createSitePayload(
        payload
      ),

    systemCapacityKW:
      payload
        .systemCapacityKW ??
      payload.capacity,

    auditDate:
      payload.auditDate,

    startDate:
      payload.startDate,

    expectedCompletionDate:
      payload
        .expectedCompletionDate ??
      payload.expectedEndDate,

    status:
      payload.status ||
      "draft",

    /*
      Undefined hone par backend default high_to_critical
      apply karega.
    */

    overallRiskLevel:
      selectedRiskLevel,

    settings:
      payload.settings
        ? createSettingsPayload(
            payload.settings
          )
        : undefined,

    progress:
      payload.progress !==
      undefined
        ? createProgressPayload(
            payload.progress
          )
        : undefined,

    riskSummary:
      payload.riskSummary !==
      undefined
        ? createRiskSummaryPayload(
            payload.riskSummary
          )
        : undefined,

    projectLead:
      payload.projectLead,

    teamMembers:
      payload.teamMembers,

    clientAccessEnabled:
      payload
        .clientAccessEnabled,

    clientAccessExpiresAt:
      payload
        .clientAccessExpiresAt,

    notes:
      payload.notes
        ?.trim() ||
      undefined,
  });
};

/* =========================================================
   UPDATE PAYLOAD

   projectCode aur projectReferenceNo updates ignore hongi.
   ========================================================= */

const prepareUpdatePayload = (
  payload:
    UpdateProjectPayload
): Record<string, unknown> => {
  const updatePayload:
    Record<string, unknown> =
    {};

  if (
    payload.title !==
    undefined
  ) {
    updatePayload.title =
      payload.title.trim();
  }

  if (
    payload.description !==
    undefined
  ) {
    updatePayload.description =
      payload.description
        .trim();
  }

  if (
    payload.projectType !==
    undefined
  ) {
    updatePayload.projectType =
      payload.projectType;
  }

  if (
    payload.client !==
    undefined
  ) {
    updatePayload.client =
      payload.client;
  }

  if (
    payload.site !==
      undefined ||
    payload.location !==
      undefined ||
    payload.siteAddress !==
      undefined
  ) {
    updatePayload.site =
      createSitePayload({
        ...payload,

        title:
          payload.title ||
          "",
      });
  }

  if (
    payload.systemCapacityKW !==
      undefined ||
    payload.capacity !==
      undefined
  ) {
    updatePayload
      .systemCapacityKW =
      payload
        .systemCapacityKW ??
      payload.capacity;
  }

  if (
    payload.auditDate !==
    undefined
  ) {
    updatePayload.auditDate =
      payload.auditDate;
  }

  if (
    payload.startDate !==
    undefined
  ) {
    updatePayload.startDate =
      payload.startDate;
  }

  if (
    payload
      .expectedCompletionDate !==
      undefined ||
    payload.expectedEndDate !==
      undefined
  ) {
    updatePayload
      .expectedCompletionDate =
      payload
        .expectedCompletionDate ??
      payload.expectedEndDate;
  }

  if (
    payload.overallRiskLevel !==
    undefined
  ) {
    updatePayload
      .overallRiskLevel =
      payload
        .overallRiskLevel;
  } else if (
    payload.priority !==
    undefined
  ) {
    updatePayload
      .overallRiskLevel =
      mapPriorityToRiskLevel(
        payload.priority
      );
  }

  if (
    payload.settings !==
    undefined
  ) {
    updatePayload.settings =
      createSettingsPayload(
        payload.settings
      );
  }

  if (
    payload.progress !==
    undefined
  ) {
    updatePayload.progress =
      createProgressPayload(
        payload.progress
      );
  }

  if (
    payload.riskSummary !==
    undefined
  ) {
    updatePayload.riskSummary =
      payload.riskSummary;
  }

  if (
    payload.projectLead !==
    undefined
  ) {
    updatePayload.projectLead =
      payload.projectLead;
  }

  if (
    payload.teamMembers !==
    undefined
  ) {
    updatePayload.teamMembers =
      payload.teamMembers;
  }

  if (
    payload.clientAccessEnabled !==
    undefined
  ) {
    updatePayload
      .clientAccessEnabled =
      payload
        .clientAccessEnabled;
  }

  if (
    payload
      .clientAccessExpiresAt !==
    undefined
  ) {
    updatePayload
      .clientAccessExpiresAt =
      payload
        .clientAccessExpiresAt;
  }

  if (
    payload.notes !==
    undefined
  ) {
    updatePayload.notes =
      payload.notes.trim();
  }

  return removeUndefinedValues(
    updatePayload
  );
};

/* =========================================================
   PROJECT API METHODS
   ========================================================= */

export const getProjects =
  async (
    params:
      ProjectQueryParams = {}
  ): Promise<ProjectListResponse> => {
    const {
      priority,
      overallRiskLevel,
      archived: _archived,
      ...remainingParams
    } = params;

    const requestParams = {
      ...remainingParams,

      ...(overallRiskLevel
        ? {
            overallRiskLevel,
          }
        : priority
          ? {
              overallRiskLevel:
                mapPriorityToRiskLevel(
                  priority
                ),
            }
          : {}),
    };

    const response =
      await api.get(
        "/projects",
        {
          params:
            requestParams,
        }
      );

    return extractProjectListResponse(
      response.data,
      params.page ?? 1,
      params.limit ?? 10
    );
  };

export const getActiveProjects =
  async (): Promise<
    Project[]
  > => {
    const result =
      await getProjects({
        page: 1,
        limit: 100,

        status:
          "active",

        sortBy:
          "title",

        sortOrder:
          "asc",
      });

    return result.projects;
  };


/* =========================================================
   GET PROJECT DASHBOARD STATS

   Existing GET /projects endpoint use karta hai.
   Har request sirf 1 record mangti hai; actual count
   pagination.totalProjects se milta hai.

   Isliye dashboard ko tamam projects download karne ki
   zarurat nahi.
   ========================================================= */

export const getProjectDashboardStats =
  async (): Promise<
    ProjectDashboardStats
  > => {
    const [
      all,
      active,
      completed,
      draft,
      onHold,
      archived,
    ] =
      await Promise.all([
        getProjects({
          page: 1,
          limit: 1,
        }),

        getProjects({
          page: 1,
          limit: 1,
          status:
            "active",
        }),

        getProjects({
          page: 1,
          limit: 1,
          status:
            "completed",
        }),

        getProjects({
          page: 1,
          limit: 1,
          status:
            "draft",
        }),

        getProjects({
          page: 1,
          limit: 1,
          status:
            "on_hold",
        }),

        getProjects({
          page: 1,
          limit: 1,
          status:
            "archived",
        }),
      ]);

    return {
      totalProjects:
        all.total,

      activeProjects:
        active.total,

      completedProjects:
        completed.total,

      draftProjects:
        draft.total,

      onHoldProjects:
        onHold.total,

      archivedProjects:
        archived.total,
    };
  };

export const getProjectById =
  async (
    projectId: string
  ): Promise<Project> => {
    const response =
      await api.get(
        `/projects/${projectId}`
      );

    return extractProjectResponse(
      response.data
    );
  };

export const createProject =
  async (
    payload:
      CreateProjectPayload
  ): Promise<Project> => {
    const response =
      await api.post(
        "/projects",

        prepareCreatePayload(
          payload
        )
      );

    return extractProjectResponse(
      response.data
    );
  };

export const updateProject =
  async (
    projectId: string,

    payload:
      UpdateProjectPayload
  ): Promise<Project> => {
    const response =
      await api.patch(
        `/projects/${projectId}`,

        prepareUpdatePayload(
          payload
        )
      );

    return extractProjectResponse(
      response.data
    );
  };

/* =========================================================
   PROJECT LIFECYCLE API METHODS

   Status changes are intentionally separate from Edit
   Project. Backend validates every transition.
   ========================================================= */

export const startProject =
  async (
    projectId: string
  ): Promise<Project> => {
    const response =
      await api.patch(
        `/projects/${projectId}/start`
      );

    return extractProjectResponse(
      response.data
    );
  };

export const putProjectOnHold =
  async (
    projectId: string
  ): Promise<Project> => {
    const response =
      await api.patch(
        `/projects/${projectId}/hold`
      );

    return extractProjectResponse(
      response.data
    );
  };

export const resumeProject =
  async (
    projectId: string
  ): Promise<Project> => {
    const response =
      await api.patch(
        `/projects/${projectId}/resume`
      );

    return extractProjectResponse(
      response.data
    );
  };

export const completeProject =
  async (
    projectId: string
  ): Promise<Project> => {
    const response =
      await api.patch(
        `/projects/${projectId}/complete`
      );

    return extractProjectResponse(
      response.data
    );
  };

export const reopenProject =
  async (
    projectId: string
  ): Promise<Project> => {
    const response =
      await api.patch(
        `/projects/${projectId}/reopen`
      );

    return extractProjectResponse(
      response.data
    );
  };

export const archiveProject =
  async (
    projectId: string
  ): Promise<Project> => {
    const response =
      await api.patch(
        `/projects/${projectId}/archive`
      );

    return extractProjectResponse(
      response.data
    );
  };

export const permanentlyDeleteProject =
  async (
    projectId: string
  ): Promise<void> => {
    await api.delete(
      `/projects/${projectId}/permanent`
    );
  };

/* =========================================================
   CLIENT ACCESS API METHODS
   ========================================================= */

export const createProjectClientAccess =
  async (
    projectId: string
  ): Promise<ClientAccessResponse> => {
    const response =
      await api.post(
        `/projects/${projectId}/client-access`
      );

    const responseData =
      getResponseData(
        response.data
      );

    if (!isObject(responseData)) {
      return {
        clientAccessEnabled:
          true,
      };
    }

    const projectCode =
      isString(
        responseData
          .projectCode
      )
        ? responseData
            .projectCode
        : undefined;

    const projectReferenceNo =
      isString(
        responseData
          .projectReferenceNo
      )
        ? responseData
            .projectReferenceNo
        : projectCode;

    return {
      clientAccessEnabled:
        typeof responseData
          .clientAccessEnabled ===
        "boolean"
          ? responseData
              .clientAccessEnabled
          : true,

      ...(isString(
        responseData
          .clientAccessToken
      )
        ? {
            clientAccessToken:
              responseData
                .clientAccessToken,
          }
        : {}),

      ...(projectCode
        ? {
            projectCode,
          }
        : {}),

      ...(projectReferenceNo
        ? {
            projectReferenceNo,
          }
        : {}),

      ...(isString(
        responseData.publicUrl
      )
        ? {
            publicUrl:
              responseData
                .publicUrl,
          }
        : {}),
    };
  };

export const revokeProjectClientAccess =
  async (
    projectId: string
  ): Promise<ClientAccessResponse> => {
    const response =
      await api.patch(
        `/projects/${projectId}/client-access/revoke`
      );

    const responseData =
      getResponseData(
        response.data
      );

    if (!isObject(responseData)) {
      return {
        clientAccessEnabled:
          false,
      };
    }

    const projectCode =
      isString(
        responseData
          .projectCode
      )
        ? responseData
            .projectCode
        : undefined;

    const projectReferenceNo =
      isString(
        responseData
          .projectReferenceNo
      )
        ? responseData
            .projectReferenceNo
        : projectCode;

    return {
      clientAccessEnabled:
        typeof responseData
          .clientAccessEnabled ===
        "boolean"
          ? responseData
              .clientAccessEnabled
          : false,

      ...(projectCode
        ? {
            projectCode,
          }
        : {}),

      ...(projectReferenceNo
        ? {
            projectReferenceNo,
          }
        : {}),
    };
  };

export const getPublicProjectByToken =
  async (
    accessToken: string
  ): Promise<Project> => {
    const normalizedToken =
      accessToken.trim();

    if (!normalizedToken) {
      throw new Error(
        "Project access token is required."
      );
    }

    const response =
      await api.get(
        `/projects/public/access/${encodeURIComponent(
          normalizedToken
        )}`
      );

    return extractProjectResponse(
      response.data
    );
  };

/* =========================================================
   DISPLAY HELPERS
   ========================================================= */

export const getProjectReferenceNumber = (
  project: Project
): string => {
  return (
    project.projectReferenceNo
      ?.trim() ||
    project.projectCode
      ?.trim() ||
    ""
  );
};

export const getProjectDisplayName = (
  project: Project
): string => {
  const projectReferenceNo =
    getProjectReferenceNumber(
      project
    );

  if (!projectReferenceNo) {
    return project.title;
  }

  return `${projectReferenceNo} — ${project.title}`;
};

export const getProjectSiteLabel = (
  project: Project
): string => {
  const values = [
    project.site?.name,
    project.site?.location,
    project.site?.city,
    project.site?.province,
  ]
    .filter(
      (
        value
      ): value is string =>
        Boolean(
          value?.trim()
        )
    )
    .map(
      (value) =>
        value.trim()
    );

  return Array.from(
    new Set(values)
  ).join(", ");
};

/* =========================================================
   PUBLIC EVIDENCE IMAGE URL
   ========================================================= */

export const getPublicEvidenceImageUrl = (
  imagePath: string
): string => {
  const normalizedPath =
    imagePath.trim();

  if (!normalizedPath) {
    return "";
  }

  if (
    normalizedPath.startsWith(
      "http://"
    ) ||
    normalizedPath.startsWith(
      "https://"
    )
  ) {
    return normalizedPath;
  }

  const publicPath =
    normalizedPath.startsWith(
      "/"
    )
      ? normalizedPath
      : `/${normalizedPath}`;

  const apiBaseUrl =
    String(
      api.defaults.baseURL ??
      ""
    )
      .trim()
      .replace(
        /\/+$/,
        ""
      );

  const serverBaseUrl =
    apiBaseUrl.replace(
      /\/api\/v1$/i,
      ""
    );

  return serverBaseUrl
    ? `${serverBaseUrl}${publicPath}`
    : publicPath;
};

/* =========================================================
   DEFAULT SERVICE EXPORT
   ========================================================= */

const projectService = {
  getProjects,
  getActiveProjects,
  getProjectDashboardStats,
  getProjectById,

  createProject,
  updateProject,

  startProject,
  putProjectOnHold,
  resumeProject,
  completeProject,
  reopenProject,
  archiveProject,
  permanentlyDeleteProject,

  createProjectClientAccess,
  revokeProjectClientAccess,

  getPublicProjectByToken,

  getProjectReferenceNumber,
  getProjectDisplayName,
  getProjectSiteLabel,
  getPublicEvidenceImageUrl,
};

export default projectService;