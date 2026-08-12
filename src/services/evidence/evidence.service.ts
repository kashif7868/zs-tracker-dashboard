import api from "../api";

import type {
  TaskEvidence,
  TaskEvidenceSummary,
  TaskEvidenceType,
  TaskStatus,
} from "../task_register/task.service";

/* =========================================================
   UPLOAD CONFIGURATION

   Backend configuration:

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

export type Evidence =
  TaskEvidence;

export type EvidenceType =
  TaskEvidenceType;

export type EvidenceSummary =
  TaskEvidenceSummary;

/* =========================================================
   TASK RECORD RETURNED BY EVIDENCE API
   ========================================================= */

export type EvidenceTaskRecord = {
  _id: string;

  projectId: string;
  projectCode: string;

  serialNo: number;

  displaySrNo?: number;

  taskRegisterId?: string;

  description: string;

  status: TaskStatus;

  completedAt?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

/* =========================================================
   EVIDENCE BY TYPE RESULT
   ========================================================= */

export type EvidenceByTypeResult = {
  evidenceType:
    EvidenceType;

  evidences:
    Evidence[];

  count:
    number;
};

/* =========================================================
   UPLOAD RESULT
   ========================================================= */

export type UploadEvidenceResult = {
  task:
    EvidenceTaskRecord;

  uploadedEvidence:
    Evidence[];

  evidence:
    EvidenceSummary;
};

/* =========================================================
   DELETE SINGLE EVIDENCE RESULT
   ========================================================= */

export type DeleteEvidenceResult = {
  evidence:
    Evidence;

  task:
    EvidenceTaskRecord;

  evidenceSummary:
    EvidenceSummary;

  imageFileDeleted:
    boolean;
};

/* =========================================================
   DELETE EVIDENCE TYPE RESULT
   ========================================================= */

export type DeleteEvidenceTypeResult = {
  evidenceType:
    EvidenceType;

  deletedRecords:
    number;

  imageFilesRequested:
    number;

  imageFilesDeleted:
    number;

  task:
    EvidenceTaskRecord;

  evidenceSummary:
    EvidenceSummary;
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
    typeof responseBody ===
      "object" &&
    "data" in responseBody
  ) {
    const envelope =
      responseBody as
        ApiEnvelope<T>;

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
   BASIC NORMALIZERS
   ========================================================= */

const normalizeString = (
  value: unknown
): string => {
  return typeof value ===
    "string"
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

const normalizeBoolean = (
  value: unknown,
  fallback = false
): boolean => {
  return typeof value ===
    "boolean"
    ? value
    : fallback;
};

const normalizeTaskStatus = (
  value: unknown
): TaskStatus => {
  return value ===
    "complete"
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

const encodePathValue = (
  value: string
): string => {
  return encodeURIComponent(
    value.trim()
  );
};

/* =========================================================
   EVIDENCE NORMALIZER

   Canonical Task Evidence response.

   Existing old MongoDB records may still expose legacy
   physical aliases from the backend model, so read
   normalization remains backward-compatible.
   ========================================================= */

const normalizeEvidence = (
  rawEvidence: unknown
): Evidence => {
  const evidence =
    rawEvidence &&
    typeof rawEvidence ===
      "object"
      ? rawEvidence as Record<
          string,
          unknown
        >
      : {};

  const taskId =
    normalizeTrimmedString(
      evidence.taskId
    ) ||
    normalizeTrimmedString(
      evidence.riskId
    );

  const taskRegisterId =
    normalizeTrimmedString(
      evidence.taskRegisterId
    ) ||
    normalizeTrimmedString(
      evidence.riskRegisterId
    );

  const projectCode =
    normalizeTrimmedString(
      evidence.projectCode
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

    projectReferenceNo:
      normalizeTrimmedString(
        evidence.projectReferenceNo
      ) ||
      projectCode,

    taskId,

    ...(taskRegisterId
      ? {
          taskRegisterId,
        }
      : {}),

    evidenceType:
      normalizeEvidenceType(
        evidence.evidenceType
      ),

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
  rawSummary: unknown
): EvidenceSummary => {
  const summary =
    rawSummary &&
    typeof rawSummary ===
      "object"
      ? rawSummary as Record<
          string,
          unknown
        >
      : {};

  const before =
    Array.isArray(
      summary.before
    )
      ? summary.before.map(
          normalizeEvidence
        )
      : [];

  const after =
    Array.isArray(
      summary.after
    )
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
   TASK NORMALIZER

   Backend compatibility:
   task / risk
   taskRegisterId / riskRegisterId
   ========================================================= */

const normalizeEvidenceTask = (
  rawTask: unknown
): EvidenceTaskRecord => {
  const task =
    rawTask &&
    typeof rawTask ===
      "object"
      ? rawTask as Record<
          string,
          unknown
        >
      : {};

  const taskRegisterId =
    normalizeTrimmedString(
      task.taskRegisterId
    ) ||
    normalizeTrimmedString(
      task.riskRegisterId
    );

  return {
    _id:
      normalizeTrimmedString(
        task._id
      ),

    projectId:
      normalizeTrimmedString(
        task.projectId
      ),

    projectCode:
      normalizeTrimmedString(
        task.projectCode
      ),

    serialNo:
      normalizeNumber(
        task.serialNo
      ),

    displaySrNo:
      normalizeNumber(
        task.displaySrNo,
        normalizeNumber(
          task.serialNo
        )
      ),

    ...(taskRegisterId
      ? {
          taskRegisterId,
        }
      : {}),

    description:
      normalizeTrimmedString(
        task.description
      ),

    status:
      normalizeTaskStatus(
        task.status
      ),

    completedAt:
      normalizeTrimmedString(
        task.completedAt
      ) || null,

    createdAt:
      normalizeTrimmedString(
        task.createdAt
      ),

    updatedAt:
      normalizeTrimmedString(
        task.updatedAt
      ),
  };
};

/* =========================================================
   VALIDATE TASK ID
   ========================================================= */

const validateTaskId = (
  taskId: string
): string => {
  const normalizedTaskId =
    taskId.trim();

  if (
    !normalizedTaskId
  ) {
    throw new Error(
      "Task ID is required."
    );
  }

  return normalizedTaskId;
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
    normalizedFiles.length ===
    0
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

   Content-Type manually set nahi karna.
   Browser multipart boundary khud generate karega.
   ========================================================= */

const createEvidenceFormData = (
  files: File[] | FileList
): FormData => {
  const validatedFiles =
    validateEvidenceFiles(
      files
    );

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

   GET /evidences/task/:taskId
   ========================================================= */

export const getTaskEvidences =
  async (
    taskId: string
  ): Promise<EvidenceSummary> => {
    const normalizedTaskId =
      validateTaskId(
        taskId
      );

    const response =
      await api.get(
        `/evidences/task/${encodePathValue(
          normalizedTaskId
        )}`
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
      typeof data ===
        "object" &&
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
    taskId: string,
    evidenceType:
      EvidenceType
  ): Promise<EvidenceByTypeResult> => {
    const normalizedTaskId =
      validateTaskId(
        taskId
      );

    const response =
      await api.get(
        `/evidences/task/${encodePathValue(
          normalizedTaskId
        )}/${evidenceType}`
      );

    const data =
      extractResponseData<{
        evidenceType?: unknown;
        evidences?: unknown[];
        count?: unknown;
      }>(response);

    const evidences =
      Array.isArray(
        data?.evidences
      )
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
   ========================================================= */

export const getBeforeEvidences =
  async (
    taskId: string
  ): Promise<EvidenceByTypeResult> => {
    return getEvidenceByType(
      taskId,
      "before"
    );
  };

/* =========================================================
   GET AFTER EVIDENCE
   ========================================================= */

export const getAfterEvidences =
  async (
    taskId: string
  ): Promise<EvidenceByTypeResult> => {
    return getEvidenceByType(
      taskId,
      "after"
    );
  };

/* =========================================================
   GET SINGLE EVIDENCE
   ========================================================= */

export const getEvidenceById =
  async (
    evidenceId: string
  ): Promise<Evidence> => {
    const normalizedEvidenceId =
      evidenceId.trim();

    if (
      !normalizedEvidenceId
    ) {
      throw new Error(
        "Evidence ID is required."
      );
    }

    const response =
      await api.get(
        `/evidences/${encodePathValue(
          normalizedEvidenceId
        )}`
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
      typeof data ===
        "object" &&
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

    return normalizeEvidence(
      data
    );
  };

/* =========================================================
   UPLOAD EVIDENCE
   ========================================================= */

const uploadEvidence =
  async (
    taskId: string,
    evidenceType:
      EvidenceType,
    files:
      File[] | FileList
  ): Promise<UploadEvidenceResult> => {
    const normalizedTaskId =
      validateTaskId(
        taskId
      );

    const formData =
      createEvidenceFormData(
        files
      );

    const response =
      await api.post(
        `/evidences/task/${encodePathValue(
          normalizedTaskId
        )}/${evidenceType}`,
        formData
      );

    const data =
      extractResponseData<{
        task?: unknown;

        uploadedEvidence?: unknown[];

        evidence?: unknown;
      }>(response);

    return {
      task:
        normalizeEvidenceTask(
          data?.task
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
   ========================================================= */

export const uploadBeforeEvidence =
  async (
    taskId: string,
    files:
      File[] | FileList
  ): Promise<UploadEvidenceResult> => {
    return uploadEvidence(
      taskId,
      "before",
      files
    );
  };

/* =========================================================
   UPLOAD AFTER EVIDENCE
   ========================================================= */

export const uploadAfterEvidence =
  async (
    taskId: string,
    files:
      File[] | FileList
  ): Promise<UploadEvidenceResult> => {
    return uploadEvidence(
      taskId,
      "after",
      files
    );
  };

/* =========================================================
   DELETE SINGLE EVIDENCE

   DELETE /evidences/task/:taskId/:evidenceId
   ========================================================= */

export const deleteEvidence =
  async (
    taskId: string,
    evidenceId: string
  ): Promise<DeleteEvidenceResult> => {
    const normalizedTaskId =
      validateTaskId(
        taskId
      );

    const normalizedEvidenceId =
      evidenceId.trim();

    if (
      !normalizedEvidenceId
    ) {
      throw new Error(
        "Evidence ID is required."
      );
    }

    const response =
      await api.delete(
        `/evidences/task/${encodePathValue(
          normalizedTaskId
        )}/${encodePathValue(
          normalizedEvidenceId
        )}`
      );

    const data =
      extractResponseData<{
        evidence?: unknown;

        task?: unknown;

        evidenceSummary?: unknown;

        imageFileDeleted?: unknown;
      }>(response);

    return {
      evidence:
        normalizeEvidence(
          data?.evidence
        ),

      task:
        normalizeEvidenceTask(
          data?.task
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
    taskId: string,
    evidenceType:
      EvidenceType
  ): Promise<DeleteEvidenceTypeResult> => {
    const normalizedTaskId =
      validateTaskId(
        taskId
      );

    const response =
      await api.delete(
        `/evidences/task/${encodePathValue(
          normalizedTaskId
        )}/${evidenceType}`
      );

    const data =
      extractResponseData<{
        evidenceType?: unknown;

        deletedRecords?: unknown;

        imageFilesRequested?: unknown;
        imageFilesDeleted?: unknown;

        task?: unknown;

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

      task:
        normalizeEvidenceTask(
          data?.task
        ),

      evidenceSummary:
        normalizeEvidenceSummary(
          data?.evidenceSummary
        ),
    };
  };

/* =========================================================
   DELETE ALL BEFORE EVIDENCE
   ========================================================= */

export const deleteBeforeEvidences =
  async (
    taskId: string
  ): Promise<DeleteEvidenceTypeResult> => {
    return deleteEvidenceByType(
      taskId,
      "before"
    );
  };

/* =========================================================
   DELETE ALL AFTER EVIDENCE
   ========================================================= */

export const deleteAfterEvidences =
  async (
    taskId: string
  ): Promise<DeleteEvidenceTypeResult> => {
    return deleteEvidenceByType(
      taskId,
      "after"
    );
  };

/* =========================================================
   BUILD PUBLIC IMAGE URL

   Canonical new database paths:

   /uploads/tasks/before/image.jpg
   /uploads/tasks/after/image.jpg

   Existing legacy image paths are still rendered so old
   Evidence records do not lose their images.
   ========================================================= */

export const getEvidenceImageUrl = (
  imagePath: string
): string => {
  const normalizedPath =
    imagePath.trim();

  if (
    !normalizedPath
  ) {
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