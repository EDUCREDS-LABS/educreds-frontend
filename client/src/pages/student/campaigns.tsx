/**
 * Student Campaigns Page — ERS campaign browser.
 *
 * ⚠️  MOCK DATA — backend campaigns API not yet implemented on this branch.
 *     Replace MOCK_CAMPAIGNS with a real API call when the endpoint is ready.
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthType } from "@/lib/dualAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target, ChevronRight, ChevronDown, CheckCircle2, Clock, AlertTriangle,
} from "lucide-react";

// ─── Mock campaign data ────────────────────────────────────────────────────────
// TODO: replace with real API call: GET /api/ers/campaigns
// when the backend endpoint is available on this branch.

interface CampaignTask {
  id: string;
  title: string;
  ers: number;
  completed: boolean;
}

interface Campaign {
  id: string;
  title: string;
  section: string;
  description: string;
  totalTasks: number;
  completedTasks: number;
  totalERS: number;
  earnedERS: number;
  category: string;
  categoryColor: string;
  status: "active" | "ended" | "upcoming";
  endsAt: string;
  tasks: CampaignTask[];
}

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "learn-section-q4-2026",
    title: "Learn It — Q4 2026",
    section: "§2 Learn",
    description:
      "Complete 4 lessons covering blockchain fundamentals, credential standards, and digital identity.",
    totalTasks: 4,
    completedTasks: 0,
    totalERS: 200,
    earnedERS: 0,
    category: "Education",
    categoryColor: "text-green-500",
    status: "active",
    endsAt: "2026-12-31",
    tasks: [
      { id: "learn-1", title: "Blockchain Fundamentals", ers: 50, completed: false },
      { id: "learn-2", title: "W3C Credential Standards", ers: 50, completed: false },
      { id: "learn-3", title: "Digital Identity 101", ers: 50, completed: false },
      { id: "learn-4", title: "Privacy-Preserving Tech", ers: 50, completed: false },
    ],
  },
  {
    id: "blockchain-quest-q4-2026",
    title: "Blockchain Quest — Q4 2026",
    section: "§3 Blockchain Quest",
    description:
      "Complete on-chain tasks: mint your SBT, verify a credential transaction, and attest to your identity.",
    totalTasks: 3,
    completedTasks: 0,
    totalERS: 290,
    earnedERS: 0,
    category: "On-Chain",
    categoryColor: "text-purple-500",
    status: "active",
    endsAt: "2026-12-31",
    tasks: [
      { id: "onchain-1", title: "Mint Your Credential SBT", ers: 100, completed: false },
      { id: "onchain-2", title: "Verify a Credential On-Chain", ers: 90, completed: false },
      { id: "onchain-3", title: "Attest to Your Identity", ers: 100, completed: false },
    ],
  },
  {
    id: "campus-impact-q4-2026",
    title: "Campus Impact",
    section: "§4 Campus Impact",
    description:
      "Refer fellow students and campus clubs to EduCreds. Earn tiered rewards as they verify their identities.",
    totalTasks: 3,
    completedTasks: 0,
    totalERS: 1000,
    earnedERS: 0,
    category: "Community",
    categoryColor: "text-blue-500",
    status: "active",
    endsAt: "2026-12-31",
    tasks: [
      { id: "refer-1", title: "Refer 1 student (verifies within 7 days)", ers: 100, completed: false },
      { id: "refer-2", title: "Refer 5 students", ers: 500, completed: false },
      { id: "refer-3", title: "Refer a campus club or society", ers: 400, completed: false },
    ],
  },
];

const CATEGORIES = ["All", "Education", "On-Chain", "Community"];

// ─── Campaign card ─────────────────────────────────────────────────────────────

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const [expanded, setExpanded] = useState(false);
  const progressPct =
    campaign.totalTasks > 0
      ? Math.round((campaign.completedTasks / campaign.totalTasks) * 100)
      : 0;

  return (
    <Card className="border border-neutral-200 dark:border-neutral-800 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="space-y-0.5">
            <p className="text-xs text-neutral-400 font-medium">{campaign.section}</p>
            <CardTitle className="text-base">{campaign.title}</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={
              campaign.status === "active"
                ? "border-green-300 text-green-600 bg-green-50 dark:bg-green-950"
                : "border-neutral-300 text-neutral-500"
            }
          >
            {campaign.status}
          </Badge>
        </div>

        <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
          <span className={campaign.categoryColor + " font-medium"}>{campaign.category}</span>
          <span>•</span>
          <span>{campaign.totalERS.toLocaleString()} ERS available</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Clock className="size-3" />
            <span>Ends {campaign.endsAt}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{campaign.description}</p>

        {/* Progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-neutral-500">
            <span>{campaign.completedTasks}/{campaign.totalTasks} tasks</span>
            <span>{campaign.earnedERS}/{campaign.totalERS} ERS earned</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        {/* Expand button */}
        <Button
          variant="outline"
          size="sm"
          className="text-xs gap-1"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <>
              Hide Tasks <ChevronDown className="size-3" />
            </>
          ) : (
            <>
              View Tasks <ChevronRight className="size-3" />
            </>
          )}
        </Button>

        {/* Accordion task list */}
        {expanded && (
          <div className="border rounded-lg divide-y divide-neutral-100 dark:divide-neutral-800 mt-2">
            {campaign.tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between px-4 py-3 gap-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {task.completed ? (
                    <CheckCircle2 className="size-4 text-green-500 shrink-0" />
                  ) : (
                    <div className="size-4 rounded-full border-2 border-neutral-300 shrink-0" />
                  )}
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-amber-600">+{task.ers} ERS</span>
                  <Badge variant="secondary" className="text-xs px-2 py-0">
                    Coming Soon
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StudentCampaignsPage() {
  const { user, isLoading: authLoading, authType } = useAuth();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");

  // Auth guard — same pattern as activity.tsx
  useEffect(() => {
    if (authLoading) return;
    if (!user || authType !== AuthType.STUDENT) {
      navigate("/student/login", { replace: true });
    }
  }, [authLoading, user, authType, navigate]);

  if (authLoading || !user) return null;

  const filtered =
    activeCategory === "All"
      ? MOCK_CAMPAIGNS
      : MOCK_CAMPAIGNS.filter((c) => c.category === activeCategory);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Target className="size-5 text-neutral-500" />
          <span className="text-sm text-neutral-500 font-medium">ERS Campaigns</span>
          <Badge
            variant="outline"
            className="border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950 gap-1 ml-1"
          >
            <AlertTriangle className="size-3" />
            Mock Data
          </Badge>
        </div>
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Participate to earn ERS points and boost your Reputation Score.
        </p>
      </div>

      {/* Category filter */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList>
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat} value={cat}>
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Campaign cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <Target className="size-12 mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium mb-1">No campaigns in this category</p>
          <p className="text-sm">Check back later for new campaigns.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
