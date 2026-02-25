import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { getScoreRangeColor, formatPercentage, SCORE_RANGE_COLORS } from '@/lib/transparency-tokens';
import type { PoICScoreDetailResponse } from '@/lib/governanceApiService';

interface PoICSectionProps {
  poicScore: PoICScoreDetailResponse;
}

export function PoICScoreSection({ poicScore }: PoICSectionProps) {
  const scoreColor = getScoreRangeColor(poicScore.value);
  const components = poicScore.components || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Proof of Institution Credibility (PoIC) Score
        </CardTitle>
        <CardDescription>
          Comprehensive credibility assessment based on multiple factors
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Score Display */}
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Overall Score
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold">{poicScore.value}</span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
            </div>
            <Badge className={`${scoreColor.bg} text-base font-semibold`}>
              {scoreColor.label}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full transition-all duration-500 ${scoreColor.bg.replace('bg-', 'bg-')}`}
                style={{
                  width: `${Math.min(poicScore.value, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Assessment Quality: {formatPercentage(poicScore.value)}
            </p>
          </div>
        </div>

        {/* Component Breakdown */}
        {Object.keys(components).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Score Components</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {Object.entries(components).map(([key, value]) => {
                if (typeof value !== 'number') return null;
                const componentColor = getScoreRangeColor(value);
                const displayName = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (str) => str.toUpperCase())
                  .trim();

                return (
                  <div key={key} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        {displayName}
                      </span>
                      <span className="font-semibold">{value.toFixed(1)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full transition-all ${componentColor.bg}`}
                        style={{ width: `${Math.min(value, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Methodology */}
        {poicScore.methodology && (
          <Collapsible>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold hover:text-primary">
              <ChevronDown className="h-4 w-4 transition-transform" />
              Methodology
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <pre className="overflow-auto text-xs text-muted-foreground">
                {poicScore.methodology}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
