import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShieldCheck, ShieldAlert, CheckCircle } from "lucide-react";

export interface Proposal {
    proposal_id: string;
    legitimacy_score: number;
    risk_flags: string[];
    recommended_action: 'approve' | 'approve_with_limits' | 'reject' | 'audit';
    suggested_issuance_limit: number;
    notes: string;
    institution_name: string;
    created_at: string;
}

interface ProposalCardProps {
    proposal: Proposal;
    onApprove?: (id: string) => void;
    onReject?: (id: string) => void;
}

export default function ProposalCard({ proposal, onApprove, onReject }: ProposalCardProps) {
    const getScoreColor = (score: number) => {
        if (score >= 85) return "bg-green-500 hover:bg-green-600";
        if (score >= 70) return "bg-yellow-500 hover:bg-yellow-600";
        return "bg-red-500 hover:bg-red-600";
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'approve':
                return <Badge variant="default" className="bg-green-600">Recommended: Approve</Badge>;
            case 'approve_with_limits':
                return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Recommended: Approve w/ Limits</Badge>;
            case 'reject':
                return <Badge variant="destructive">Recommended: Reject</Badge>;
            default:
                return <Badge variant="outline">Recommended: Audit</Badge>;
        }
    };

    return (
        <Card className="w-full mb-4 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-col">
                    <CardTitle className="text-xl font-bold">{proposal.institution_name}</CardTitle>
                    <span className="text-xs text-muted-foreground">ID: {proposal.proposal_id}</span>
                </div>
                <div className={`flex items-center justify-center h-12 w-12 rounded-full text-white font-bold text-lg ${getScoreColor(proposal.legitimacy_score)}`}>
                    {proposal.legitimacy_score}
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Quack AI Verdict:</span>
                        {getActionBadge(proposal.recommended_action)}
                    </div>

                    <div className="text-sm text-gray-500">
                        <strong>Notes:</strong> {proposal.notes}
                    </div>

                    {proposal.risk_flags.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <div className="flex items-center gap-2 mb-2 text-red-800 font-semibold text-sm">
                                <AlertTriangle className="h-4 w-4" />
                                Risk Warnings
                            </div>
                            <ul className="list-disc list-inside text-sm text-red-700">
                                {proposal.risk_flags.map((flag, idx) => (
                                    <li key={idx}>{flag}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {proposal.suggested_issuance_limit > 0 && (
                        <div className="text-sm">
                            <strong>Suggested Limit:</strong> {proposal.suggested_issuance_limit} Credentials/Month
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onReject && onReject(proposal.proposal_id)}>Reject</Button>
                <Button onClick={() => onApprove && onApprove(proposal.proposal_id)}>Execute Proposal</Button>
            </CardFooter>
        </Card>
    );
}
