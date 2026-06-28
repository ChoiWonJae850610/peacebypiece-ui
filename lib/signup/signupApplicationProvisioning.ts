import type {
  SignupApplicationProvisionedIds,
  SignupApplicationRecord,
} from "./signupApplicationTypes";

export type SignupApprovalProvisioningInput = {
  application: SignupApplicationRecord;
  approvedBySystemUserId: string;
  approvedAt: Date;
};

export type SignupApprovalProvisioningResult = {
  provisionedIds: SignupApplicationProvisionedIds;
  trial: {
    startedAt: Date;
    endsAt: Date;
    storageLimitBytes: number;
    memberLimit: number;
  };
};

export type SignupApprovalProvisioningPort = {
  provisionApprovedSignup(
    input: SignupApprovalProvisioningInput,
  ): Promise<SignupApprovalProvisioningResult>;
};
