"use client";

import type { Companion, Filters } from "@/lib/types";

export const AREAS = [
  { code: "1", name: "서울" },
  { code: "6", name: "부산" },
  { code: "32", name: "강원" },
  { code: "39", name: "제주" },
];

const COMPANIONS: { value: Companion; label: string }[] = [
  { value: "couple", label: "연인" },
  { value: "friends", label: "친구" },
  { value: "family", label: "가족" },
  { value: "solo", label: "혼자" },
];

interface Props {
  filters: Filters;
  loading: boolean;
  onChange: (filters: Filters) => void;
  onSubmit: () => void;
}

export default function FilterForm({ filters, loading, onChange, onSubmit }: Props) {
  const isSolo = filters.companion === "solo";

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
                onClick={() =>
                  onChange({
                    ...filters,
                    companion: c.value,
                    // 혼자는 1명 고정, 다른 동행은 최소 2명
                    people: c.value === "solo" ? 1 : Math.max(filters.people, 2),
                  })
                }
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
          disabled={isSolo}
          className="w-full accent-teal-700"
          onChange={(e) => onChange({ ...filters, people: Number(e.target.value) })}
        />
        {isSolo && <p className="mt-1 text-xs text-black/50 dark:text-white/50">혼자 선택 시 1명으로 고정됩니다.</p>}
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
