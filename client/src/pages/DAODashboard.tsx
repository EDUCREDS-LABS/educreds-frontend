import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import ProposalCard, { Proposal } from "@/components/ProposalCard";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";

export default function DAODashboard() {
    const [proposals, setProposals] = useState<Proposal[]>([]);

    // We can use useQuery nicely here, but for the mock 'POST' generation we'll use a manual fetch for now to simulate the "Apply" action
    // In a real app, we would fetch the list from GET /governance/proposals

    const fetchProposals = async () => {
        // TODO: Replace with actual GET endpoint when available (Mock service has getAllProposals but we'll focus on the generation flow first)
        // For now, we will just use local state populated by the "Simulate" button
        return [];
    };

    const createProposalMutation = useMutation({
        mutationFn: async () => {
            // Use the environment variable for the backend URL, defaulting to localhost:3001
            const baseUrl = import.meta.env.VITE_CERT_API_BASE || 'http://localhost:3001';
            const res = await fetch(`${baseUrl}/governance/proposal`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    institution_name: `University of ${Math.floor(Math.random() * 1000)}`,
                    domain: "example.edu",
                    wallet_address: "0x123..."
                }),
            });
            if (!res.ok) throw new Error("Failed to create proposal");
            return await res.json();
        },
        onSuccess: (newProposal: Proposal) => {
            setProposals((prev) => [newProposal, ...prev]);
        },
    });

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">EduCreds Governance</h1>
                    <p className="text-muted-foreground mt-2">
                        AI-Assisted DAO for Institution Admission & Monitoring
                    </p>
                </div>
                <Button
                    onClick={() => createProposalMutation.mutate()}
                    disabled={createProposalMutation.isPending}
                >
                    {createProposalMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Plus className="mr-2 h-4 w-4" />
                    )}
                    Simulate New Application
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {proposals.length === 0 && !createProposalMutation.isPending && (
                    <div className="col-span-full text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        No active proposals. Click "Simulate New Application" to test Quack AI.
                    </div>
                )}

                {proposals.map((proposal) => (
                    <ProposalCard
                        key={proposal.proposal_id}
                        proposal={proposal}
                        onApprove={(id) => console.log('Approved', id)}
                        onReject={(id) => console.log('Rejected', id)}
                    />
                ))}
            </div>
        </div>
    );
}
