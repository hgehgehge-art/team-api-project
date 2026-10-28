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
  // 4위부터는 작은 목록형 카드
  if (rank > 3) {
    return (
      <article className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-2.5 dark:border-white/15 dark:bg-white/5">
        <span className="w-8 shrink-0 text-center text-lg font-bold tabular-nums text-black/40 dark:text-white/40">
          {rank}
        </span>
        <Thumbnail place={place} className="h-16 w-20 shrink-0 overflow-hidden rounded-lg" />
        <div className="grid min-w-0 flex-1 gap-1">
          <h3 className="truncate font-semibold">{place.title}</h3>
          <p className="line-clamp-1 text-xs text-teal-800 dark:text-teal-300">{place.reason}</p>
          <ScoreBar score={place.score} color="bg-teal-600" />
        </div>
      </article>
    );
  }

  const style = PODIUM[rank as 1 | 2 | 3];
  const isFirst = rank === 1;

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-white/5 ${style.ring} ${
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
      <div className={`grid gap-2 ${isFirst ? "p-5" : "p-4"}`}>
        <h3 className={`font-bold leading-snug ${isFirst ? "text-2xl" : "text-lg"}`}>{place.title}</h3>
        <ScoreBar score={place.score} color={style.bar} />
        <p className={`text-teal-800 dark:text-teal-300 ${isFirst ? "text-base" : "text-sm"}`}>{place.reason}</p>
        {place.address && <p className="text-xs text-black/55 dark:text-white/55">{place.address}</p>}
      </div>
    </article>
  );
}
