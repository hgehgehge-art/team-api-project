import { NextResponse, type NextRequest } from 'next/server';
import { AREA_TO_LDONG, fetchPlacesByArea } from '@/lib/tour-api';
import { MOCK_PLACES } from '@/lib/mock-places';

// 공공데이터포털은 해외 IP 요청이 불안정할 수 있어 서울 리전에서 실행
export const preferredRegion = 'icn1';

// GET /api/places?areaCode=1
// 성공: { places: Place[], source: 'tourapi' }
// API 미등록/호출 실패 시: { places: Place[], source: 'mock' } (데모 및 발표 무중단 지원)
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
    const message = e instanceof Error ? e.message : '관광지 정보를 불러오지 못했습니다.';
    console.warn(`[api/places] TourAPI 호출 실패 (${message}). 목 데이터(데모 모드)로 전환합니다.`);

    // 실제 API 실패 또는 키 미설정 시 데모용 목 데이터로 fallback
    const fallbackPlaces = MOCK_PLACES.filter((p) => p.areaCode === areaCode);
    const places = fallbackPlaces.length > 0 ? fallbackPlaces : MOCK_PLACES;

    return NextResponse.json({
      places,
      source: 'mock',
    });
  }
}
