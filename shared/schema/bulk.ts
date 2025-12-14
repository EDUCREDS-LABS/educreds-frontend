// Bulk issuance job schemas (mock tables for development)

export const bulkJobs = {
	tableName: 'bulk_jobs',
	id: { primaryKey: true, defaultRandom: () => Math.random().toString(36).substr(2, 9) },
	institutionId: { notNull: true },
	templateId: { notNull: true },
	variantId: {},
	status: { notNull: true, default: 'pending' }, // pending | processing | completed | failed
	total: { notNull: true, default: 0 },
	processed: { notNull: true, default: 0 },
	success: { notNull: true, default: 0 },
	failure: { notNull: true, default: 0 },
	errors: { notNull: true, default: [] as Array<{ row: number; error: string }> },
	zipUrl: {},
	createdAt: { defaultNow: () => new Date() },
	updatedAt: { defaultNow: () => new Date() }
};

export const bulkJobItems = {
	tableName: 'bulk_job_items',
	id: { primaryKey: true, defaultRandom: () => Math.random().toString(36).substr(2, 9) },
	jobId: { notNull: true },
	rowIndex: { notNull: true },
	data: { notNull: true },
	status: { notNull: true, default: 'pending' }, // pending | success | failed
	certId: {},
	txHash: {},
	fileUrl: {},
	hash: {},
	error: {},
	createdAt: { defaultNow: () => new Date() },
	updatedAt: { defaultNow: () => new Date() }
};


