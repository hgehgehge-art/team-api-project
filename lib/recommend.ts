import { Companion, Environment, Filters, Place, RecommendedPlace } from './types';

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

interface ScoreDetail {
  score: number;
  reason: string;
}

/**
 * 관광 명소로 부적합한 로컬 행정/복지 시설 감점 키워드 (-50점 페널티)
 * (공공데이터상 문화시설(14)로 등록되어 있으나, 실제 여행객이 방문하는 관광지가 아님)
 */
const NON_TOURIST_KEYWORDS = [
  '청소년',
  '수련관',
  '수련원',
  '문화의집',
  '복지관',
  '주민센터',
  '행정복지',
  '구민회관',
  '시민회관',
  '체육센터',
  '국민체육',
  '구민체육',
  '학습관',
  '평생학습',
  '여성인력',
  '자원봉사',
  '보건소',
  '유스호스텔',
];

/**
 * 대중적으로 검증된 대표 관광 명소 및 랜드마크 키워드 (+20점 가산점)
 */
const FAMOUS_TOURIST_KEYWORDS = [
  // 국가/지역 대표 문화·역사 랜드마크
  '궁', '경복궁', '창덕궁', '덕수궁', '창경궁', '한옥마을', '민속촌', '유적지', '성곽', '산성', '사적', '서원',
  // 대표 국·공립 박물관, 미술관, 아트센터
  '국립', '시립', '도립', '박물관', '미술관', '아트센터', '예술의전당', '전시관', '역사관', '기념관',
  // 랜드마크 전망대, 타워, 자연 절경
  '타워', '전망대', '케이블카', '유람선', '스카이워크', '해수욕장', '해변', '폭포', '계곡', '수목원', '식물원', '자연휴양림', '국립공원', '둘레길',
  // 대형 테마파크, 액티비티 랜드마크
  '월드', '랜드', '어드벤처', '테마파크', '아쿠아리움', '워터파크', '레일바이크', '루지', '짚라인', '아이스링크',
  // 유명 전통시장 및 먹거리 골목
  '전통시장', '야시장', '먹거리골목', '카페거리', '문화의거리', '특화거리',
];

/** 동행 유형별 콘텐츠 유형 기본 선호 점수와 추천 문구 */
const COMPANION_RULES: Record<
  Companion,
  { types: Record<string, { bonus: number; reason: string }>; fallback: { bonus: number; reason: string } }
> = {
  couple: {
    types: {
      '12': { bonus: 28, reason: '경치를 감상하며 로맨틱한 산책을 즐기기 좋은 명소입니다.' },
      '14': { bonus: 28, reason: '오붓하게 둘러보며 대화를 나누기 좋은 감성 문화·예술 공간입니다.' },
      '39': { bonus: 22, reason: '데이트 코스로 함께 들르기 좋은 식도락 장소입니다.' },
    },
    fallback: { bonus: 10, reason: '둘만의 특별한 추억을 남길 수 있는 데이트 코스입니다.' },
  },
  friends: {
    types: {
      '28': { bonus: 30, reason: '역동적인 액티비티와 유쾌한 추억을 쌓기 완벽한 레포츠 명소입니다.' },
      '12': { bonus: 26, reason: '다 함께 사진을 찍으며 활기찬 시간을 보내기 좋은 핫플레이스입니다.' },
      '14': { bonus: 22, reason: '다양한 전시와 이색 체험을 즐기기 좋은 문화 공간입니다.' },
      '15': { bonus: 24, reason: '흥겨운 분위기와 볼거리를 함께 즐길 수 있는 행사입니다.' },
      '39': { bonus: 24, reason: '함께 맛있는 음식을 즐기며 이야기 나누기 좋은 장소입니다.' },
    },
    fallback: { bonus: 10, reason: '친구들과 모여 부담 없이 방문하기 좋은 추천 장소입니다.' },
  },
  family: {
    types: {
      '12': { bonus: 30, reason: '부모님, 아이 등 온 가족이 여유롭게 산책하며 힐링하기 좋은 명소입니다.' },
      '14': { bonus: 26, reason: '다양한 연령대의 가족이 함께 유익한 시간을 보낼 수 있는 문화시설입니다.' },
      '28': { bonus: 22, reason: '온 가족이 함께 즐기며 활력을 찾을 수 있는 체험형 공간입니다.' },
    },
    fallback: { bonus: 10, reason: '가족 나들이 장소로 쾌적하게 방문하기 좋은 추천 명소입니다.' },
  },
  solo: {
    types: {
      '14': { bonus: 30, reason: '혼자만의 속도로 조용히 사색하며 여유롭게 관람하기 좋은 문화 공간입니다.' },
      '12': { bonus: 26, reason: '복잡한 일상에서 벗어나 혼자 천천히 거닐기 좋은 산책 명소입니다.' },
    },
    fallback: { bonus: 12, reason: '혼자만의 자유로운 여정을 즐기기에 부담 없는 추천 스팟입니다.' },
  },
};

/**
 * 인원수(1~6명)별 콘텐츠 유형 가감점
 */
const PEOPLE_FIT: Record<string, number[]> = {
  '14': [20, 18, 6, -4, -15, -20],
  '12': [2, 5, 10, 15, 20, 24],
  '28': [-12, -8, 6, 16, 23, 26],
  '39': [8, 10, 6, 0, -6, -10],
};

/** 인원 규모별 장소 특성 키워드 */
const PEOPLE_KEYWORDS = {
  small: {
    words: ['미술관', '갤러리', '산책로', '둘레길', '카페', '전망', '야경', '골목', '정원', '숲길', '도서관', '성곽'],
    bonus: 16,
  },
  medium: {
    words: ['체험', '박물관', '과학관', '식물원', '시장', '거리', '투어', '핫플', '복합문화', '한옥'],
    bonus: 15,
  },
  large: {
    words: ['테마파크', '어드벤처', '공원', '광장', '레포츠', '서핑', '캠핑', '유원지', '레일바이크', '스키', '카트', '짚라인', '수상', '아이스링크', '해수욕장', '대공원', '수목원'],
    bonus: 20,
  },
};

/** 동행 유형별 제목 가산 키워드 */
const TITLE_KEYWORDS: Record<Companion, string[]> = {
  couple: ['공원', '정원', '숲', '미술관', '갤러리', '전망', '야경', '카페', '한강', '해변', '바다'],
  friends: ['캠핑', '서핑', '카트', '레일바이크', '짚라인', '테마파크', '체험', '사격', '스키', '수상'],
  family: ['박물관', '과학관', '동물원', '수목원', '공원', '체험', '놀이', '어린이', '아쿠아'],
  solo: ['미술관', '갤러리', '도서관', '문학관', '사찰', '암', '숲길', '둘레길', '기념관'],
};

/** 실내/야외 판별 헬퍼 */
function isIndoorPlace(place: Place): boolean {
  if (place.contentTypeId === '14') {
    if (NON_TOURIST_KEYWORDS.some((k) => place.title.includes(k))) return false;
    return true;
  }
  const indoorWords = ['미술관', '박물관', '전시', '갤러리', '과학관', '도서관', '기념관', '실내', '아쿠아리움'];
  return indoorWords.some((w) => place.title.includes(w));
}

function isOutdoorPlace(place: Place): boolean {
  if (place.contentTypeId === '12' || place.contentTypeId === '28') return true;
  const outdoorWords = ['공원', '숲', '산', '해변', '바다', '산책', '둘레길', '정원', '광장', '수목원', '테마파크', '유원지', '캠핑'];
  return outdoorWords.some((w) => place.title.includes(w));
}

function getPeopleFitBonus(contentTypeId: string, people: number): number {
  const index = Math.min(Math.max(people, 1), 6) - 1;
  return PEOPLE_FIT[contentTypeId]?.[index] ?? 0;
}

function getPeopleKeywordBonus(title: string, people: number): { bonus: number; matchedLabel: string } {
  if (people <= 2) {
    const matched = PEOPLE_KEYWORDS.small.words.some((w) => title.includes(w));
    return matched
      ? { bonus: PEOPLE_KEYWORDS.small.bonus, matchedLabel: '2인 이하가 오붓하게 즐기기 좋은' }
      : { bonus: 0, matchedLabel: '' };
  } else if (people <= 4) {
    const matched = PEOPLE_KEYWORDS.medium.words.some((w) => title.includes(w));
    return matched
      ? { bonus: PEOPLE_KEYWORDS.medium.bonus, matchedLabel: `${people}명이 함께 둘러보기 딱 알맞은` }
      : { bonus: 0, matchedLabel: '' };
  } else {
    const matched = PEOPLE_KEYWORDS.large.words.some((w) => title.includes(w));
    return matched
      ? { bonus: PEOPLE_KEYWORDS.large.bonus, matchedLabel: `${people}인 단체가 넉넉하게 활동하기 좋은` }
      : { bonus: 0, matchedLabel: '' };
  }
}

function formatPeopleReason(contentTypeId: string, people: number, matchedLabel: string): string {
  if (people === 1) {
    return '[1인 추천] 혼자만의 속도로 조용히 힐링하며 둘러보기 좋습니다.';
  }
  if (people === 2) {
    const detail = matchedLabel ? `${matchedLabel} 분위기예요.` : '둘이서 여유롭게 대화 나누기 좋습니다.';
    return `[2인 오붓한 나들이] ${detail}`;
  }
  if (people <= 4) {
    const detail = matchedLabel ? `${matchedLabel} 명소예요.` : `${people}명이 함께 이동하며 추억을 쌓기 편리합니다.`;
    return `[${people}인 소그룹 맞춤] ${detail}`;
  }
  const detail = matchedLabel
    ? `${matchedLabel} 넓은 공간입니다.`
    : `${people}인 단체가 다 함께 쾌적하게 움직이고 즐기기 최적화된 장소예요.`;
  return `[${people}인 단체 추천] ${detail}`;
}

/**
 * 동행 관계, 인원수, 콘텐츠 유형, 날씨/환경에 따른 휴리스틱 점수 및 사유 산출
 */
function calculateScoreAndReason(place: Place, filters: Filters): ScoreDetail {
  const { companion, people, environment = 'all' } = filters;
  const { contentTypeId, title } = place;
  const rule = COMPANION_RULES[companion] ?? COMPANION_RULES.solo;
  const typeRule = rule.types[contentTypeId] ?? rule.fallback;

  const baseScore = 20;

  // 정보 완성도 가산점 (사진 +10점, 주소 +5점)
  let qualityBonus = 0;
  if (place.imageUrl && place.imageUrl.trim() !== '') qualityBonus += 10;
  if (place.address && place.address.trim() !== '') qualityBonus += 5;

  const keywordBonus = TITLE_KEYWORDS[companion]?.some((k) => title.includes(k)) ? 6 : 0;
  const groupFitBonus = getPeopleFitBonus(contentTypeId, people);
  const { bonus: peopleKeywordBonus, matchedLabel } = getPeopleKeywordBonus(title, people);

  // 날씨/환경(실내 vs 야외) 가감점 (+35점 / -25점)
  let envBonus = 0;
  let envPrefix = '';
  const isIndoor = isIndoorPlace(place);
  const isOutdoor = isOutdoorPlace(place);

  if (environment === 'indoor') {
    if (isIndoor) {
      envBonus = 35;
      envPrefix = '🏛️ [실내 맞춤] 날씨 걱정 없이 쾌적하게 머물 수 있는 ';
    } else {
      envBonus = -25;
    }
  } else if (environment === 'outdoor') {
    if (isOutdoor) {
      envBonus = 35;
      envPrefix = '🍃 [야외 맞춤] 맑은 공기와 풍경을 만끽할 수 있는 ';
    } else {
      envBonus = -25;
    }
  }

  // ★ 1. 비관광 공공/복지/체육 시설 강력 감점 (-50점)
  const isNonTourist = NON_TOURIST_KEYWORDS.some((k) => title.includes(k));
  const touristFilterPenalty = isNonTourist ? -50 : 0;

  // ★ 2. 대표 관광 명소 & 랜드마크 인증 가산점 (+20점)
  const isFamousTourist = !isNonTourist && FAMOUS_TOURIST_KEYWORDS.some((k) => title.includes(k));
  const famousTouristBonus = isFamousTourist ? 20 : 0;
  const landmarkTag = isFamousTourist ? '⭐ [대표 명소] ' : '';

  const rawScore =
    baseScore +
    typeRule.bonus +
    qualityBonus +
    keywordBonus +
    groupFitBonus +
    peopleKeywordBonus +
    envBonus +
    touristFilterPenalty +
    famousTouristBonus;

  const score = Math.max(10, Math.min(100, rawScore));
  const peopleReasonText = formatPeopleReason(contentTypeId, people, matchedLabel);
  const reason = isNonTourist
    ? `지역 공공·복지 편의 시설입니다. ${typeRule.reason}`
    : `${landmarkTag}${envPrefix}${peopleReasonText} ${typeRule.reason}`;

  return { score, reason };
}

function tieBreaker(id: string, filters: Filters): number {
  const seed = `${id}|${filters.companion}|${filters.people}|${filters.environment || 'all'}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getMaxQuotaForType(contentTypeId: string, people: number, environment: Environment = 'all'): number {
  if (environment === 'indoor') {
    if (contentTypeId === '14') return 6;
    return 2;
  }
  if (environment === 'outdoor') {
    if (contentTypeId === '12' || contentTypeId === '28') return 6;
    return 1;
  }

  if (people <= 2) {
    if (contentTypeId === '14') return 4;
    if (contentTypeId === '28') return 1;
    return 3;
  }
  if (people >= 5) {
    if (contentTypeId === '28' || contentTypeId === '12') return 4;
    if (contentTypeId === '14') return 1;
    return 3;
  }
  return 3;
}

/**
 * 관광공사 Place 목록을 받아 동행 조건, 인원수, 환경에 따라 최적의 추천 장소를 반환합니다.
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

  // 2. 지역 코드 일치 우선
  const targetPlaces = uniquePlaces.filter((p) => !filters.areaCode || p.areaCode === filters.areaCode);
  const candidatePlaces = targetPlaces.length > 0 ? targetPlaces : uniquePlaces;

  // 3. 점수 계산 후 정렬
  const evaluatedPlaces = candidatePlaces
    .map((place) => ({ ...place, ...calculateScoreAndReason(place, filters) }))
    .sort((a, b) => b.score - a.score || tieBreaker(a.id, filters) - tieBreaker(b.id, filters));

  // 4. 인원수 & 환경 맞춤 동적 쿼터 적용
  const picked: RecommendedPlace[] = [];
  const typeCount = new Map<string, number>();

  for (const place of evaluatedPlaces) {
    const maxQuota = getMaxQuotaForType(place.contentTypeId, filters.people, filters.environment);
    const count = typeCount.get(place.contentTypeId) ?? 0;
    if (count >= maxQuota) continue;

    typeCount.set(place.contentTypeId, count + 1);
    picked.push(place);
    if (picked.length === MAX_RESULTS) break;
  }

  // 쿼터 미달 시 나머지 채우기
  if (picked.length < MAX_RESULTS) {
    const pickedIds = new Set(picked.map((p) => p.id));
    for (const place of evaluatedPlaces) {
      if (picked.length === MAX_RESULTS) break;
      if (!pickedIds.has(place.id)) {
        picked.push(place);
        pickedIds.add(place.id);
      }
    }
  }

  picked.sort((a, b) => b.score - a.score);
  return picked;
}
