# Work order factory instruction foundation 0.22.96

## Scope

This version adds the storage and API foundation for one official factory instruction document per work order.

## Product rules

- It is not a conversation memo.
- There are no replies, author ownership controls, or per-message delete rules.
- Empty content means that the work order has no factory instruction.
- The internal updater id is retained only for audit and is not presented as an author.
- Members can edit in draft or rejected state when they have workorder.update permission.
- Company administrators can edit before material-order pending state.
- The instruction can later be included in the factory PDF.

## Shared structure

- `WorkOrderFactoryInstruction` is the common data contract.
- `getWorkOrderFactoryInstructionEditPolicy` is the common workflow lock policy.
- The API client is prepared for the WAFL document editor UI in the next version.
