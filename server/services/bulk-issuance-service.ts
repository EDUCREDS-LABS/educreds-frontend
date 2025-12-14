import { db } from '../lib/db';
import { bulkJobs, bulkJobItems } from '../../shared/schema/bulk';
import { templates, templateVariants, issuedCertificates } from '../../shared/schema/templates';
import { TemplateService } from './template-service';
import crypto from 'crypto';

type CsvRecord = Record<string, string>;

function parseCsv(csvText: string): { headers: string[]; rows: string[][] } {
	const lines = csvText.trim().split(/\r?\n/);
	if (lines.length === 0) return { headers: [], rows: [] };
	const headers = lines[0].split(',').map(h => h.trim());
	const rows: string[][] = [];
	for (let i = 1; i < lines.length; i++) {
		if (!lines[i].trim()) continue;
		// naive split; assumes no commas in fields
		rows.push(lines[i].split(',').map(c => c.trim()));
	}
	return { headers, rows };
}

function validateHeaders(required: string[], provided: string[]): { ok: boolean; missing: string[] } {
	const missing = required.filter(r => !provided.includes(r));
	return { ok: missing.length === 0, missing };
}

export class BulkIssuanceService {
	static async createJob(institutionId: string, templateId: string, variantId: string | null) {
		const [job] = await db.insert(bulkJobs).values({
			institutionId,
			templateId,
			variantId: variantId || undefined,
			status: 'pending',
			total: 0,
			processed: 0,
			success: 0,
			failure: 0,
			errors: []
		}).returning();
		return job;
	}

	static async addItemsFromCsv(jobId: string, templateId: string, csvText: string) {
		const template = await TemplateService.getTemplateById(templateId);
		if (!template) throw new Error('Template not found');
		const requiredFields = template.metadata.fields.filter(f => f.required).map(f => f.name);
		const { headers, rows } = parseCsv(csvText);
		const check = validateHeaders(requiredFields, headers);
		if (!check.ok) {
			throw new Error(`CSV missing required fields: ${check.missing.join(', ')}`);
		}
		let count = 0;
		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			const record: CsvRecord = {};
			headers.forEach((h, idx) => { record[h] = row[idx] ?? ''; });
			await db.insert(bulkJobItems).values({
				jobId,
				rowIndex: i,
				data: record,
				status: 'pending'
			});
			count++;
		}
		await db.update(bulkJobs).set({ total: count }).where({ id: jobId });
	}

	static async processJob(jobId: string) {
		const [job] = await db.select().from(bulkJobs).where({ id: jobId });
		if (!job) throw new Error('Job not found');
		if (job.status === 'completed' || job.status === 'processing') return;
		await db.update(bulkJobs).set({ status: 'processing' }).where({ id: jobId });

		const items = await db.select().from(bulkJobItems).where({ jobId });
		const templateId = job.templateId as string;
		const variantId = job.variantId as string | undefined;

		// Create a simple zip structure (simplified for now)
		const zipFiles: { [key: string]: Buffer } = {};

		for (const item of items) {
			try {
				// Build certificate data
				const certificateId = Math.random().toString(36).substr(2, 9);
				const data: any = {
					...item.data,
					certificateId,
					issueDate: item.data.issueDate || new Date().toISOString().slice(0,10)
				};
				const svg = await TemplateService.renderCertificate(templateId, variantId || null, data);
				const svgBuffer = Buffer.from(svg, 'utf-8');
				const hash = crypto.createHash('sha256').update(svgBuffer).digest('hex');
				// Simulate anchoring on chain (replace with real tx later)
				const txHash = '0x' + crypto.randomBytes(32).toString('hex');

				// Save issued certificate record
				const [cert] = await db.insert(issuedCertificates).values({
					templateId,
					variantId: variantId || undefined,
					institutionId: job.institutionId,
					data,
					certificateHash: hash,
					blockchainTxHash: txHash,
					issuedAt: new Date(),
					status: 'issued'
				}).returning();

				// Put into zip files
				const fileName = `${data.studentName?.replace(/\s+/g, '_') || 'certificate'}_${certificateId}.svg`;
				zipFiles[fileName] = svgBuffer;

				await db.update(bulkJobItems).set({ status: 'success', certId: cert.id, txHash, hash }).where({ id: item.id });
				const processed = job.processed + 1;
				await db.update(bulkJobs).set({ processed, success: job.success + 1 }).where({ id: jobId });
				job.processed = processed; job.success = job.success + 1;
			} catch (err: any) {
				const errorMessage = err?.message || 'Processing error';
				await db.update(bulkJobItems).set({ status: 'failed', error: errorMessage }).where({ id: item.id });
				const processed = job.processed + 1;
				await db.update(bulkJobs).set({ processed, failure: job.failure + 1, errors: [...job.errors, { row: item.rowIndex, error: errorMessage }] }).where({ id: jobId });
				job.processed = processed; job.failure = job.failure + 1; job.errors = [...job.errors, { row: item.rowIndex, error: errorMessage }];
			}
		}

		// Finalize zip and store as data URL (simplified for now)
		// In a real implementation, you would create an actual ZIP file
		const zipUrl = `data:application/zip;base64,${Buffer.from(JSON.stringify(zipFiles)).toString('base64')}`;
		await db.update(bulkJobs).set({ status: 'completed', zipUrl }).where({ id: jobId });
	}

	static async getStatus(jobId: string) {
		const [job] = await db.select().from(bulkJobs).where({ id: jobId });
		if (!job) throw new Error('Job not found');
		const progress = job.total > 0 ? Math.round((job.processed / job.total) * 100) : 0;
		return { id: job.id, status: job.status, total: job.total, processed: job.processed, success: job.success, failure: job.failure, errors: job.errors, progress, zipReady: !!job.zipUrl };
	}

	static async getZip(jobId: string) {
		const [job] = await db.select().from(bulkJobs).where({ id: jobId });
		if (!job || !job.zipUrl) throw new Error('ZIP not ready');
		return job.zipUrl as string;
	}
}

// Simple in-memory queue to process jobs asynchronously
const pendingJobs = new Set<string>();

export async function enqueueBulkJob(jobId: string) {
	if (pendingJobs.has(jobId)) return;
	pendingJobs.add(jobId);
	setTimeout(async () => {
		try {
			await BulkIssuanceService.processJob(jobId);
		} finally {
			pendingJobs.delete(jobId);
		}
	}, 10);
}
