/**
 * Institution Billing — Invoices
 * Lists invoices from the API: date, amount, status (paid/pending/overdue), PDF download.
 * Shows "—" if data is unavailable.
 */

import { useQuery } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { Download, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// ── Types ─────────────────────────────────────────────────────────────────────

type InvoiceStatus = "paid" | "pending" | "overdue";

interface Invoice {
  id: string;
  number?: string;
  date?: string;
  created?: number; // unix timestamp from Stripe
  amount?: number;
  total?: number;
  currency?: string;
  status?: string;
  pdfUrl?: string;
  invoice_pdf?: string; // Stripe field
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  paid:    { label: "Paid",    cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  pending: { label: "Pending", cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  overdue: { label: "Overdue", cls: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  open:    { label: "Open",    cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  void:    { label: "Void",    cls: "bg-neutral-100 text-neutral-500" },
  draft:   { label: "Draft",   cls: "bg-neutral-100 text-neutral-500" },
};

function formatCurrency(amount: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function getInvoiceDate(inv: Invoice): string {
  if (inv.date) return format(new Date(inv.date), "MMM d, yyyy");
  if (inv.created) return format(new Date(inv.created * 1000), "MMM d, yyyy");
  return "—";
}

function getInvoiceAmount(inv: Invoice): string {
  const amount = inv.amount ?? inv.total;
  if (amount == null) return "—";
  return formatCurrency(amount, inv.currency ?? "usd");
}

function getInvoicePdf(inv: Invoice): string | undefined {
  return inv.pdfUrl ?? inv.invoice_pdf;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["institution-invoices"],
    queryFn: () => api.listCommercialInvoices("institution"),
    retry: 1,
  });

  const invoices: Invoice[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.invoices)
      ? (data as any).invoices
      : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-blue-100 dark:bg-blue-950/40 rounded-2xl">
          <FileText className="size-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">Invoices</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Download PDF invoices for your subscription payments.</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50 dark:bg-neutral-900/60 hover:bg-neutral-50">
              <TableHead className="font-black text-xs uppercase tracking-wider">Invoice</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider">Date</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider">Amount</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider">Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>
                {Array.from({ length: 5 }).map((__, j) => (
                  <TableCell key={j}><Skeleton className="h-4 w-24 rounded" /></TableCell>
                ))}
              </TableRow>
            ))}
            {isError && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-neutral-400 text-sm">
                  Unable to load invoices — API unavailable.
                </TableCell>
              </TableRow>
            )}
            {!isLoading && !isError && invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-neutral-400 text-sm">
                  No invoices yet.
                </TableCell>
              </TableRow>
            )}
            {invoices.map((inv) => {
              const statusKey = inv.status ?? "pending";
              const cfg = STATUS_CFG[statusKey] ?? STATUS_CFG.pending;
              const pdfUrl = getInvoicePdf(inv);
              return (
                <TableRow key={inv.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/40">
                  <TableCell className="font-mono text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    {inv.number ?? `INV-${inv.id.slice(0, 8).toUpperCase()}`}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-600 dark:text-neutral-400">
                    {getInvoiceDate(inv)}
                  </TableCell>
                  <TableCell className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    {getInvoiceAmount(inv)}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs font-bold border-0 rounded-lg", cfg.cls)}>
                      {cfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {pdfUrl ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="gap-1.5 rounded-lg font-semibold text-neutral-600 hover:text-neutral-900"
                      >
                        <a href={pdfUrl} target="_blank" rel="noreferrer">
                          <Download className="size-3.5" />
                          PDF
                        </a>
                      </Button>
                    ) : (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
