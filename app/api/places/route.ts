import { NextResponse, type NextRequest } from 'next/server';
import { AREA_TO_LDONG, fetchPlacesByArea, TourApiError } from '@/lib/tour-api';

// 공공데이터포털은 해외 IP 요청이 불안정할 수 있어 서울 리전에서 실행
export const preferredRegion = 'icn1';

// GET /api/places?areaCode=1
// 성공: { places: Place[], source: 'tourapi' }
// 실패: { places: [], error: string } + HTTP 상태 코드
export async function GET(request: NextRequest) {
  const areaCode = request.nextUrl.searchParams.get('areaCode')?.trim();

  if (!areaCode) {
    return NextResponse.json({ places: [], error: 'areaCode 쿼리 파라미터가 필요합니다.' }, { status: 400 });
  }
  if (!AREA_TO_LDONG[areaCode]) {
    return NextResponse.json(
      {
        places: [],
        error: `지원하지 않는 areaCode입니다: ${areaCode} (사용 가능: ${Object.keys(AREA_TO_LDONG).join(', ')})`,
      },
      { status: 400 },
    );
  }

  try {
    const places = await fetchPlacesByArea(areaCode);
    return NextResponse.json({ places, source: 'tourapi' });
  } catch (e) {
    const status = e instanceof TourApiError ? e.status : 500;
    const message = e instanceof Error ? e.message : '관광지 정보를 불러오지 못했습니다.';
    console.error('[api/places]', message);
    return NextResponse.json({ places: [], error: message }, { status });
  }
}
