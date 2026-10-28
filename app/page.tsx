"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FilterForm from "@/components/FilterForm";
import PlaceCard from "@/components/PlaceCard";
import { recommendPlaces } from "@/lib/recommend";
import type { Companion, Environment, Filters, Place, RecommendedPlace } from "@/lib/types";

type Status = "idle" | "loading" | "done" | "error";

interface PlacesResponse {
  places: Place[];
  source?: string;
  error?: string;
}

export default function Home() {
  const [filters, setFilters] = useState<Filters>({
    areaCode: "1",
    companion: "friends",
    people: 4,
    environment: "all",
  });
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<RecommendedPlace[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 지역별 관광지 목록 캐시: 동행·인원·환경만 바꾸면 다시 요청하지 않고 즉시 재추천
  const cache = useRef(new Map<string, PlacesResponse>());
  const searched = useRef(false);
  const requestId = useRef(0);

  const runRecommend = useCallback(async (f: Filters) => {
    const id = ++requestId.current;
    setError(null);
    try {
      let data = cache.current.get(f.areaCode);
      if (!data) {
        setStatus("loading");
        const res = await fetch(`/api/places?areaCode=${encodeURIComponent(f.areaCode)}`);
        data = (await res.json()) as PlacesResponse;
        if (!res.ok || data.error) throw new Error(data.error ?? `요청 실패 (${res.status})`);
        cache.current.set(f.areaCode, data);
      }
      if (id !== requestId.current) return; // 더 최근 요청이 있으면 무시
      setResults(recommendPlaces(data.places, f));
      setSource(data.source ?? null);
      setStatus("done");
    } catch (e) {
      if (id !== requestId.current) return;
      setResults([]);
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
      setStatus("error");
    }
  }, []);

  // 1. 초기 URL 파라미터가 있으면 자동 반영 및 추천 실행 (공유받은 링크로 진입 시)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const areaCode = params.get("areaCode");
    const companion = params.get("companion") as Companion | null;
    const people = Number(params.get("people"));
    const env = params.get("environment") as Environment | null;

    if (areaCode || companion || people || env) {
      const initialFilters: Filters = {
        areaCode: areaCode || "1",
        companion: companion && ["couple", "friends", "family", "solo"].includes(companion) ? companion : "friends",
        people: people && people >= 1 && people <= 6 ? people : 4,
        environment: env && ["all", "indoor", "outdoor"].includes(env) ? env : "all",
      };
      setFilters(initialFilters);
      searched.current = true;
      runRecommend(initialFilters);
    }
  }, [runRecommend]);

  // 한 번 추천받은 뒤에는 조건을 바꾸면 바로 다시 추천
  useEffect(() => {
    if (searched.current) {
      runRecommend(filters);
      // 브라우저 URL 쿼리 파라미터 동기화 (페이지 새로고침 없이)
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("areaCode", filters.areaCode);
        url.searchParams.set("companion", filters.companion);
        url.searchParams.set("people", String(filters.people));
        url.searchParams.set("environment", filters.environment || "all");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, [filters, runRecommend]);

  function handleSubmit() {
    searched.current = true;
    runRecommend(filters);
  }

  // 결과 공유하기 (모바일 공유 시트 또는 클립보드 복사)
  async function handleShare() {
    if (typeof window === "undefined") return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?areaCode=${filters.areaCode}&companion=${filters.companion}&people=${filters.people}&environment=${filters.environment || "all"}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "동행 맞춤 관광 명소 추천",
          text: `우리가 함께 가기 딱 좋은 맞춤 여행지 추천 결과를 확인해봐!`,
          url: shareUrl,
        });
        return;
      } catch {
        // 사용자가 취소했거나 미지원 시 클립보드로 복사 진행
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert("링크를 복사하지 못했습니다. URL을 직접 복사해주세요.");
    }
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[320px_1fr]">
      <header className="md:col-span-2">
        <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">한국관광공사 TourAPI</p>
        <h1 className="mt-1 text-3xl font-bold">누구와 가나요?</h1>
        <p className="mt-2 text-black/60 dark:text-white/60">지역과 동행, 인원, 날씨를 고르면 함께 가기 좋은 관광지를 추천합니다.</p>
      </header>

      <aside className="md:sticky md:top-6 md:self-start">
        <FilterForm filters={filters} loading={status === "loading"} onChange={setFilters} onSubmit={handleSubmit} />
      </aside>

      <section aria-live="polite" className="grid content-start gap-4">
        {status === "idle" && <Notice>조건을 고르고 추천받기를 눌러 주세요.</Notice>}
        {status === "loading" && <Notice>관광지를 불러오는 중입니다…</Notice>}
        {status === "error" && (
          <Notice tone="error">관광지 정보를 불러오지 못했습니다. ({error}) 잠시 후 다시 시도해 주세요.</Notice>
        )}
        {status === "done" && results.length === 0 && <Notice>조건에 맞는 관광지가 없습니다. 다른 지역을 골라 보세요.</Notice>}
        {status === "done" && results.length > 0 && (
          <>
            {source && source !== "tourapi" && (
              <Notice tone="warn">실제 API 대신 데모 데이터로 보여 주고 있습니다.</Notice>
            )}

            {/* 결과 헤더 & 공유하기 버튼 바 */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-600/15 bg-teal-50/60 p-3.5 dark:border-teal-400/20 dark:bg-teal-950/40">
              <div>
                <h2 className="font-bold text-teal-950 dark:text-teal-100">
                  🎉 맞춤 추천 명소 {results.length}곳을 찾았어요
                </h2>
                <p className="text-xs text-teal-800/80 dark:text-teal-300/80">
                  동행과 함께 공유하고 여행 계획을 세워보세요!
                </p>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-teal-800 active:scale-95"
              >
                <span>{copied ? "✔ 링크 복사 완료!" : "🔗 이 추천 결과 공유하기"}</span>
              </button>
            </div>

            {/* 1위는 크게, 2·3위는 나란히, 4위부터는 목록형 */}
            <div className="grid gap-4 sm:grid-cols-2">
              {results.slice(0, 3).map((p, i) => (
                <PlaceCard key={p.id} place={p} rank={i + 1} />
              ))}
            </div>

            {results.length > 3 && (
              <div className="grid gap-2">
                <h2 className="text-sm font-semibold text-black/60 dark:text-white/60">그 밖의 추천</h2>
                {results.slice(3).map((p, i) => (
                  <PlaceCard key={p.id} place={p} rank={i + 4} />
                ))}
              </div>
            )}

            <p className="text-xs text-black/50 dark:text-white/50">
              추천은 서비스 자체 규칙에 따른 것이며, 실제 혼잡도나 단체 수용 가능 여부를 보장하지 않습니다.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

function Notice({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" | "error" }) {
  const styles = {
    info: "border-black/10 bg-black/[0.03] dark:border-white/15 dark:bg-white/5",
    warn: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200",
    error: "border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200",
  }[tone];
  return <div className={`rounded-xl border p-4 text-sm ${styles}`}>{children}</div>;
}
