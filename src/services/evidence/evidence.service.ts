import api from "../api";

import type {
  RiskEvidence,
  RiskEvidenceSummary,
  RiskEvidenceType,
  RiskStatus,
} from "../risk/risk.service";

/* =========================================================
   UPLOAD CONFIGURATION

   Backend configuration ke exact mutabiq:

   Field name: images
   Maximum files: 10
   Maximum size: 10 MB per image
   ========================================================= */

export const MAX_EVIDENCE_IMAGES = 10;

export const MAX_EVIDENCE_IMAGE_SIZE =
  10 * 1024 * 1024;

export const ALLOWED_EVIDENCE_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

/* =========================================================
   EVIDENCE TYPES
   ========================================================= */

export type Evidence = RiskEvidence;

export type EvidenceType =
  RiskEvidenceType;

export type EvidenceSummary =
  RiskEvidenceSummary;

/* =========================================================
   RISK RECORD RETURNED BY EVIDENCE API
   ========================================================= */

export type EvidenceRiskRecord = {
  _id: string;

  projectId: string;
  projectCode: string;

  serialNo: string;
  riskRegisterId: string;

  description: string;

  status: RiskStatus;

  createdAt?: string;
  updatedAt?: string;
};

/* =========================================================
   EVIDENCE BY TYPE RESULT
   ========================================================= */

export type EvidenceByTypeResult = {
  evidenceType: EvidenceType;

  evidences: Evidence[];

  count: number;
};

/* =========================================================
   UPLOAD RESULT
   ========================================================= */

export type UploadEvidenceResult = {
  risk: EvidenceRiskRecord;

  uploadedEvidence: Evidence[];

  evidence: EvidenceSummary;
};

/* =========================================================
   DELETE SINGLE EVIDENCE RESULT
   ========================================================= */

export type DeleteEvidenceResult = {
  evidence: Evidence;

  risk: EvidenceRiskRecord;

  evidenceSummary: EvidenceSummary;

  imageFileDeleted: boolean;
};

/* =========================================================
   DELETE EVIDENCE TYPE RESULT
   ========================================================= */

export type DeleteEvidenceTypeResult = {
  evidenceType: EvidenceType;

  deletedRecords: number;

  imageFilesRequested: number;
  imageFilesDeleted: number;

  risk: EvidenceRiskRecord;

  evidenceSummary: EvidenceSummary;
};

/* =========================================================
   API RESPONSE ENVELOPE
   ========================================================= */

type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
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
    typeof responseBody === "object" &&
    "data" in responseBody
  ) {
    const envelope =
      responseBody as ApiEnvelope<T>;

    if (envelope.data !== undefined) {
      return envelope.data;
    }
  }

  return responseBody as T;
};

/* =========================================================
   BASIC NORMALIZERS
   ========================================================= */

const normalizeString = (
  value: unknown
): string => {
  return typeof value === "string"
    ? value
    : "";
};

const normalizeNumber = (
  value: unknown,
  fallback = 0
): number => {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : fallback;
};

const normalizeBoolean = (
  value: unknown,
  fallback = false
): boolean => {
  return typeof value === "boolean"
    ? value
    : fallback;
};

const normalizeRiskStatus = (
  value: unknown
): RiskStatus => {
  return value === "complete"
    ? "complete"
    : "in_progress";
};

const normalizeEvidenceType = (
  value: unknown
): EvidenceType => {
  return value === "after"
    ? "after"
    : "before";
};

/* =========================================================
   EVIDENCE NORMALIZER
   ========================================================= */

const normalizeEvidence = (
  rawEvidence: unknown
): Evidence => {
  const evidence =
    rawEvidence &&
    typeof rawEvidence === "object"
      ? (rawEvidence as Partial<Evidence>)
      : {};

  return {
    _id:
      normalizeString(
        evidence._id
      ),

    projectId:
      normalizeString(
        evidence.projectId
      ),

    projectCode:
      normalizeString(
        evidence.projectCode
      ),

    riskId:
      normalizeString(
        evidence.riskId
      ),

    riskRegisterId:
      normalizeString(
        evidence.riskRegisterId
      ),

    evidenceType:
      normalizeEvidenceType(
        evidence.evidenceType
      ),

    imagePath:
      normalizeString(
        evidence.imagePath
      ),

    createdAt:
      normalizeString(
        evidence.createdAt
      ),

    updatedAt:
      normalizeString(
        evidence.updatedAt
      ),
  };
};

/* =========================================================
   EVIDENCE SUMMARY NORMALIZER
   ========================================================= */

const normalizeEvidenceSummary = (
  rawSummary: unknown
): EvidenceSummary => {
  const summary =
    rawSummary &&
    typeof rawSummary === "object"
      ? (rawSummary as {
          before?: unknown[];
          after?: unknown[];

          beforeCount?: unknown;
          afterCount?: unknown;

          canMarkComplete?: unknown;
        })
      : {};

  const before =
    Array.isArray(summary.before)
      ? summary.before.map(
          normalizeEvidence
        )
      : [];

  const after =
    Array.isArray(summary.after)
      ? summary.after.map(
          normalizeEvidence
        )
      : [];

  const beforeCount =
    normalizeNumber(
      summary.beforeCount,
      before.length
    );

  const afterCount =
    normalizeNumber(
      summary.afterCount,
      after.length
    );

  return {
    before,
    after,

    beforeCount,
    afterCount,

    canMarkComplete:
      normalizeBoolean(
        summary.canMarkComplete,
        beforeCount > 0 &&
          afterCount > 0
      ),
  };
};

/* =========================================================
   RISK NORMALIZER
   ========================================================= */

const normalizeEvidenceRisk = (
  rawRisk: unknown
): EvidenceRiskRecord => {
  const risk =
    rawRisk &&
    typeof rawRisk === "object"
      ? (rawRisk as Partial<EvidenceRiskRecord>)
      : {};

  return {
    _id:
      normalizeString(
        risk._id
      ),

    projectId:
      normalizeString(
        risk.projectId
      ),

    projectCode:
      normalizeString(
        risk.projectCode
      ),

    serialNo:
      normalizeString(
        risk.serialNo
      ),

    riskRegisterId:
      normalizeString(
        risk.riskRegisterId
      ),

    description:
      normalizeString(
        risk.description
      ),

    status:
      normalizeRiskStatus(
        risk.status
      ),

    createdAt:
      normalizeString(
        risk.createdAt
      ),

    updatedAt:
      normalizeString(
        risk.updatedAt
      ),
  };
};

/* =========================================================
   VALIDATE RISK ID
   ========================================================= */

const validateRiskId = (
  riskId: string
): string => {
  const normalizedRiskId =
    riskId.trim();

  if (!normalizedRiskId) {
    throw new Error(
      "Risk ID is required."
    );
  }

  return normalizedRiskId;
};

/* =========================================================
   IMAGE FILE VALIDATION
   ========================================================= */

const validateEvidenceFiles = (
  files: File[] | FileList
): File[] => {
  const normalizedFiles =
    Array.from(files);

  if (
    normalizedFiles.length === 0
  ) {
    throw new Error(
      "At least one evidence image is required."
    );
  }

  if (
    normalizedFiles.length >
    MAX_EVIDENCE_IMAGES
  ) {
    throw new Error(
      `Maximum ${MAX_EVIDENCE_IMAGES} evidence images can be uploaded at one time.`
    );
  }

  normalizedFiles.forEach(
    (file) => {
      if (
        !ALLOWED_EVIDENCE_IMAGE_TYPES.includes(
          file.type as
            (typeof ALLOWED_EVIDENCE_IMAGE_TYPES)[number]
        )
      ) {
        throw new Error(
          `${file.name}: only JPG, JPEG, PNG and WEBP images are allowed.`
        );
      }

      if (
        file.size >
        MAX_EVIDENCE_IMAGE_SIZE
      ) {
        throw new Error(
          `${file.name}: image must be 10 MB or smaller.`
        );
      }
    }
  );

  return normalizedFiles;
};

/* =========================================================
   CREATE FORM DATA

   Important:

   Content-Type manually set nahi karna.
   Browser multipart boundary khud generate karega.
   ========================================================= */

const createEvidenceFormData = (
  files: File[] | FileList
): FormData => {
  const validatedFiles =
    validateEvidenceFiles(files);

  const formData =
    new FormData();

  validatedFiles.forEach(
    (file) => {
      formData.append(
        "images",
        file
      );
    }
  );

  return formData;
};

/* =========================================================
   GET ALL BEFORE AND AFTER EVIDENCE

   GET /evidences/risk/:riskId
   ========================================================= */

export const getRiskEvidences =
  async (
    riskId: string
  ): Promise<EvidenceSummary> => {
    const normalizedRiskId =
      validateRiskId(riskId);

    const response = await api.get(
      `/evidences/risk/${normalizedRiskId}`
    );

    const data =
      extractResponseData<
        | {
            evidence?: unknown;
          }
        | unknown
      >(response);

    if (
      data &&
      typeof data === "object" &&
      "evidence" in data
    ) {
      return normalizeEvidenceSummary(
        (
          data as {
            evidence?: unknown;
          }
        ).evidence
      );
    }

    return normalizeEvidenceSummary(
      data
    );
  };

/* =========================================================
   GET EVIDENCE BY TYPE
   ========================================================= */

const getEvidenceByType =
  async (
    riskId: string,
    evidenceType: EvidenceType
  ): Promise<EvidenceByTypeResult> => {
    const normalizedRiskId =
      validateRiskId(riskId);

    const response = await api.get(
      `/evidences/risk/${normalizedRiskId}/${evidenceType}`
    );

    const data =
      extractResponseData<{
        evidenceType?: unknown;
        evidences?: unknown[];
        count?: unknown;
      }>(response);

    const evidences =
      Array.isArray(data?.evidences)
        ? data.evidences.map(
            normalizeEvidence
          )
        : [];

    return {
      evidenceType:
        normalizeEvidenceType(
          data?.evidenceType ??
            evidenceType
        ),

      evidences,

      count:
        normalizeNumber(
          data?.count,
          evidences.length
        ),
    };
  };

/* =========================================================
   GET BEFORE EVIDENCE

   GET /evidences/risk/:riskId/before
   ========================================================= */

export const getBeforeEvidences =
  async (
    riskId: string
  ): Promise<EvidenceByTypeResult> => {
    return getEvidenceByType(
      riskId,
      "before"
    );
  };

/* =========================================================
   GET AFTER EVIDENCE

   GET /evidences/risk/:riskId/after
   ========================================================= */

export const getAfterEvidences =
  async (
    riskId: string
  ): Promise<EvidenceByTypeResult> => {
    return getEvidenceByType(
      riskId,
      "after"
    );
  };

/* =========================================================
   GET SINGLE EVIDENCE

   GET /evidences/:evidenceId
   ========================================================= */

export const getEvidenceById =
  async (
    evidenceId: string
  ): Promise<Evidence> => {
    const normalizedEvidenceId =
      evidenceId.trim();

    if (!normalizedEvidenceId) {
      throw new Error(
        "Evidence ID is required."
      );
    }

    const response = await api.get(
      `/evidences/${normalizedEvidenceId}`
    );

    const data =
      extractResponseData<
        | {
            evidence?: unknown;
          }
        | unknown
      >(response);

    if (
      data &&
      typeof data === "object" &&
      "evidence" in data
    ) {
      return normalizeEvidence(
        (
          data as {
            evidence?: unknown;
          }
        ).evidence
      );
    }

    return normalizeEvidence(data);
  };

/* =========================================================
   UPLOAD EVIDENCE
   ========================================================= */

const uploadEvidence =
  async (
    riskId: string,
    evidenceType: EvidenceType,
    files: File[] | FileList
  ): Promise<UploadEvidenceResult> => {
    const normalizedRiskId =
      validateRiskId(riskId);

    const formData =
      createEvidenceFormData(files);

    const response = await api.post(
      `/evidences/risk/${normalizedRiskId}/${evidenceType}`,
      formData
    );

    const data =
      extractResponseData<{
        risk?: unknown;

        uploadedEvidence?: unknown[];

        evidence?: unknown;
      }>(response);

    return {
      risk:
        normalizeEvidenceRisk(
          data?.risk
        ),

      uploadedEvidence:
        Array.isArray(
          data?.uploadedEvidence
        )
          ? data.uploadedEvidence.map(
              normalizeEvidence
            )
          : [],

      evidence:
        normalizeEvidenceSummary(
          data?.evidence
        ),
    };
  };

/* =========================================================
   UPLOAD BEFORE EVIDENCE

   POST /evidences/risk/:riskId/before
   ========================================================= */

export const uploadBeforeEvidence =
  async (
    riskId: string,
    files: File[] | FileList
  ): Promise<UploadEvidenceResult> => {
    return uploadEvidence(
      riskId,
      "before",
      files
    );
  };

/* =========================================================
   UPLOAD AFTER EVIDENCE

   POST /evidences/risk/:riskId/after
   ========================================================= */

export const uploadAfterEvidence =
  async (
    riskId: string,
    files: File[] | FileList
  ): Promise<UploadEvidenceResult> => {
    return uploadEvidence(
      riskId,
      "after",
      files
    );
  };

/* =========================================================
   DELETE SINGLE EVIDENCE

   DELETE
   /evidences/risk/:riskId/:evidenceId
   ========================================================= */

export const deleteEvidence =
  async (
    riskId: string,
    evidenceId: string
  ): Promise<DeleteEvidenceResult> => {
    const normalizedRiskId =
      validateRiskId(riskId);

    const normalizedEvidenceId =
      evidenceId.trim();

    if (!normalizedEvidenceId) {
      throw new Error(
        "Evidence ID is required."
      );
    }

    const response = await api.delete(
      `/evidences/risk/${normalizedRiskId}/${normalizedEvidenceId}`
    );

    const data =
      extractResponseData<{
        evidence?: unknown;
        risk?: unknown;
        evidenceSummary?: unknown;
        imageFileDeleted?: unknown;
      }>(response);

    return {
      evidence:
        normalizeEvidence(
          data?.evidence
        ),

      risk:
        normalizeEvidenceRisk(
          data?.risk
        ),

      evidenceSummary:
        normalizeEvidenceSummary(
          data?.evidenceSummary
        ),

      imageFileDeleted:
        normalizeBoolean(
          data?.imageFileDeleted
        ),
    };
  };

/* =========================================================
   DELETE ALL EVIDENCE BY TYPE
   ========================================================= */

const deleteEvidenceByType =
  async (
    riskId: string,
    evidenceType: EvidenceType
  ): Promise<DeleteEvidenceTypeResult> => {
    const normalizedRiskId =
      validateRiskId(riskId);

    const response = await api.delete(
      `/evidences/risk/${normalizedRiskId}/${evidenceType}`
    );

    const data =
      extractResponseData<{
        evidenceType?: unknown;

        deletedRecords?: unknown;

        imageFilesRequested?: unknown;
        imageFilesDeleted?: unknown;

        risk?: unknown;

        evidenceSummary?: unknown;
      }>(response);

    return {
      evidenceType:
        normalizeEvidenceType(
          data?.evidenceType ??
            evidenceType
        ),

      deletedRecords:
        normalizeNumber(
          data?.deletedRecords
        ),

      imageFilesRequested:
        normalizeNumber(
          data?.imageFilesRequested
        ),

      imageFilesDeleted:
        normalizeNumber(
          data?.imageFilesDeleted
        ),

      risk:
        normalizeEvidenceRisk(
          data?.risk
        ),

      evidenceSummary:
        normalizeEvidenceSummary(
          data?.evidenceSummary
        ),
    };
  };

/* =========================================================
   DELETE ALL BEFORE EVIDENCE

   DELETE /evidences/risk/:riskId/before
   ========================================================= */

export const deleteBeforeEvidences =
  async (
    riskId: string
  ): Promise<DeleteEvidenceTypeResult> => {
    return deleteEvidenceByType(
      riskId,
      "before"
    );
  };

/* =========================================================
   DELETE ALL AFTER EVIDENCE

   DELETE /evidences/risk/:riskId/after
   ========================================================= */

export const deleteAfterEvidences =
  async (
    riskId: string
  ): Promise<DeleteEvidenceTypeResult> => {
    return deleteEvidenceByType(
      riskId,
      "after"
    );
  };

/* =========================================================
   BUILD PUBLIC IMAGE URL

   Database path:

   /uploads/risks/before/image.jpg

   Full URL:

   http://localhost:5000/uploads/risks/before/image.jpg
   ========================================================= */

export const getEvidenceImageUrl = (
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
    normalizedPath.startsWith("/")
      ? normalizedPath
      : `/${normalizedPath}`;

  const apiBaseUrl =
    String(
      api.defaults.baseURL ?? ""
    )
      .trim()
      .replace(/\/+$/, "");

  const serverBaseUrl =
    apiBaseUrl.replace(
      /\/api\/v1$/i,
      ""
    );

  return serverBaseUrl
    ? `${serverBaseUrl}${publicPath}`
    : publicPath;
};