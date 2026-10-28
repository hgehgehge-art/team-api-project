"use client";

import { useMemo, useState } from "react";
import type { Filters, RecommendedPlace } from "@/lib/types";

interface Props {
  filters: Filters;
  places: RecommendedPlace[];
}

/** 위도·경도 기반 두 지점 간의 직선 거리(km) 계산 (Haversine 공식) */
function calculateDistance(
  lat1: number | null,
  lon1: number | null,
  lat2: number | null,
  lon2: number | null
): number | null {
  if (lat1 === null || lon1 === null || lat2 === null || lon2 === null) return null;
  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function DayCoursePlanner({ filters, places }: Props) {
  // 접기/펼치기 상태 (기본적으로 펼쳐두되 버튼이나 헤더 클릭으로 접을 수 있음)
  const [isOpen, setIsOpen] = useState(true);

  // 상위 3곳을 기반으로 1일 완성 코스 조립
  const course = useMemo(() => {
    if (!places || places.length < 2) return null;

    const coursePlaces = places.slice(0, 3);

    // 일정 타임테이블
    const timeline = [
      { time: "10:30 AM", step: "1코스 (오전 메인 탐방)", stayHours: "약 2시간 체류" },
      { time: "01:00 PM", step: "2코스 (오후 문화·힐링)", stayHours: "약 1.5시간 체류" },
      { time: "03:30 PM", step: "3코스 (늦은 오후 마무리)", stayHours: "약 1~2시간 체류" },
    ];

    // 각 코스 간 이동 거리 및 추천 이동 수단 계산
    const legs = [];
    for (let i = 0; i < coursePlaces.length - 1; i++) {
      const p1 = coursePlaces[i];
      const p2 = coursePlaces[i + 1];
      const dist = calculateDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);

      let transitText = "대중교통/차량 약 15~20분";
      if (dist !== null) {
        if (dist <= 1.2) {
          transitText = `🚶 도보 약 ${Math.round(dist * 15)}분 (${dist}km)`;
        } else {
          transitText = `🚌 대중교통/차량 약 ${Math.max(10, Math.round(dist * 3))}분 (${dist}km)`;
        }
      }

      legs.push({ transitText, dist });
    }

    // 구글맵 다중 목적지 연속 길찾기 URL 생성
    const stops = coursePlaces
      .map((p) => {
        if (p.latitude && p.longitude) return `${p.latitude},${p.longitude}`;
        return encodeURIComponent(p.address || p.title);
      })
      .join("/");
    const googleMultiRouteUrl = `https://www.google.com/maps/dir/${stops}`;

    // 동행 명칭
    const companionName = {
      couple: "연인 맞춤",
      friends: "친구들과 함께 떠나는",
      family: "온 가족이 편안한",
      solo: "혼자만의 여유로운",
    }[filters.companion];

    return {
      coursePlaces,
      timeline,
      legs,
      googleMultiRouteUrl,
      companionName,
    };
  }, [places, filters.companion]);

  if (!course) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-teal-700/20 bg-gradient-to-br from-teal-50/70 via-white to-emerald-50/50 p-4.5 shadow-sm transition-all dark:border-teal-400/20 dark:from-teal-950/40 dark:via-white/5 dark:to-emerald-950/20">
      {/* 헤더 & 접기/펼치기 토글 바 */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex flex-1 items-center gap-2.5 text-left transition hover:opacity-80"
          aria-expanded={isOpen}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white shadow-xs">
            🎒
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-teal-950 dark:text-teal-100">
                오늘의 추천: {course.companionName} 당일치기 완성 코스
              </h3>
              <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-semibold text-teal-800 dark:bg-teal-900/60 dark:text-teal-200">
                {isOpen ? "접기 ▲" : "펼치기 ▼"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-black/60 dark:text-white/60">
              상위 1~3위 명소를 가장 알맞은 동선으로 자동 연결했습니다. (총 5~6시간 코스)
            </p>
          </div>
        </button>

        <a
          href={course.googleMultiRouteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-800 active:scale-95"
        >
          <span>🗺️ 전체 코스 구글맵 길찾기</span>
          <span aria-hidden>↗</span>
        </a>
      </div>

      {/* 접힌 상태의 간략한 한 줄 코스 요약 프리뷰 */}
      {!isOpen && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-black/[0.03] p-2.5 text-xs text-black/75 dark:bg-white/5 dark:text-white/75">
          <span className="font-bold text-teal-800 dark:text-teal-300">코스 요약:</span>
          {course.coursePlaces.map((place, idx) => (
            <span key={place.id} className="inline-flex items-center gap-1">
              <span className="font-semibold">{idx + 1}. {place.title}</span>
              {idx < course.coursePlaces.length - 1 && <span className="text-black/30 dark:text-white/30">➔</span>}
            </span>
          ))}
        </div>
      )}

      {/* 펼쳐졌을 때 보이는 상세 타임라인 코스 체인 */}
      {isOpen && (
        <div className="mt-4 border-t border-black/5 pt-3.5 space-y-3 dark:border-white/10">
          {course.coursePlaces.map((place, idx) => {
            const t = course.timeline[idx];
            const leg = course.legs[idx];

            return (
              <div key={place.id} className="relative">
                <div className="flex items-start gap-3.5 rounded-xl border border-black/5 bg-white/80 p-3.5 shadow-xs dark:border-white/10 dark:bg-white/5">
                  {/* 시간 뱃지 */}
                  <div className="shrink-0 text-center">
                    <div className="rounded-md bg-teal-700 px-2 py-1 text-[11px] font-bold text-white">
                      {t.time}
                    </div>
                    <div className="mt-1 text-[10px] font-medium text-black/50 dark:text-white/50">
                      {idx + 1}번째 경유
                    </div>
                  </div>

                  {/* 장소 정보 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-teal-800 dark:text-teal-300">
                        {t.step}
                      </span>
                      <span className="rounded-sm bg-black/5 px-1.5 py-0.5 text-[10px] text-black/60 dark:bg-white/10 dark:text-white/60">
                        {t.stayHours}
                      </span>
                    </div>
                    <h4 className="mt-1 font-bold text-base text-black/90 dark:text-white">
                      {place.title}
                    </h4>
                    <p className="mt-0.5 line-clamp-1 text-xs text-black/60 dark:text-white/60">
                      {place.reason}
                    </p>
                  </div>
                </div>

                {/* 다음 코스로 이어지는 이동 경로 안내선 */}
                {leg && (
                  <div className="my-1.5 ml-8 flex items-center gap-2 pl-2 text-xs font-medium text-teal-800 dark:text-teal-300">
                    <div className="h-4 w-0.5 bg-teal-500/40 dark:bg-teal-400/40" />
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-100/70 px-2.5 py-0.5 text-[11px] font-semibold text-teal-900 dark:bg-teal-900/60 dark:text-teal-200">
                      ↓ {leg.transitText}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
