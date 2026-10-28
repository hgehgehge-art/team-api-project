import type { RecommendedPlace } from "@/lib/types";

export default function PlaceCard({ place, rank }: { place: RecommendedPlace; rank: number }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/15 dark:bg-white/5">
      <div className="relative aspect-[4/3] bg-teal-50 dark:bg-teal-950">
        {place.imageUrl ? (
          // TourAPI 이미지 도메인이 여러 개라 next/image 대신 img 사용
          // eslint-disable-next-line @next/next/no-img-element
          <img src={place.imageUrl} alt={place.title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-teal-800/60 dark:text-teal-200/60">
            사진 없음
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white">
          {rank}위
        </span>
      </div>
      <div className="grid gap-1.5 p-4">
        <h3 className="text-lg font-semibold leading-snug">{place.title}</h3>
        <p className="text-sm text-teal-800 dark:text-teal-300">{place.reason}</p>
        {place.address && <p className="text-xs text-black/55 dark:text-white/55">{place.address}</p>}
      </div>
    </article>
  );
}
