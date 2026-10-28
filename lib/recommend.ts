import { Companion, Filters, Place, RecommendedPlace } from './types';

/**
 * 한국관광공사 contentTypeId 정의
 * 12: 관광지(자연, 역사 등)
 * 14: 문화시설(박물관, 미술관 등)
 * 15: 축제공연행사
 * 25: 여행코스
 * 28: 레포츠
 * 32: 숙박
 * 38: 쇼핑
 * 39: 음식점
 */

const MAX_RESULTS = 6;
/** 한 유형이 결과를 독차지하지 않도록 유형별 최대 개수 */
const MAX_PER_TYPE = 3;

interface ScoreDetail {
  score: number;
  reason: string;
}

/** 동행 유형별 콘텐츠 유형 선호 점수와 추천 문구 */
const COMPANION_RULES: Record<
  Companion,
  { types: Record<string, { bonus: number; reason: string }>; fallback: { bonus: number; reason: string } }
> = {
  couple: {
    types: {
      '12': { bonus: 30, reason: '연인과 함께 아름다운 경치를 감상하며 로맨틱한 산책을 즐기기 좋은 명소입니다.' },
      '14': { bonus: 30, reason: '연인과 오붓하게 둘러보며 대화를 나누기 좋은 감성적인 문화·예술 공간입니다.' },
      '39': { bonus: 20, reason: '데이트 코스로 함께 들르기 좋은 식도락 장소입니다.' },
    },
    fallback: { bonus: 10, reason: '둘만의 특별한 추억을 남길 수 있는 데이트 코스입니다.' },
  },
  friends: {
    types: {
      '28': { bonus: 35, reason: '친구들과 함께 역동적인 액티비티와 즐거운 추억을 쌓기 완벽한 레포츠 명소입니다.' },
      '12': { bonus: 30, reason: '친구들과 다 함께 사진을 찍으며 활기찬 시간을 보내기 좋은 핫플레이스입니다.' },
      '14': { bonus: 25, reason: '친구들과 함께 다양한 전시와 이색 체험을 즐기기 좋은 문화 공간입니다.' },
      '15': { bonus: 25, reason: '친구들과 함께 흥겨운 분위기를 즐길 수 있는 행사입니다.' },
      '39': { bonus: 25, reason: '친구들과 함께 맛있는 음식을 즐길 수 있는 장소입니다.' },
    },
    fallback: { bonus: 10, reason: '친구들과 모여 부담 없이 방문하기 좋은 추천 장소입니다.' },
  },
  family: {
    types: {
      '12': { bonus: 35, reason: '부모님, 아이 등 온 가족이 여유롭게 산책하며 힐링하기 좋은 명소입니다.' },
      '14': { bonus: 30, reason: '다양한 연령대의 가족이 함께 유익한 시간을 보낼 수 있는 문화시설입니다.' },
      '28': { bonus: 20, reason: '온 가족이 함께 즐기며 활력을 찾을 수 있는 체험형 공간입니다.' },
    },
    fallback: { bonus: 10, reason: '가족 나들이 장소로 방문하기 좋은 추천 명소입니다.' },
  },
  solo: {
    types: {
      '14': { bonus: 35, reason: '혼자만의 속도로 조용히 사색하며 여유롭게 관람하기 좋은 문화·예술 공간입니다.' },
      '12': { bonus: 30, reason: '복잡한 일상에서 벗어나 혼자 천천히 거닐기 좋은 산책 명소입니다.' },
    },
    fallback: { bonus: 15, reason: '혼자만의 자유로운 여정을 즐기기에 부담 없는 추천 스팟입니다.' },
  },
};

/**
 * 인원수(1~6명)별 콘텐츠 유형 가감점. 인덱스 = 인원수 - 1
 * 적은 인원은 조용한 실내 관람, 많은 인원은 넓은 야외·체험형에 유리하다고 가정한 서비스 자체 규칙.
 */
const PEOPLE_FIT: Record<string, number[]> = {
  '14': [10, 8, 3, 0, -6, -10],
  '12': [0, 0, 4, 6, 8, 10],
  '28': [-6, -2, 4, 8, 12, 14],
  '39': [4, 4, 2, 0, -2, -4],
};

/** 동행 유형별로 제목에 들어 있으면 가산점을 주는 키워드 */
const TITLE_KEYWORDS: Record<Companion, string[]> = {
  couple: ['공원', '정원', '숲', '미술관', '갤러리', '전망', '야경', '카페', '한강', '해변', '바다'],
  friends: ['캠핑', '서핑', '카트', '레일바이크', '짚라인', '테마파크', '체험', '사격', '스키', '수상'],
  family: ['박물관', '과학관', '동물원', '수목원', '공원', '체험', '놀이', '어린이', '아쿠아'],
  solo: ['미술관', '갤러리', '도서관', '문학관', '사찰', '암', '숲길', '둘레길', '기념관'],
};

function peopleFit(contentTypeId: string, people: number): number {
  const index = Math.min(Math.max(people, 1), 6) - 1;
  return PEOPLE_FIT[contentTypeId]?.[index] ?? 0;
}

function peopleReason(contentTypeId: string, people: number): string {
  if (peopleFit(contentTypeId, people) <= 0) return '';
  if (people === 1) return '혼자 조용히 둘러보기 좋아요.';
  if (people === 2) return '둘이서 여유롭게 즐기기 좋아요.';
  if (people <= 4) return `${people}명이 함께 움직이기 편한 장소예요.`;
  return `${people}명 단체도 넉넉하게 즐길 수 있는 넓은 공간이에요.`;
}

/**
 * 동행 관계, 인원수, 콘텐츠 유형에 따른 휴리스틱 점수 및 추천 사유 산출 (최대 100점)
 */
function calculateScoreAndReason(place: Place, filters: Filters): ScoreDetail {
  const { companion, people } = filters;
  const { contentTypeId, title } = place;
  const rule = COMPANION_RULES[companion] ?? COMPANION_RULES.solo;
  const typeRule = rule.types[contentTypeId] ?? rule.fallback;

  const baseScore = 30;

  // 정보 완성도 가산점 (사진 +10점, 주소 +5점)
  let qualityBonus = 0;
  if (place.imageUrl && place.imageUrl.trim() !== '') qualityBonus += 10;
  if (place.address && place.address.trim() !== '') qualityBonus += 5;

  const keywordBonus = TITLE_KEYWORDS[companion]?.some((k) => title.includes(k)) ? 5 : 0;
  const groupBonus = peopleFit(contentTypeId, people);

  const score = Math.max(0, Math.min(100, baseScore + typeRule.bonus + qualityBonus + keywordBonus + groupBonus));
  const reason = [typeRule.reason, peopleReason(contentTypeId, people)].filter(Boolean).join(' ');

  return { score, reason };
}

/**
 * 동점일 때 쓰는 결정적 순서. 같은 조건이면 항상 같은 결과가 나오지만,
 * 조건(동행·인원)이 바뀌면 동점 장소들의 순서도 바뀌어 제목순으로 고정되지 않는다.
 */
function tieBreaker(id: string, filters: Filters): number {
  const seed = `${id}|${filters.companion}|${filters.people}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * 관광공사 Place 목록을 받아 동행 조건 및 인원수에 따라 최적의 추천 장소를 반환합니다.
 *
 * @param places 원본 관광지 목록
 * @param filters 지역, 동행자 유형, 인원수 필터
 * @returns 점수 내림차순, 유형별 최대 3개, 최대 6개 추천 목록
 */
export function recommendPlaces(places: Place[], filters: Filters): RecommendedPlace[] {
  if (!places || places.length === 0) {
    return [];
  }

  // 1. 중복 ID 제거
  const uniquePlaceMap = new Map<string, Place>();
  for (const place of places) {
    if (place.id && !uniquePlaceMap.has(place.id)) {
      uniquePlaceMap.set(place.id, place);
    }
  }
  const uniquePlaces = Array.from(uniquePlaceMap.values());

  // 2. 지역 코드가 필터와 일치하는 항목 우선 (없으면 전체 대상)
  const targetPlaces = uniquePlaces.filter((p) => !filters.areaCode || p.areaCode === filters.areaCode);
  const candidatePlaces = targetPlaces.length > 0 ? targetPlaces : uniquePlaces;

  // 3. 점수 계산 후 정렬: 점수 내림차순 -> 동점이면 조건별 결정적 순서
  const evaluatedPlaces = candidatePlaces
    .map((place) => ({ ...place, ...calculateScoreAndReason(place, filters) }))
    .sort((a, b) => b.score - a.score || tieBreaker(a.id, filters) - tieBreaker(b.id, filters));

  // 4. 유형별 최대 3개까지 담아 최대 6개 반환
  const picked: RecommendedPlace[] = [];
  const typeCount = new Map<string, number>();
  for (const place of evaluatedPlaces) {
    const count = typeCount.get(place.contentTypeId) ?? 0;
    if (count >= MAX_PER_TYPE) continue;
    typeCount.set(place.contentTypeId, count + 1);
    picked.push(place);
    if (picked.length === MAX_RESULTS) break;
  }

  // 유형이 적어 6개가 안 차면 남은 상위 장소로 채운다
  if (picked.length < MAX_RESULTS) {
    const pickedIds = new Set(picked.map((p) => p.id));
    for (const place of evaluatedPlaces) {
      if (picked.length === MAX_RESULTS) break;
      if (!pickedIds.has(place.id)) picked.push(place);
    }
    picked.sort((a, b) => b.score - a.score);
  }

  return picked;
}
