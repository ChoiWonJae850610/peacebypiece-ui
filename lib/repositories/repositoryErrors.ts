export type RepositoryOperation = "initialize" | "persist" | "save_workorders";

export type WorkOrderRepositoryError = {
  operation: RepositoryOperation;
  message: string;
  retryable: boolean;
  occurredAt: string;
};

export function createRepositoryError(operation: RepositoryOperation, error: unknown, fallbackMessage: string): WorkOrderRepositoryError {
  return {
    operation,
    message: error instanceof Error ? error.message : fallbackMessage,
    retryable: true,
    occurredAt: new Date().toISOString(),
  };
}
