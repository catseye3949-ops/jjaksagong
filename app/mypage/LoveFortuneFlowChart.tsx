"use client";

import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  LOVE_FLOW_SCORE_MAX,
  type LoveFlowPoint,
} from "@/lib/buildLoveFortuneFlowPoints";

export type { LoveFlowPoint } from "@/lib/buildLoveFortuneFlowPoints";

export type SelectedMonthKey = { year: number; month: number };

function scoreHeadline(score: number): string {
  if (score <= 2) return "연애운 보통";
  if (score <= 5) return "연애운 좋음";
  return "연애운 매우 좋음";
}

function scoreBody(score: number): string {
  if (score <= 2) {
    return "큰 흐름보다는 자연스러운 관계 유지에 가까운 시기입니다.";
  }
  if (score <= 5) {
    return "관계 기회가 늘어날 수 있는 흐름입니다.";
  }
  return "연애운이 비교적 강하게 들어올 수 있는 시기로 볼 수 있습니다.";
}

function defaultSelectedMonth(points: LoveFlowPoint[]): SelectedMonthKey | null {
  if (points.length === 0) return null;
  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth() + 1;
  const hit = points.find((p) => p.year === cy && p.month === cm);
  if (hit) return { year: hit.year, month: hit.month };
  const first = points[0]!;
  return { year: first.year, month: first.month };
}

function findPoint(points: LoveFlowPoint[], key: SelectedMonthKey | null): LoveFlowPoint | null {
  if (!key) return null;
  return points.find((p) => p.year === key.year && p.month === key.month) ?? null;
}

const CHART_W = 900;
const CHART_H = 220;
const PAD_L = 40;
const PAD_R = 16;
const PAD_T = 20;
const PAD_B = 44;

const DETAIL_MIN_H = "min-h-[168px]";

export function LoveFortuneFlowChart({
  points,
  allZero,
}: {
  points: LoveFlowPoint[];
  allZero: boolean;
}) {
  const gid = useId();
  const [hoverMonth, setHoverMonth] = useState<SelectedMonthKey | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<SelectedMonthKey | null>(() =>
    defaultSelectedMonth(points),
  );

  useEffect(() => {
    setSelectedMonth(defaultSelectedMonth(points));
    setHoverMonth(null);
  }, [points]);

  const fallbackMonth = useMemo(() => defaultSelectedMonth(points), [points]);
  const displayMonth = hoverMonth ?? selectedMonth ?? fallbackMonth;

  const active = useMemo(() => findPoint(points, displayMonth), [points, displayMonth]);

  const plotW = CHART_W - PAD_L - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;
  const n = points.length;
  const yMax = LOVE_FLOW_SCORE_MAX;
  const xAt = useCallback(
    (i: number) => PAD_L + (n <= 1 ? plotW / 2 : (plotW * i) / (n - 1)),
    [n, plotW],
  );
  const yAt = useCallback(
    (score: number) => PAD_T + plotH - (score / yMax) * plotH,
    [plotH, yMax],
  );

  const polylinePoints = useMemo(
    () => points.map((p, i) => `${xAt(i)},${yAt(p.score)}`).join(" "),
    [points, xAt, yAt],
  );

  const yTicks = [9, 6, 3, 0];

  const clearHover = useCallback(() => {
    setHoverMonth(null);
  }, []);

  return (
    <div className="mt-5 flex min-h-0 flex-col gap-4 pb-2">
      {allZero ? (
        <p className="text-xs leading-relaxed text-white/50">
          지금 보시는 구간에서는 그래프가 전체적으로 낮게 나타납니다. 참고용으로만 가볍게
          보시면 됩니다.
        </p>
      ) : null}

      <div
        className="flex min-h-0 flex-col gap-4"
        onPointerLeave={clearHover}
      >
        <div className="relative -mx-1 min-h-0 overflow-x-auto sm:mx-0 sm:overflow-x-visible">
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="block h-[200px] w-[900px] max-w-full shrink-0 text-fuchsia-200 sm:h-[220px] sm:w-full"
            role="img"
            aria-label="앞으로 60개월 연애운 흐름 꺾은선 그래프"
          >
            <defs>
              <linearGradient id={`${gid}-stroke`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgb(244, 114, 182)" stopOpacity="0.95" />
                <stop offset="55%" stopColor="rgb(217, 70, 239)" stopOpacity="0.95" />
                <stop offset="100%" stopColor="rgb(167, 139, 250)" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {yTicks.map((tick) => {
              const yy = yAt(tick);
              return (
                <g key={tick}>
                  <line
                    x1={PAD_L}
                    y1={yy}
                    x2={CHART_W - PAD_R}
                    y2={yy}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={1}
                  />
                  <text
                    x={PAD_L - 8}
                    y={yy + 4}
                    textAnchor="end"
                    className="fill-white/40 text-[10px] font-medium"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            <polyline
              fill="none"
              stroke={`url(#${gid}-stroke)`}
              strokeWidth={2.25}
              strokeLinejoin="round"
              strokeLinecap="round"
              points={polylinePoints}
            />

            {points.map((p, i) => {
              const cx = xAt(i);
              const cy = yAt(p.score);
              const isDisplayed =
                displayMonth !== null &&
                p.year === displayMonth.year &&
                p.month === displayMonth.month;
              return (
                <g key={`${p.year}-${p.month}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={14}
                    fill="transparent"
                    className="cursor-pointer touch-manipulation"
                    onPointerEnter={() => {
                      setHoverMonth({ year: p.year, month: p.month });
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMonth({ year: p.year, month: p.month });
                    }}
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isDisplayed ? 5 : 3.5}
                    fill={isDisplayed ? "rgb(250, 232, 255)" : "rgb(217, 70, 239)"}
                    stroke="rgba(255,255,255,0.35)"
                    strokeWidth={1}
                    className="pointer-events-none"
                  />
                </g>
              );
            })}

            {points.map((p, i) => {
              if (i % 6 !== 0 && i !== n - 1) return null;
              const cx = xAt(i);
              return (
                <text
                  key={`lab-${p.xLabel}`}
                  x={cx}
                  y={CHART_H - 12}
                  textAnchor="middle"
                  className="fill-white/38 text-[9px] font-medium"
                >
                  {p.xLabel}
                </text>
              );
            })}
          </svg>
        </div>

        <div
          className={`flex shrink-0 flex-col ${DETAIL_MIN_H} rounded-2xl border border-fuchsia-400/25 bg-fuchsia-950/35 px-3 py-3 shadow-inner sm:px-4 sm:py-3`}
          role="region"
          aria-label="선택한 달 연애운 안내"
        >
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden break-words">
            {active ? (
              <div className="space-y-0" role="status">
                <p className="font-semibold text-white">
                  {active.year}년 {active.month}월
                </p>
                <p className="mt-1 font-medium text-fuchsia-100/95">{scoreHeadline(active.score)}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-white/60">{scoreBody(active.score)}</p>
                <p className="mt-2 text-[11px] leading-relaxed text-white/55">{active.detailDaewoon}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/55">{active.detailYearUn}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/55">{active.detailMonthUn}</p>
              </div>
            ) : (
              <div className="flex min-h-[140px] flex-1 flex-col items-center justify-center text-center">
                <p className="text-[11px] leading-relaxed text-white/40">
                  그래프의 점을 누르거나 가리키면 해당 달의 안내를 볼 수 있어요.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
