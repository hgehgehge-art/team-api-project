"use client";

import { useState } from "react";
import type { RecommendedPlace } from "@/lib/types";

// 1~3위 메달 색상 (금·은·동)
const PODIUM = {
  1: {
    medal: "🥇",
    badge: "bg-amber-400 text-amber-950",
    ring: "border-amber-400 ring-2 ring-amber-300/60 dark:border-amber-500 dark:ring-amber-500/40",
    bar: "bg-amber-400",
  },
  2: {
    medal: "🥈",
    badge: "bg-slate-300 text-slate-900",
    ring: "border-slate-300 dark:border-slate-500",
    bar: "bg-slate-400",
  },
  3: {
    medal: "🥉",
    badge: "bg-orange-300 text-orange-950",
    ring: "border-orange-300 dark:border-orange-700",
    bar: "bg-orange-400",
  },
} as const;

function Thumbnail({ place, className }: { place: RecommendedPlace; className: string }) {
  return (
    <div className={`relative bg-teal-50 dark:bg-teal-950 ${className}`}>
      {place.imageUrl ? (
        // TourAPI 이미지 도메인이 여러 개라 next/image 대신 img 사용
        // eslint-disable-next-line @next/next/no-img-element
        <img src={place.imageUrl} alt={place.title} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        <div className="flex h-full items-center justify-center text-sm text-teal-800/60 dark:text-teal-200/60">
          사진 없음
        </div>
      )}
    </div>
  );
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold tabular-nums text-black/60 dark:text-white/60">적합도 {score}점</span>
    </div>
  );
}

export default function PlaceCard({ place, rank }: { place: RecommendedPlace; rank: number }) {
  const [showMap, setShowMap] = useState(false);

  // 구글맵 쿼리 및 길찾기 URL 생성 (API 키 불필요)
  const hasCoord = place.latitude !== null && place.longitude !== null;
  const mapQuery = hasCoord
    ? `${place.latitude},${place.longitude}`
    : encodeURIComponent(place.address || place.title);

  // 구글맵 임베드 URL (iframe 키 없이 무료 사용)
  const embedUrl = `https://maps.google.com/maps?q=${mapQuery}&hl=ko&z=15&output=embed`;

  // 구글맵 길찾기 모드 (대중교통/도보/자차 안내)
  const routeUrl = hasCoord
    ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}&travelmode=transit`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.address || place.title)}&travelmode=transit`;

  // 4위부터는 작은 목록형 카드
  if (rank > 3) {
    return (
      <article className="flex flex-col gap-2 rounded-xl border border-black/10 bg-white p-3 shadow-sm dark:border-white/15 dark:bg-white/5">
        <div className="flex items-center gap-3">
          <span className="w-8 shrink-0 text-center text-lg font-bold tabular-nums text-black/40 dark:text-white/40">
            {rank}
          </span>
          <Thumbnail place={place} className="h-16 w-20 shrink-0 overflow-hidden rounded-lg" />
          <div className="grid min-w-0 flex-1 gap-1">
            <h3 className="truncate font-semibold">{place.title}</h3>
            <p className="line-clamp-1 text-xs text-teal-800 dark:text-teal-300">{place.reason}</p>
            <ScoreBar score={place.score} color="bg-teal-600" />
          </div>
          <div className="flex flex-col gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowMap(!showMap)}
              className="rounded-md border border-black/15 px-2.5 py-1 text-xs font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              {showMap ? "지도 닫기" : "🗺️ 지도"}
            </button>
            <a
              href={routeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-teal-700 px-2.5 py-1 text-center text-xs font-semibold text-white hover:bg-teal-800 transition"
            >
              길찾기 ↗
            </a>
          </div>
        </div>

        {/* 4위 이하 카드 내 미니 구글맵 */}
        {showMap && (
          <div className="mt-2 overflow-hidden rounded-lg border border-black/10 dark:border-white/15">
            <iframe
              src={embedUrl}
              title={`${place.title} 지도`}
              className="h-44 w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </article>
    );
  }

  const style = PODIUM[rank as 1 | 2 | 3];
  const isFirst = rank === 1;

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow dark:bg-white/5 ${style.ring} ${
        isFirst ? "sm:col-span-2 shadow-lg" : ""
      }`}
    >
      <div className="relative">
        <Thumbnail place={place} className={isFirst ? "aspect-[16/9]" : "aspect-[4/3]"} />
        <span
          className={`absolute left-3 top-3 flex items-center gap-1 rounded-full font-bold shadow ${style.badge} ${
            isFirst ? "px-4 py-1.5 text-base" : "px-3 py-1 text-sm"
          }`}
        >
          <span aria-hidden>{style.medal}</span>
          {rank}위
        </span>
        {isFirst && (
          <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
            가장 잘 맞아요
          </span>
        )}
      </div>

      <div className={`grid gap-2.5 ${isFirst ? "p-5" : "p-4"}`}>
        <h3 className={`font-bold leading-snug ${isFirst ? "text-2xl" : "text-lg"}`}>{place.title}</h3>
        <ScoreBar score={place.score} color={style.bar} />
        <p className={`text-teal-800 dark:text-teal-300 ${isFirst ? "text-base" : "text-sm"}`}>{place.reason}</p>
        {place.address && <p className="text-xs text-black/55 dark:text-white/55">📍 {place.address}</p>}

        {/* 지도 보기 토글 & 길찾기 버튼 바 */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 pt-2 border-t border-black/5 dark:border-white/10">
          <button
            type="button"
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-1 rounded-lg border border-black/15 bg-transparent px-3 py-1.5 text-xs font-semibold hover:bg-black/5 transition dark:border-white/20 dark:hover:bg-white/10"
          >
            <span>{showMap ? "✖ 지도 닫기" : "🗺️ 지도 보기"}</span>
          </button>

          <a
            href={routeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-800 transition"
          >
            <span>🚦 구글 길찾기·교통</span>
            <span aria-hidden>↗</span>
          </a>
        </div>

        {/* 접이식 미니 구글맵 (API 키 불필요) */}
        {showMap && (
          <div className="mt-2 overflow-hidden rounded-xl border border-black/10 shadow-inner dark:border-white/15">
            <iframe
              src={embedUrl}
              title={`${place.title} 구글 지도`}
              className={`w-full border-0 ${isFirst ? "h-64" : "h-52"}`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        )}
      </div>
    </article>
  );
}
