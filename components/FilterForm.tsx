"use client";

import type { Companion, Environment, Filters } from "@/lib/types";

// /api/places가 지원하는 17개 시도 (TourAPI 기존 areaCode 기준)
export const AREAS = [
  { code: "1", name: "서울" },
  { code: "2", name: "인천" },
  { code: "31", name: "경기" },
  { code: "32", name: "강원" },
  { code: "33", name: "충북" },
  { code: "34", name: "충남" },
  { code: "3", name: "대전" },
  { code: "8", name: "세종" },
  { code: "37", name: "전북" },
  { code: "38", name: "전남" },
  { code: "5", name: "광주" },
  { code: "35", name: "경북" },
  { code: "36", name: "경남" },
  { code: "4", name: "대구" },
  { code: "7", name: "울산" },
  { code: "6", name: "부산" },
  { code: "39", name: "제주" },
];

const COMPANIONS: { value: Companion; label: string }[] = [
  { value: "couple", label: "연인" },
  { value: "friends", label: "친구" },
  { value: "family", label: "가족" },
  { value: "solo", label: "혼자" },
];

const ENVIRONMENTS: { value: Environment; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "indoor", label: "🏛️ 실내 중심" },
  { value: "outdoor", label: "🍃 야외 중심" },
];

interface Props {
  filters: Filters;
  loading: boolean;
  onChange: (filters: Filters) => void;
  onSubmit: () => void;
}

export default function FilterForm({ filters, loading, onChange, onSubmit }: Props) {
  const isSolo = filters.companion === "solo";
  const isCouple = filters.companion === "couple";
  const isFixedPeople = isSolo || isCouple;
  const currentEnv = filters.environment || "all";

  return (
    <form
      className="grid gap-5 rounded-2xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/15 dark:bg-white/5"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-semibold">지역</legend>
        <select
          className="rounded-lg border border-black/15 bg-transparent px-3 py-2 dark:border-white/20"
          value={filters.areaCode}
          onChange={(e) => onChange({ ...filters, areaCode: e.target.value })}
        >
          {AREAS.map((a) => (
            <option key={a.code} value={a.code}>
              {a.name}
            </option>
          ))}
        </select>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">동행</legend>
        <div className="grid grid-cols-4 gap-2">
          {COMPANIONS.map((c) => {
            const active = filters.companion === c.value;
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={active}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  active
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-black/15 hover:border-teal-700 dark:border-white/20"
                }`}
                onClick={() => {
                  let nextPeople = filters.people;
                  if (c.value === "solo") {
                    nextPeople = 1;
                  } else if (c.value === "couple") {
                    nextPeople = 2;
                  } else {
                    nextPeople = Math.max(filters.people, 2);
                  }

                  onChange({
                    ...filters,
                    companion: c.value,
                    people: nextPeople,
                  });
                }}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">인원 {filters.people}명</legend>
        <input
          type="range"
          min={isSolo ? 1 : 2}
          max={6}
          value={filters.people}
          disabled={isFixedPeople}
          className="w-full accent-teal-700 disabled:opacity-50"
          onChange={(e) => onChange({ ...filters, people: Number(e.target.value) })}
        />
        {isSolo && <p className="mt-1 text-xs text-black/50 dark:text-white/50">혼자 선택 시 1명으로 고정됩니다.</p>}
        {isCouple && <p className="mt-1 text-xs text-black/50 dark:text-white/50">연인 선택 시 2명으로 고정됩니다.</p>}
      </fieldset>

      {/* 날씨/공간 분위기 맞춤 필터 */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">날씨 / 공간 맞춤</legend>
        <div className="grid grid-cols-3 gap-2">
          {ENVIRONMENTS.map((env) => {
            const active = currentEnv === env.value;
            return (
              <button
                key={env.value}
                type="button"
                aria-pressed={active}
                className={`rounded-lg border px-2 py-2 text-xs font-semibold transition ${
                  active
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-black/15 hover:border-teal-700 dark:border-white/20"
                }`}
                onClick={() => onChange({ ...filters, environment: env.value })}
              >
                {env.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
      >
        {loading ? "불러오는 중…" : "추천받기"}
      </button>
    </form>
  );
}
