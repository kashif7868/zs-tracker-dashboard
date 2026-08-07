import api from "../api";

/* =========================================================
   RISK STATUS
   ========================================================= */

export const RISK_STATUSES = [
  "in_progress",
  "complete",
] as const;

export type RiskStatus =
  (typeof RISK_STATUSES)[number];

/* =========================================================
   SORTING
   ========================================================= */

export const RISK_SORT_FIELDS = [
  "serialNo",
  "riskRegisterId",
  "projectCode",
  "description",
  "status",
  "createdAt",
  "updatedAt",
] as const;

export type RiskSortField =
  (typeof RISK_SORT_FIELDS)[number];

/* =========================================================
   EVIDENCE TYPES
   ========================================================= */

export type RiskEvidenceType =
  | "before"
  | "after";

export type RiskEvidence = {
  _id: string;

  projectId: string;

  /*
    Backend database field projectCode hai.

    Frontend par isay Project Reference Number ke label
    ke saath display kiya jayega.
  */
  projectCode: string;
  projectReferenceNo?: string;

  riskId: string;

  riskRegisterId?: string;

  evidenceType: RiskEvidenceType;

  imagePath: string;

  createdAt: string;
  updatedAt: string;
};

export type RiskEvidenceSummary = {
  before: RiskEvidence[];
  after: RiskEvidence[];

  beforeCount: number;
  afterCount: number;

  canMarkComplete: boolean;
};

/* =========================================================
   MAIN RISK TYPE

   serialNo:
   Project-wise automatically generated number.

   riskRegisterId:
   Optional field.
   Project setting se availability control hogi.

   description:
   Complete finding, issue aur effect isi field mein rahega.
   ========================================================= */

export type Risk = {
  _id: string;

  projectId: string;

  projectCode: string;
  projectReferenceNo?: string;

  serialNo: number;

  riskRegisterId?: string;

  description: string;

  status: RiskStatus;

  createdAt: string;
  updatedAt: string;

  evidenceSummary?: RiskEvidenceSummary;
};

/* =========================================================
   CREATE PAYLOAD

   Frontend API ko sirf yeh fields bhejega:

   projectId
   description
   riskRegisterId optional

   serialNo automatically generate hoga.
   status automatically in_progress hoga.
   ========================================================= */

export type CreateRiskPayload = {
  projectId: string;

  description: string;

  riskRegisterId?: string;
};

/* =========================================================
   UPDATE PAYLOAD

   Editable fields:

   description
   riskRegisterId optional

   Blank/null riskRegisterId existing value remove karega,
   provided Project Settings mein field enabled ho.
   ========================================================= */

export type UpdateRiskPayload = {
  description?: string;

  riskRegisterId?: string | null;
};

/* =========================================================
   STATUS PAYLOAD
   ========================================================= */

export type UpdateRiskStatusPayload = {
  status: RiskStatus;
};

/* =========================================================
   QUERY PARAMETERS
   ========================================================= */

export type RiskListParams = {
  projectId?: string;

  status?: RiskStatus | "";

  search?: string;

  page?: number;
  limit?: number;

  sortBy?: RiskSortField;
  sortOrder?: "asc" | "desc";
};

/* =========================================================
   PAGINATION
   ========================================================= */

export type RiskPagination = {
  page: number;
  limit: number;

  total: number;
  totalRecords: number;

  totalPages: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type RiskListResult = {
  risks: Risk[];

  pagination: RiskPagination;
};

/* =========================================================
   SINGLE RISK DETAILS
   ========================================================= */

export type RiskDetailsResult = {
  risk: Risk;

  evidence: RiskEvidenceSummary;
};

/* =========================================================
   DELETE RESULT
   ========================================================= */

export type DeleteRiskResult = {
  riskId?: string;

  risk?: Risk;

  deletedEvidenceCount?: number;

  deletedImagePaths?: string[];

  imageFilesRequested?: number;
  imageFilesDeleted?: number;

  message?: string;
};

/* =========================================================
   DASHBOARD SUMMARY
   ========================================================= */

export type RiskDashboardSummary = {
  totalRisks: number;

  inProgressRisks: number;

  completeRisks: number;

  completionPercentage: number;
};

/* =========================================================
   INTERNAL API TYPES
   ========================================================= */

type ApiEnvelope<T> = {
  success?: boolean;

  message?: string;

  data?: T;
};

type RawRiskListData = {
  risks?: unknown[];

  pagination?: unknown;
};

type RawRiskDetailsData = {
  risk?: unknown;

  evidence?: unknown;
};

/* =========================================================
   GENERAL HELPERS
   ========================================================= */

const hasOwnField = (
  object: object,
  field: PropertyKey
): boolean => {
  return Object.prototype.hasOwnProperty.call(
    object,
    field
  );
};

const normalizeString = (
  value: unknown
): string => {
  return typeof value === "string"
    ? value
    : "";
};

const normalizeTrimmedString = (
  value: unknown
): string => {
  return normalizeString(
    value
  ).trim();
};

const normalizeNumber = (
  value: unknown,
  fallback = 0
): number => {
  const numberValue =
    Number(value);

  return Number.isFinite(
    numberValue
  )
    ? numberValue
    : fallback;
};

const normalizeNonNegativeInteger = (
  value: unknown,
  fallback = 0
): number => {
  const numberValue =
    normalizeNumber(
      value,
      fallback
    );

  return Math.max(
    Math.trunc(
      numberValue
    ),
    0
  );
};

const normalizeRiskStatus = (
  value: unknown
): RiskStatus => {
  return value === "complete"
    ? "complete"
    : "in_progress";
};

const encodePathValue = (
  value: string
): string => {
  return encodeURIComponent(
    value.trim()
  );
};

/* =========================================================
   RESPONSE DATA EXTRACTOR
   ========================================================= */

const extractResponseData = <T>(
  response: unknown
): T => {
  const axiosResponse =
    response as {
      data?: unknown;
    };

  const responseBody =
    axiosResponse?.data;

  if (
    responseBody &&
    typeof responseBody ===
      "object" &&
    "data" in responseBody
  ) {
    const envelope =
      responseBody as ApiEnvelope<T>;

    if (
      envelope.data !==
      undefined
    ) {
      return envelope.data;
    }
  }

  return responseBody as T;
};

/* =========================================================
   EVIDENCE NORMALIZER
   ========================================================= */

const normalizeEvidenceRecord = (
  rawEvidence: unknown
): RiskEvidence => {
  const evidence =
    rawEvidence &&
    typeof rawEvidence ===
      "object"
      ? (
          rawEvidence as Partial<RiskEvidence>
        )
      : {};

  const projectCode =
    normalizeTrimmedString(
      evidence.projectCode
    );

  const projectReferenceNo =
    normalizeTrimmedString(
      evidence.projectReferenceNo
    ) || projectCode;

  const riskRegisterId =
    normalizeTrimmedString(
      evidence.riskRegisterId
    );

  return {
    _id:
      normalizeTrimmedString(
        evidence._id
      ),

    projectId:
      normalizeTrimmedString(
        evidence.projectId
      ),

    projectCode,

    projectReferenceNo,

    riskId:
      normalizeTrimmedString(
        evidence.riskId
      ),

    ...(riskRegisterId
      ? {
          riskRegisterId,
        }
      : {}),

    evidenceType:
      evidence.evidenceType ===
      "after"
        ? "after"
        : "before",

    imagePath:
      normalizeTrimmedString(
        evidence.imagePath
      ),

    createdAt:
      normalizeTrimmedString(
        evidence.createdAt
      ),

    updatedAt:
      normalizeTrimmedString(
        evidence.updatedAt
      ),
  };
};

/* =========================================================
   EVIDENCE SUMMARY NORMALIZER
   ========================================================= */

const normalizeEvidenceSummary = (
  rawEvidence?: unknown
): RiskEvidenceSummary => {
  const evidence =
    rawEvidence &&
    typeof rawEvidence ===
      "object"
      ? (
          rawEvidence as {
            before?: unknown[];
            after?: unknown[];

            beforeCount?: unknown;
            afterCount?: unknown;

            canMarkComplete?: unknown;
          }
        )
      : {};

  const before =
    Array.isArray(
      evidence.before
    )
      ? evidence.before.map(
          normalizeEvidenceRecord
        )
      : [];

  const after =
    Array.isArray(
      evidence.after
    )
      ? evidence.after.map(
          normalizeEvidenceRecord
        )
      : [];

  const beforeCount =
    normalizeNonNegativeInteger(
      evidence.beforeCount,
      before.length
    );

  const afterCount =
    normalizeNonNegativeInteger(
      evidence.afterCount,
      after.length
    );

  const canMarkComplete =
    typeof evidence.canMarkComplete ===
    "boolean"
      ? evidence.canMarkComplete
      : beforeCount > 0 &&
        afterCount > 0;

  return {
    before,
    after,

    beforeCount,
    afterCount,

    canMarkComplete,
  };
};

/* =========================================================
   RISK NORMALIZER
   ========================================================= */

const normalizeRisk = (
  rawRisk: unknown
): Risk => {
  const risk =
    rawRisk &&
    typeof rawRisk ===
      "object"
      ? (
          rawRisk as Partial<Risk> & {
            evidence?: unknown;

            beforeCount?: unknown;
            afterCount?: unknown;

            canMarkComplete?: unknown;
          }
        )
      : {};

  const projectCode =
    normalizeTrimmedString(
      risk.projectCode
    );

  const projectReferenceNo =
    normalizeTrimmedString(
      risk.projectReferenceNo
    ) || projectCode;

  const riskRegisterId =
    normalizeTrimmedString(
      risk.riskRegisterId
    );

  const rawEvidenceSummary =
    risk.evidenceSummary ??
    risk.evidence ??
    {
      beforeCount:
        risk.beforeCount,

      afterCount:
        risk.afterCount,

      canMarkComplete:
        risk.canMarkComplete,
    };

  return {
    _id:
      normalizeTrimmedString(
        risk._id
      ),

    projectId:
      normalizeTrimmedString(
        risk.projectId
      ),

    projectCode,

    projectReferenceNo,

    serialNo:
      normalizeNonNegativeInteger(
        risk.serialNo
      ),

    ...(riskRegisterId
      ? {
          riskRegisterId,
        }
      : {}),

    description:
      normalizeTrimmedString(
        risk.description
      ),

    status:
      normalizeRiskStatus(
        risk.status
      ),

    createdAt:
      normalizeTrimmedString(
        risk.createdAt
      ),

    updatedAt:
      normalizeTrimmedString(
        risk.updatedAt
      ),

    evidenceSummary:
      normalizeEvidenceSummary(
        rawEvidenceSummary
      ),
  };
};

/* =========================================================
   PAGINATION NORMALIZER
   ========================================================= */

const normalizePagination = (
  rawPagination: unknown,
  riskCount: number
): RiskPagination => {
  const pagination =
    rawPagination &&
    typeof rawPagination ===
      "object"
      ? (
          rawPagination as {
            page?: unknown;

            limit?: unknown;

            total?: unknown;
            totalRecords?: unknown;
            totalRisks?: unknown;

            totalPages?: unknown;

            hasNextPage?: unknown;

            hasPreviousPage?: unknown;
          }
        )
      : {};

  const page =
    Math.max(
      normalizeNonNegativeInteger(
        pagination.page,
        1
      ),
      1
    );

  const limit =
    Math.max(
      normalizeNonNegativeInteger(
        pagination.limit,
        riskCount || 1
      ),
      1
    );

  const total =
    Math.max(
      normalizeNonNegativeInteger(
        pagination.total ??
          pagination.totalRecords ??
          pagination.totalRisks,
        riskCount
      ),
      0
    );

  const totalPages =
    Math.max(
      normalizeNonNegativeInteger(
        pagination.totalPages,
        Math.ceil(
          total / limit
        ) || 1
      ),
      1
    );

  return {
    page,
    limit,

    total,
    totalRecords:
      total,

    totalPages,

    hasNextPage:
      typeof pagination
        .hasNextPage ===
      "boolean"
        ? pagination.hasNextPage
        : page < totalPages,

    hasPreviousPage:
      typeof pagination
        .hasPreviousPage ===
      "boolean"
        ? pagination.hasPreviousPage
        : page > 1,
  };
};

/* =========================================================
   SINGLE RISK EXTRACTOR
   ========================================================= */

const extractRisk = (
  data: unknown
): Risk => {
  if (
    data &&
    typeof data === "object" &&
    "risk" in data
  ) {
    return normalizeRisk(
      (
        data as {
          risk?: unknown;
        }
      ).risk
    );
  }

  return normalizeRisk(
    data
  );
};

/* =========================================================
   LIST RESPONSE NORMALIZER
   ========================================================= */

const normalizeRiskListResult = (
  data: unknown
): RiskListResult => {
  if (
    Array.isArray(data)
  ) {
    const risks =
      data.map(
        normalizeRisk
      );

    return {
      risks,

      pagination:
        normalizePagination(
          undefined,
          risks.length
        ),
    };
  }

  const listData =
    data &&
    typeof data ===
      "object"
      ? (
          data as RawRiskListData
        )
      : {};

  const risks =
    Array.isArray(
      listData.risks
    )
      ? listData.risks.map(
          normalizeRisk
        )
      : [];

  return {
    risks,

    pagination:
      normalizePagination(
        listData.pagination,
        risks.length
      ),
  };
};

/* =========================================================
   CREATE PAYLOAD PREPARATION
   ========================================================= */

const prepareCreateRiskPayload = (
  payload: CreateRiskPayload
) => {
  const projectId =
    payload.projectId.trim();

  const description =
    payload.description.trim();

  const riskRegisterId =
    payload.riskRegisterId
      ?.trim();

  return {
    projectId,

    description,

    ...(riskRegisterId
      ? {
          riskRegisterId:
            riskRegisterId.toUpperCase(),
        }
      : {}),
  };
};

/* =========================================================
   UPDATE PAYLOAD PREPARATION

   Only description and riskRegisterId are supported.
   ========================================================= */

const prepareUpdateRiskPayload = (
  payload: UpdateRiskPayload
): Record<
  string,
  string | null
> => {
  const body:
    Record<
      string,
      string | null
    > = {};

  if (
    hasOwnField(
      payload,
      "description"
    )
  ) {
    body.description =
      normalizeTrimmedString(
        payload.description
      );
  }

  if (
    hasOwnField(
      payload,
      "riskRegisterId"
    )
  ) {
    if (
      payload.riskRegisterId ===
      null
    ) {
      body.riskRegisterId =
        null;
    } else {
      const riskRegisterId =
        normalizeTrimmedString(
          payload.riskRegisterId
        );

      body.riskRegisterId =
        riskRegisterId
          ? riskRegisterId
              .toUpperCase()
          : null;
    }
  }

  return body;
};

/* =========================================================
   CREATE RISK

   POST /risks
   ========================================================= */

export const createRisk = async (
  payload: CreateRiskPayload
): Promise<Risk> => {
  const response =
    await api.post(
      "/risks",
      prepareCreateRiskPayload(
        payload
      )
    );

  const data =
    extractResponseData<unknown>(
      response
    );

  return extractRisk(
    data
  );
};

/* =========================================================
   GET ALL RISKS

   GET /risks
   ========================================================= */

export const getRisks = async (
  params: RiskListParams = {}
): Promise<RiskListResult> => {
  const response =
    await api.get(
      "/risks",
      {
        params: {
          ...(params.projectId
            ?.trim()
            ? {
                projectId:
                  params.projectId.trim(),
              }
            : {}),

          ...(params.status
            ? {
                status:
                  params.status,
              }
            : {}),

          ...(params.search
            ?.trim()
            ? {
                search:
                  params.search.trim(),
              }
            : {}),

          ...(params.page
            ? {
                page:
                  params.page,
              }
            : {}),

          ...(params.limit
            ? {
                limit:
                  params.limit,
              }
            : {}),

          ...(params.sortBy
            ? {
                sortBy:
                  params.sortBy,
              }
            : {}),

          ...(params.sortOrder
            ? {
                sortOrder:
                  params.sortOrder,
              }
            : {}),
        },
      }
    );

  const data =
    extractResponseData<unknown>(
      response
    );

  return normalizeRiskListResult(
    data
  );
};

/* =========================================================
   GET RISKS BY PROJECT

   GET /risks/project/:projectId
   ========================================================= */

export const getRisksByProject =
  async (
    projectId: string,
    params: Omit<
      RiskListParams,
      "projectId"
    > = {}
  ): Promise<RiskListResult> => {
    const response =
      await api.get(
        `/risks/project/${encodePathValue(
          projectId
        )}`,
        {
          params: {
            ...(params.status
              ? {
                  status:
                    params.status,
                }
              : {}),

            ...(params.search
              ?.trim()
              ? {
                  search:
                    params.search.trim(),
                }
              : {}),

            ...(params.page
              ? {
                  page:
                    params.page,
                }
              : {}),

            ...(params.limit
              ? {
                  limit:
                    params.limit,
                }
              : {}),

            ...(params.sortBy
              ? {
                  sortBy:
                    params.sortBy,
                }
              : {}),

            ...(params.sortOrder
              ? {
                  sortOrder:
                    params.sortOrder,
                }
              : {}),
          },
        }
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return normalizeRiskListResult(
      data
    );
  };

/* =========================================================
   GET SINGLE RISK

   GET /risks/:riskId
   ========================================================= */

export const getRiskById = async (
  riskId: string
): Promise<RiskDetailsResult> => {
  const response =
    await api.get(
      `/risks/${encodePathValue(
        riskId
      )}`
    );

  const data =
    extractResponseData<unknown>(
      response
    );

  if (
    data &&
    typeof data === "object" &&
    "risk" in data
  ) {
    const details =
      data as RawRiskDetailsData;

    const risk =
      normalizeRisk(
        details.risk
      );

    const evidence =
      normalizeEvidenceSummary(
        details.evidence ??
          risk.evidenceSummary
      );

    return {
      risk: {
        ...risk,

        evidenceSummary:
          evidence,
      },

      evidence,
    };
  }

  const risk =
    normalizeRisk(
      data
    );

  const evidence =
    normalizeEvidenceSummary(
      risk.evidenceSummary
    );

  return {
    risk: {
      ...risk,

      evidenceSummary:
        evidence,
    },

    evidence,
  };
};

/* =========================================================
   UPDATE RISK

   PATCH /risks/:riskId
   ========================================================= */

export const updateRisk = async (
  riskId: string,
  payload: UpdateRiskPayload
): Promise<Risk> => {
  const body =
    prepareUpdateRiskPayload(
      payload
    );

  const response =
    await api.patch(
      `/risks/${encodePathValue(
        riskId
      )}`,
      body
    );

  const data =
    extractResponseData<unknown>(
      response
    );

  return extractRisk(
    data
  );
};

/* =========================================================
   UPDATE STATUS

   PATCH /risks/:riskId/status
   ========================================================= */

export const updateRiskStatus =
  async (
    riskId: string,
    payload:
      UpdateRiskStatusPayload
  ): Promise<Risk> => {
    const response =
      await api.patch(
        `/risks/${encodePathValue(
          riskId
        )}/status`,
        {
          status:
            payload.status,
        }
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractRisk(
      data
    );
  };

/* =========================================================
   MARK COMPLETE

   At least one Before and one After image required.
   ========================================================= */

export const markRiskComplete =
  async (
    riskId: string
  ): Promise<Risk> => {
    const response =
      await api.patch(
        `/risks/${encodePathValue(
          riskId
        )}/complete`
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractRisk(
      data
    );
  };

/* =========================================================
   MARK IN PROGRESS
   ========================================================= */

export const markRiskInProgress =
  async (
    riskId: string
  ): Promise<Risk> => {
    const response =
      await api.patch(
        `/risks/${encodePathValue(
          riskId
        )}/in-progress`
      );

    const data =
      extractResponseData<unknown>(
        response
      );

    return extractRisk(
      data
    );
  };

/* =========================================================
   DELETE RISK
   ========================================================= */

export const deleteRisk = async (
  riskId: string
): Promise<DeleteRiskResult> => {
  const response =
    await api.delete(
      `/risks/${encodePathValue(
        riskId
      )}`
    );

  const data =
    extractResponseData<
      DeleteRiskResult | undefined
    >(response);

  if (!data) {
    return {};
  }

  return {
    ...data,

    ...(data.risk
      ? {
          risk:
            normalizeRisk(
              data.risk
            ),
        }
      : {}),
  };
};

/* =========================================================
   DISPLAY HELPERS
   ========================================================= */

export const getRiskProjectReference = (
  risk: Pick<
    Risk,
    | "projectReferenceNo"
    | "projectCode"
  >
): string => {
  return (
    risk.projectReferenceNo
      ?.trim() ||
    risk.projectCode.trim()
  );
};

export const getRiskSerialLabel = (
  risk: Pick<
    Risk,
    "serialNo"
  >
): string => {
  return String(
    risk.serialNo
  );
};

/* =========================================================
   BUILD DASHBOARD SUMMARY
   ========================================================= */

export const buildRiskDashboardSummary =
  (
    risks: Risk[]
  ): RiskDashboardSummary => {
    const totalRisks =
      risks.length;

    const inProgressRisks =
      risks.filter(
        (risk) =>
          risk.status ===
          "in_progress"
      ).length;

    const completeRisks =
      risks.filter(
        (risk) =>
          risk.status ===
          "complete"
      ).length;

    const completionPercentage =
      totalRisks > 0
        ? Number(
            (
              (
                completeRisks /
                totalRisks
              ) *
              100
            ).toFixed(2)
          )
        : 0;

    return {
      totalRisks,

      inProgressRisks,

      completeRisks,

      completionPercentage,
    };
  };

/* =========================================================
   GET DASHBOARD SUMMARY

   All Risk pages fetch karke frontend par summary
   calculate hoti hai.
   ========================================================= */

export const getRiskDashboardSummary =
  async (
    projectId?: string
  ): Promise<RiskDashboardSummary> => {
    const firstPage =
      projectId
        ? await getRisksByProject(
            projectId,
            {
              page: 1,
              limit: 100,
              sortBy:
                "createdAt",
              sortOrder:
                "desc",
            }
          )
        : await getRisks({
            page: 1,
            limit: 100,
            sortBy:
              "createdAt",
            sortOrder:
              "desc",
          });

    const allRisks = [
      ...firstPage.risks,
    ];

    const totalPages =
      firstPage.pagination
        .totalPages;

    for (
      let page = 2;
      page <= totalPages;
      page += 1
    ) {
      const nextPage =
        projectId
          ? await getRisksByProject(
              projectId,
              {
                page,

                limit:
                  firstPage
                    .pagination
                    .limit,

                sortBy:
                  "createdAt",

                sortOrder:
                  "desc",
              }
            )
          : await getRisks({
              page,

              limit:
                firstPage
                  .pagination
                  .limit,

              sortBy:
                "createdAt",

              sortOrder:
                "desc",
            });

      allRisks.push(
        ...nextPage.risks
      );
    }

    return buildRiskDashboardSummary(
      allRisks
    );
  };