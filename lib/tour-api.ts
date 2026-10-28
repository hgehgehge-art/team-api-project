// 한국관광공사 국문 관광정보 서비스(KorService2) 클라이언트
// 서버(Route Handler)에서만 import한다. 인증키가 브라우저로 나가지 않도록 주의.
import type { Place } from '@/lib/types';

const BASE_URL = 'https://apis.data.go.kr/B551011/KorService2';

// 추천 대상 콘텐츠 유형: 12 관광지, 14 문화시설, 28 레포츠
// (15 축제, 25 여행코스, 32 숙박, 38 쇼핑, 39 음식점은 "명소" 추천에서 제외)
export const ATTRACTION_CONTENT_TYPES = ['12', '14', '28'] as const;

// TourAPI v2에서 areaCode는 "삭제 예정"이고 법정동 시도 코드(lDongRegnCd)로 대체됐다.
// 팀 계약은 기존 areaCode('1' = 서울)를 쓰므로 여기서 법정동 코드로 변환한다.
export const AREA_TO_LDONG: Record<string, { ldong: string; name: string }> = {
  '1': { ldong: '11', name: '서울' },
  '2': { ldong: '28', name: '인천' },
  '3': { ldong: '30', name: '대전' },
  '4': { ldong: '27', name: '대구' },
  '5': { ldong: '29', name: '광주' },
  '6': { ldong: '26', name: '부산' },
  '7': { ldong: '31', name: '울산' },
  '8': { ldong: '36', name: '세종' },
  '31': { ldong: '41', name: '경기' },
  '32': { ldong: '51', name: '강원' },
  '33': { ldong: '43', name: '충북' },
  '34': { ldong: '44', name: '충남' },
  '35': { ldong: '47', name: '경북' },
  '36': { ldong: '48', name: '경남' },
  '37': { ldong: '52', name: '전북' },
  '38': { ldong: '46', name: '전남' },
  '39': { ldong: '50', name: '제주' },
};

export class TourApiError extends Error {
  constructor(
    message: string,
    /** Route Handler가 그대로 응답 코드로 쓴다 */
    public readonly status: number,
  ) {
    super(message);
    this.name = 'TourApiError';
  }
}

/** TourAPI 원본 item (사용하는 필드만) */
interface RawItem {
  contentid?: string;
  contenttypeid?: string;
  title?: string;
  addr1?: string;
  addr2?: string;
  firstimage?: string;
  firstimage2?: string;
  mapx?: string;
  mapy?: string;
}

/** 원본 item을 팀 공통 Place 타입으로 변환 */
export function toPlace(item: RawItem, areaCode: string): Place | null {
  const id = item.contentid?.trim();
  const title = item.title?.trim();
  if (!id || !title) return null;

  const address = [item.addr1, item.addr2]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(' ');

  return {
    id,
    title,
    address,
    imageUrl: toHttps(item.firstimage || item.firstimage2),
    contentTypeId: item.contenttypeid ?? '',
    areaCode,
    // mapx = 경도, mapy = 위도
    latitude: toCoord(item.mapy),
    longitude: toCoord(item.mapx),
  };
}

function toHttps(url?: string): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  // Vercel(https) 페이지에서 mixed content로 막히지 않게 변환
  return trimmed.replace(/^http:\/\//, 'https://');
}

function toCoord(value?: string): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) && n !== 0 ? n : null;
}

/** items.item이 0건이면 "", 1건이면 객체, 여러 건이면 배열로 오는 문제를 배열로 통일 */
function toArray(items: unknown): RawItem[] {
  if (!items || typeof items !== 'object') return [];
  const item = (items as { item?: RawItem | RawItem[] }).item;
  if (!item) return [];
  return Array.isArray(item) ? item : [item];
}

async function callAreaBasedList(
  ldong: string,
  contentTypeId: string,
  numOfRows: number,
): Promise<RawItem[]> {
  const serviceKey = process.env.TOUR_API_KEY;
  if (!serviceKey) {
    throw new TourApiError('서버에 TOUR_API_KEY 환경 변수가 설정되지 않았습니다.', 500);
  }

  const params = new URLSearchParams({
    serviceKey, // 포털의 "디코딩" 키를 넣어야 이중 인코딩되지 않는다
    MobileOS: 'WEB',
    MobileApp: 'TeamApiProject',
    _type: 'json',
    numOfRows: String(numOfRows),
    pageNo: '1',
    arrange: 'O', // 대표 이미지가 있는 항목만, 제목순
    contentTypeId,
    lDongRegnCd: ldong,
  });

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/areaBasedList2?${params}`, {
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 }, // 관광지 목록은 자주 바뀌지 않으므로 1시간 캐시
    });
  } catch (e) {
    const timedOut = e instanceof Error && e.name === 'TimeoutError';
    throw new TourApiError(
      timedOut ? 'TourAPI 응답 시간이 초과되었습니다.' : 'TourAPI에 연결할 수 없습니다.',
      504,
    );
  }

  const text = await res.text();

  let data: {
    response?: { header?: { resultCode?: string; resultMsg?: string }; body?: { items?: unknown } };
    // 인증키 오류(401/403) 등 게이트웨이 오류는 이 형태로 온다
    OpenAPI_ServiceResponse?: { cmmMsgHeader?: { errMsg?: string; returnAuthMsg?: string } };
  };
  try {
    data = JSON.parse(text);
  } catch {
    // 일부 오류는 _type=json이어도 XML로 온다
    const reason =
      text.match(/<returnAuthMsg>(.*?)<\/returnAuthMsg>/)?.[1] ??
      text.match(/<resultMsg>(.*?)<\/resultMsg>/)?.[1] ??
      `알 수 없는 응답 형식 (HTTP ${res.status})`;
    throw new TourApiError(`TourAPI 오류: ${reason}`, 502);
  }

  const gatewayError = data.OpenAPI_ServiceResponse?.cmmMsgHeader;
  if (gatewayError) {
    // 예: SERVICE_KEY_IS_NOT_REGISTERED_ERROR (등록되지 않은 서비스키)
    throw new TourApiError(
      `TourAPI 오류: ${gatewayError.returnAuthMsg ?? '요청 거부'} (${gatewayError.errMsg ?? res.status})`,
      502,
    );
  }
  if (!res.ok) {
    throw new TourApiError(`TourAPI HTTP 오류 (${res.status})`, 502);
  }

  const header = data.response?.header;
  if (header?.resultCode !== '0000') {
    throw new TourApiError(
      `TourAPI 오류: ${header?.resultMsg ?? '응답 형식이 올바르지 않습니다.'} (${header?.resultCode ?? '-'})`,
      502,
    );
  }

  return toArray(data.response?.body?.items);
}

/**
 * 지역(팀 계약의 areaCode)으로 추천 대상 관광지 목록을 가져온다.
 * 콘텐츠 유형별로 나눠 요청해 관광지만 몰리지 않게 섞는다.
 */
export async function fetchPlacesByArea(areaCode: string, perType = 15): Promise<Place[]> {
  const area = AREA_TO_LDONG[areaCode];
  if (!area) {
    throw new TourApiError(`지원하지 않는 areaCode입니다: ${areaCode}`, 400);
  }

  const results = await Promise.allSettled(
    ATTRACTION_CONTENT_TYPES.map((type) => callAreaBasedList(area.ldong, type, perType)),
  );

  // 일부 유형만 실패하면 성공한 것만 쓰고, 전부 실패하면 첫 오류를 던진다
  const fulfilled = results.filter(
    (r): r is PromiseFulfilledResult<RawItem[]> => r.status === 'fulfilled',
  );
  if (fulfilled.length === 0) {
    throw (results[0] as PromiseRejectedResult).reason;
  }

  const seen = new Set<string>();
  const places: Place[] = [];
  for (const item of fulfilled.flatMap((r) => r.value)) {
    const place = toPlace(item, areaCode);
    if (place && !seen.has(place.id)) {
      seen.add(place.id);
      places.push(place);
    }
  }
  return places;
}
