"use client";

import { useState } from "react";
import FilterForm from "@/components/FilterForm";
import PlaceCard from "@/components/PlaceCard";
import { recommendPlaces } from "@/lib/recommend";
import type { Filters, Place, RecommendedPlace } from "@/lib/types";

type Status = "idle" | "loading" | "done" | "error";

interface PlacesResponse {
  places: Place[];
  source?: string;
  error?: string;
}

export default function Home() {
  const [filters, setFilters] = useState<Filters>({ areaCode: "1", companion: "friends", people: 4 });
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<RecommendedPlace[]>([]);
  const [source, setSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(`/api/places?areaCode=${encodeURIComponent(filters.areaCode)}`);
      const data: PlacesResponse = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? `요청 실패 (${res.status})`);
      setResults(recommendPlaces(data.places, filters));
      setSource(data.source ?? null);
      setStatus("done");
    } catch (e) {
      setResults([]);
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
      setStatus("error");
    }
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-[320px_1fr]">
      <header className="md:col-span-2">
        <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">한국관광공사 TourAPI</p>
        <h1 className="mt-1 text-3xl font-bold">누구와 가나요?</h1>
        <p className="mt-2 text-black/60 dark:text-white/60">지역과 동행, 인원을 고르면 함께 가기 좋은 관광지를 추천합니다.</p>
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
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((p, i) => (
                <PlaceCard key={p.id} place={p} rank={i + 1} />
              ))}
            </div>
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
