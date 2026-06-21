# 0.23.98 Simulator operational fixture, filters, and statistics

## Problem
The simulator created many partner and workorder rows, but it did not create the relation rows consumed by the product UI and statistics queries. All partners were generic, workorders had no category/vendor/order rows, and storage statistics only read attachment metadata. The workorder select controls also changed React state without reloading the DB summary endpoint.

## Changes
- Create company item categories and outsourcing processes.
- Classify partners through `partner_items` as factory, fabric, subsidiary, and outsourcing vendors.
- Add representative factory order rows and category/vendor/date diversity to workorders.
- Use the latest storage snapshot as a simulator fallback when no real R2 attachment metadata exists.
- Persist status/sort controls in the URL and reload DB summary rows when the selection changes.

## R2 note
R2 does not require pre-created folders. Object keys implicitly form prefixes. Attachment upload failures must be diagnosed from the upload API response, environment adapter, signed URL, object key, and metadata completion path. This patch does not create fake R2 objects or claim to fix an upload error without its API failure log.
