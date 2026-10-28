"use client";

import { useMemo } from "react";
import type { Filters, Place, RecommendedPlace } from "@/lib/types";
import { AREAS } from "./FilterForm";

interface Props {
  filters: Filters;
  allPlaces: Place[];
  recommendedPlaces: RecommendedPlace[];
}

export default function DataInsights({ filters, allPlaces, recommendedPlaces }: Props) {
  const stats = useMemo(() => {
    const total = allPlaces.length;
    if (total === 0) return null;

    const areaName = AREAS.find((a) => a.code === filters.areaCode)?.name || "해당 지역";

    // 유형별 집계
    let natureCount = 0; // 12: 관광지(자연/역사)
    let cultureCount = 0; // 14: 문화시설(박물관/미술관)
    let leportsCount = 0; // 28: 레포츠/체험
    let otherCount = 0;

    for (const p of allPlaces) {
      if (p.contentTypeId === "12") natureCount++;
      else if (p.contentTypeId === "14") cultureCount++;
      else if (p.contentTypeId === "28") leportsCount++;
      else otherCount++;
    }

    const naturePct = Math.round((natureCount / total) * 100);
    const culturePct = Math.round((cultureCount / total) * 100);
    const leportsPct = Math.round((leportsCount / total) * 100);

    // 선별율
    const selectedRate = Math.round((recommendedPlaces.length / total) * 100);
    const topScore = recommendedPlaces[0]?.score || 0;

    // 동행 한글명
    const companionLabel = {
      couple: "연인",
      friends: "친구",
      family: "가족",
      solo: "혼자",
    }[filters.companion];

    // 환경 한글명
    const envLabel = {
      all: "전체",
      indoor: "실내 위주",
      outdoor: "야외 위주",
    }[filters.environment || "all"];

    return {
      areaName,
      total,
      natureCount,
      naturePct,
      cultureCount,
      culturePct,
      leportsCount,
      leportsPct,
      selectedRate,
      topScore,
      companionLabel,
      envLabel,
    };
  }, [allPlaces, filters, recommendedPlaces]);

  if (!stats) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/15 dark:bg-white/5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
            📊
          </span>
          <h3 className="text-sm font-bold tracking-tight">
            {stats.areaName} 관광 공공데이터 분석 브리핑
          </h3>
        </div>
        <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-300">
          TourAPI 실시간 분석
        </span>
      </div>

      {/* 3대 핵심 분석 지표 (2조의 mini-figures 스타일 벤치마킹) */}
      <div className="my-3.5 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-black/[0.03] p-2.5 dark:bg-white/5">
          <div className="text-[11px] text-black/50 dark:text-white/50">분석된 전체 자원</div>
          <div className="mt-0.5 text-lg font-bold tabular-nums text-teal-900 dark:text-teal-200">
            {stats.total}곳
          </div>
        </div>
        <div className="rounded-xl bg-black/[0.03] p-2.5 dark:bg-white/5">
          <div className="text-[11px] text-black/50 dark:text-white/50">조건 맞춤 선별율</div>
          <div className="mt-0.5 text-lg font-bold tabular-nums text-teal-900 dark:text-teal-200">
            상위 {stats.selectedRate}%
          </div>
        </div>
        <div className="rounded-xl bg-black/[0.03] p-2.5 dark:bg-white/5">
          <div className="text-[11px] text-black/50 dark:text-white/50">최고 추천 적합도</div>
          <div className="mt-0.5 text-lg font-bold tabular-nums text-teal-700 dark:text-teal-400">
            {stats.topScore}점
          </div>
        </div>
      </div>

      {/* 지역 자원 분포 게이지 바 */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-black/60 dark:text-white/60">
          <span>지역 자원 분포</span>
          <span>자연·명소 {stats.naturePct}% · 문화·전시 {stats.culturePct}% · 레포츠 {stats.leportsPct}%</span>
        </div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <div
            style={{ width: `${stats.naturePct}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`자연·명소: ${stats.natureCount}곳 (${stats.naturePct}%)`}
          />
          <div
            style={{ width: `${stats.culturePct}%` }}
            className="bg-sky-500 transition-all duration-500"
            title={`문화·전시: ${stats.cultureCount}곳 (${stats.culturePct}%)`}
          />
          <div
            style={{ width: `${stats.leportsPct}%` }}
            className="bg-amber-500 transition-all duration-500"
            title={`레포츠·체험: ${stats.leportsCount}곳 (${stats.leportsPct}%)`}
          />
        </div>
      </div>

      {/* 인사이트 해석 코멘트 */}
      <p className="mt-3 text-xs leading-relaxed text-black/65 dark:text-white/65">
        💡 <b>{stats.areaName}</b>의 공공 관광자원 {stats.total}곳 중, 사용자가 선택한{" "}
        <span className="font-semibold text-teal-700 dark:text-teal-400">
          [{stats.companionLabel} {filters.people}인 · {stats.envLabel}]
        </span>{" "}
        조건에 가장 적합한 상위 {recommendedPlaces.length}곳을 다차원 휴리스틱으로 추출했습니다.
      </p>
    </div>
  );
}
