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

interface ScoreDetail {
  score: number;
  reason: string;
}

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
 * 인원수(1~6명)별 콘텐츠 유형 가감점 (인덱스 = 인원수 - 1)
 * 인원수 변화에 따른 점수 격차를 대폭 확대하여 순위 역전이 체감되도록 설계:
 * - 1~2명: 조용한 실내 문화시설/미술관에 큰 가산점(+18~20점), 복잡한 레포츠 감점(-8~12점)
 * - 5~6명: 넓은 야외 및 대형 레포츠에 큰 가산점(+20~25점), 소음/혼잡 우려 실내 문화시설 감점(-15~20점)
 */
const PEOPLE_FIT: Record<string, number[]> = {
  // 14: 문화시설 (박물관/미술관 등 실내)
  '14': [20, 18, 6, -4, -15, -20],
  // 12: 관광지 (자연/명소 야외)
  '12': [2, 5, 10, 15, 20, 24],
  // 28: 레포츠 (액티비티/유원지)
  '28': [-12, -8, 6, 16, 23, 26],
  // 39: 음식점 (식도락)
  '39': [8, 10, 6, 0, -6, -10],
};

/** 인원 규모별 장소 특성 키워드 (제목 매칭 시 가산점 부여) */
const PEOPLE_KEYWORDS = {
  // 1~2명: 조용하고 오붓한 소규모 공간
  small: {
    words: ['미술관', '갤러리', '산책로', '둘레길', '카페', '전망', '야경', '골목', '정원', '숲길', '도서관', '성곽'],
    bonus: 16,
  },
  // 3~4명: 소규모 그룹 체험 및 탐방
  medium: {
    words: ['체험', '박물관', '과학관', '식물원', '시장', '거리', '투어', '핫플', '복합문화', '한옥'],
    bonus: 15,
  },
  // 5~6명: 넓은 공간, 단체 활동, 대형 액티비티
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

function getPeopleFitBonus(contentTypeId: string, people: number): number {
  const index = Math.min(Math.max(people, 1), 6) - 1;
  return PEOPLE_FIT[contentTypeId]?.[index] ?? 0;
}

/** 인원수에 따른 장소 규모 키워드 매칭 보너스 계산 */
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
    // 5~6명 단체
    const matched = PEOPLE_KEYWORDS.large.words.some((w) => title.includes(w));
    return matched
      ? { bonus: PEOPLE_KEYWORDS.large.bonus, matchedLabel: `${people}인 단체가 넉넉하게 활동하기 좋은` }
      : { bonus: 0, matchedLabel: '' };
  }
}

/** 인원수 맞춤 추천 헤드라인/이유 생성 */
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
  // 5~6인 단체
  const detail = matchedLabel
    ? `${matchedLabel} 넓은 공간입니다.`
    : `${people}인 단체가 다 함께 쾌적하게 움직이고 즐기기 최적화된 장소예요.`;
  return `[${people}인 단체 추천] ${detail}`;
}

/**
 * 동행 관계, 인원수, 콘텐츠 유형에 따른 휴리스틱 점수 및 추천 사유 산출 (최대 100점)
 */
function calculateScoreAndReason(place: Place, filters: Filters): ScoreDetail {
  const { companion, people } = filters;
  const { contentTypeId, title } = place;
  const rule = COMPANION_RULES[companion] ?? COMPANION_RULES.solo;
  const typeRule = rule.types[contentTypeId] ?? rule.fallback;

  const baseScore = 25;

  // 정보 완성도 가산점 (사진 +10점, 주소 +5점)
  let qualityBonus = 0;
  if (place.imageUrl && place.imageUrl.trim() !== '') qualityBonus += 10;
  if (place.address && place.address.trim() !== '') qualityBonus += 5;

  // 동행 키워드 보너스
  const keywordBonus = TITLE_KEYWORDS[companion]?.some((k) => title.includes(k)) ? 6 : 0;

  // ★ 인원수 관련 핵심 보너스 (유형 적합도 + 규모 키워드 적합도)
  const groupFitBonus = getPeopleFitBonus(contentTypeId, people);
  const { bonus: peopleKeywordBonus, matchedLabel } = getPeopleKeywordBonus(title, people);

  const rawScore = baseScore + typeRule.bonus + qualityBonus + keywordBonus + groupFitBonus + peopleKeywordBonus;
  const score = Math.max(10, Math.min(100, rawScore));

  const peopleReasonText = formatPeopleReason(contentTypeId, people, matchedLabel);
  const reason = `${peopleReasonText} ${typeRule.reason}`;

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
 * 인원수에 따른 카테고리별 최대 허용 쿼터 계산
 * - 1~2명: 문화시설(14) 최대 4개, 레포츠(28) 최대 1개
 * - 5~6명: 레포츠(28)/야외(12) 최대 4~5개, 실내 문화시설(14) 최대 1개
 * - 3~4명: 균형 있게 각 3개씩
 */
function getMaxQuotaForType(contentTypeId: string, people: number): number {
  if (people <= 2) {
    if (contentTypeId === '14') return 4; // 1~2인은 문화시설 대거 추천
    if (contentTypeId === '28') return 1; // 1~2인은 레포츠 최소화
    return 3;
  }
  if (people >= 5) {
    if (contentTypeId === '28' || contentTypeId === '12') return 4; // 단체는 레포츠/넓은 관광지 위주
    if (contentTypeId === '14') return 1; // 단체는 좁은 실내 문화시설 제한
    return 3;
  }
  return 3; // 3~4인은 균형 분배
}

/**
 * 관광공사 Place 목록을 받아 동행 조건 및 인원수에 따라 최적의 추천 장소를 반환합니다.
 *
 * @param places 원본 관광지 목록
 * @param filters 지역, 동행자 유형, 인원수 필터
 * @returns 점수 내림차순, 인원수 맞춤 동적 쿼터 적용된 최대 6개 추천 목록
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

  // 4. 인원수 맞춤 동적 쿼터를 적용하여 최대 6개 선별
  const picked: RecommendedPlace[] = [];
  const typeCount = new Map<string, number>();

  for (const place of evaluatedPlaces) {
    const maxQuota = getMaxQuotaForType(place.contentTypeId, filters.people);
    const count = typeCount.get(place.contentTypeId) ?? 0;
    if (count >= maxQuota) continue;

    typeCount.set(place.contentTypeId, count + 1);
    picked.push(place);
    if (picked.length === MAX_RESULTS) break;
  }

  // 쿼터 제한으로 인해 6개가 안 찼다면 남은 상위 장소로 채움
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

  // 최종 점수순 정렬
  picked.sort((a, b) => b.score - a.score);

  return picked;
}
