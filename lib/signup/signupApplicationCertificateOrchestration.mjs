export function summarizeSignupApplicationCertificateRecord(file) {
  if (!file) return null;
  return {
    id: file.id,
    applicationId: file.applicationId,
    fileType: file.fileType,
    originalName: file.originalName,
    mimeType: file.mimeType,
    sizeBytes: file.sizeBytes,
    uploadedAt: file.uploadedAt,
    reviewedAt: file.reviewedAt,
    approvedCompanyFileId: file.approvedCompanyFileId,
  };
}

export async function orchestrateSignupApplicationCertificateUpload(input) {
  const storageKey = input.buildStorageKey({
    applicationId: input.applicationId,
    fileId: input.fileId,
    extension: input.parsed.extension,
  });
  if (!input.isStorageKey({ storageKey, applicationId: input.applicationId, fileId: input.fileId })) {
    throw input.createError("uploadFailed", 500);
  }

  try {
    await input.storageAdapter.upload({
      storageKey,
      mimeType: input.parsed.mimeType,
      bytes: input.parsed.bytes,
    });
  } catch {
    throw input.createError("uploadFailed", 502);
  }

  try {
    const result = await input.repository.createActiveOwnedCertificate({
      id: input.fileId,
      applicationId: input.applicationId,
      owner: input.owner,
      originalName: input.parsed.originalName,
      storageKey,
      mimeType: input.parsed.mimeType,
      sizeBytes: input.parsed.sizeBytes,
    });

    input.deleteCachedUrl(storageKey);
    await input.cleanupInactiveObjects({
      adapter: input.storageAdapter,
      applicationId: input.applicationId,
      files: result.replacedFiles,
    });
    const summarized = summarizeSignupApplicationCertificateRecord(result.file);
    if (!summarized) throw input.createError("metadataSaveFailed", 500);
    return summarized;
  } catch (error) {
    await input.deleteUploadedObjectQuietly({
      adapter: input.storageAdapter,
      storageKey,
      reason: "metadata-save-failed",
    });
    throw error;
  }
}

export async function orchestrateSignupApplicationCertificateDelete(input) {
  const current = await input.repository.findActiveOwnedCertificate({
    applicationId: input.applicationId,
    owner: input.owner,
  });
  if (!current) return null;
  if (input.fileId && input.fileId !== current.id) {
    throw input.createError("fileNotFound", 404);
  }

  const deleted = await input.repository.deleteActiveOwnedCertificate({
    applicationId: input.applicationId,
    owner: input.owner,
    fileId: current.id,
  });

  if (!deleted) return null;
  input.deleteCachedUrl(current.storageKey);

  if (!input.storageConfigured) {
    input.logCleanupPending({
      operation: "delete",
      hasStorageKey: Boolean(current.storageKey),
      reason: "delete-not-configured",
      cleanupBacklog: "0.24.28",
    });
    return null;
  }

  if (
    !input.isStorageKey({
      storageKey: current.storageKey,
      applicationId: input.applicationId,
      fileId: current.id,
    })
    || !input.isStorageKeyConsistentWithMime({
      storageKey: current.storageKey,
      mimeType: current.mimeType,
    })
  ) {
    input.logCleanupPending({
      operation: "delete",
      hasStorageKey: Boolean(current.storageKey),
      reason: "invalid-delete-key",
      cleanupBacklog: "0.24.28",
    });
    return null;
  }

  await input.deleteUploadedObjectQuietly({
    adapter: input.storageAdapter,
    storageKey: current.storageKey,
    reason: "delete-after-metadata-revoke",
  });
  return null;
}
