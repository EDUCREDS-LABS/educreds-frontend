import BatchOperationsPage from "@/modules/workspace/BatchOperationsPage";

/**
 * Bulk Issuance — /institution/bulk-issue
 * Delegates to the BatchOperationsPage module (CSV upload, batch credential issuance).
 */
export default function BulkIssuePage() {
  return <BatchOperationsPage />;
}
