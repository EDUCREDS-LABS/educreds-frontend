/**
 * Document transformation utilities for EduCreds
 * 
 * The frontend uses rich document objects with metadata for UI display,
 * but the backend expects only IPFS URLs as strings for storage efficiency.
 */

export interface DocumentWithMetadata {
  type: string;
  description: string;
  url: string;
  originalName: string;
}

/**
 * Transform documents from frontend format (objects) to backend format (URLs only)
 * @param documents Array of document objects or URLs
 * @returns Array of IPFS URLs
 */
export function transformDocumentsForBackend(
  documents: (DocumentWithMetadata | string)[]
): string[] {
  return documents.map(doc => 
    typeof doc === 'string' ? doc : doc.url
  );
}

/**
 * Transform documents from backend format (URLs) to frontend format (objects)
 * @param urls Array of IPFS URLs
 * @returns Array of document objects with minimal metadata
 */
export function transformDocumentsFromBackend(urls: string[]): DocumentWithMetadata[] {
  return urls.map((url, index) => ({
    type: 'Document',
    description: `Document ${index + 1}`,
    url,
    originalName: `document-${index + 1}.pdf`
  }));
}

/**
 * Validate that all documents have valid IPFS URLs
 * @param documents Array of document objects
 * @returns boolean indicating if all documents are valid
 */
export function validateDocuments(documents: DocumentWithMetadata[]): boolean {
  return documents.every(doc => 
    doc.url && 
    doc.url.startsWith('Qm') && 
    doc.url.length >= 46 // Minimum IPFS hash length
  );
}

/**
 * Extract document types from a collection of documents
 * @param documents Array of document objects
 * @returns Array of unique document types
 */
export function getDocumentTypes(documents: DocumentWithMetadata[]): string[] {
  const types = documents.map(doc => doc.type);
  return [...new Set(types)];
}