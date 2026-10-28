import { Filters, Place, RecommendedPlace, Companion } from './types';

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

interface ScoreDetail {
  score: number;
  reason: string;
}

/**
 * 동행 관계, 인원수, 콘텐츠 유형에 따른 휴리스틱 점수 및 추천 사유 산출
 */
function calculateScoreAndReason(place: Place, filters: Filters): ScoreDetail {
  const { companion, people } = filters;
  const { contentTypeId, title } = place;

  const baseScore = 50; // 기본 점수
  let typeBonus = 0;
  let companionReason = '';

  // 1. 동행자 유형별 선호도 점수 산출
  switch (companion) {
    case 'couple': // 연인: 자연 경관, 분위기 좋은 문화시설, 맛집 선호
      if (contentTypeId === '12') {
        typeBonus = 30;
        companionReason = '연인과 함께 아름다운 경치를 감상하며 로맨틱한 산책을 즐기기 좋은 명소입니다.';
      } else if (contentTypeId === '14') {
        typeBonus = 30;
        companionReason = '연인과 오붓하게 둘러보며 대화를 나누기 좋은 감성적인 문화·예술 공간입니다.';
      } else if (contentTypeId === '39') {
        typeBonus = 20;
        companionReason = '데이트 코스로 함께 들르기 좋은 식도락 장소입니다.';
      } else {
        typeBonus = 10;
        companionReason = '둘만의 특별한 추억을 남길 수 있는 데이트 코스입니다.';
      }
      break;

    case 'friends': // 친구: 액티비티(레포츠), 테마파크, 활기찬 관광지 선호
      if (contentTypeId === '28') {
        typeBonus = 35;
        companionReason = '친구들과 함께 역동적인 액티비티와 즐거운 추억을 쌓기 완벽한 레포츠 명소입니다.';
      } else if (contentTypeId === '12') {
        typeBonus = 30;
        companionReason = '친구들과 다 함께 사진을 찍으며 활기찬 시간을 보내기 좋은 핫플레이스입니다.';
      } else if (contentTypeId === '14') {
        typeBonus = 25;
        companionReason = '친구들과 함께 다양한 전시와 이색 체험을 즐기기 좋은 문화 공간입니다.';
      } else if (contentTypeId === '15' || contentTypeId === '39') {
        typeBonus = 25;
        companionReason = '친구들과 함께 맛있는 음식과 흥겨운 분위기를 즐길 수 있는 장소입니다.';
      } else {
        typeBonus = 10;
        companionReason = '친구들과 모여 부담 없이 방문하기 좋은 추천 장소입니다.';
      }
      break;

    case 'family': // 가족: 남녀노소 즐기기 좋은 자연 명소, 역사/체험형 문화시설 선호
      if (contentTypeId === '12') {
        typeBonus = 35;
        companionReason = '부모님, 아이 등 온 가족이 여유롭게 산책하며 힐링하기 최적의 자연 명소입니다.';
      } else if (contentTypeId === '14') {
        typeBonus = 30;
        companionReason = '다양한 연령대의 가족 구성원이 함께 유익한 시간과 관람을 즐길 수 있는 문화시설입니다.';
      } else if (contentTypeId === '28') {
        typeBonus = 20;
        companionReason = '온 가족이 함께 즐기며 활력을 찾을 수 있는 체험형 공간입니다.';
      } else {
        typeBonus = 10;
        companionReason = '가족 나들이 장소로 쾌적하게 방문하기 좋은 추천 명소입니다.';
      }
      break;

    case 'solo': // 혼자: 여유로운 사색의 문화공간, 힐링 자연 산책로 선호
    default:
      if (contentTypeId === '14') {
        typeBonus = 35;
        companionReason = '혼자만의 속도로 조용히 사색하며 여유롭게 관람하기 좋은 문화·예술 공간입니다.';
      } else if (contentTypeId === '12') {
        typeBonus = 30;
        companionReason = '복잡한 일상에서 벗어나 혼자 힐링하며 천천히 거닐기 좋은 산책 명소입니다.';
      } else {
        typeBonus = 15;
        companionReason = '혼자만의 자유로운 여정을 즐기기에 부담 없는 추천 스팟입니다.';
      }
      break;
  }

  // 2. 정보 완성도 가산점 (사진 +10점, 상세 주소 +5점)
  let qualityBonus = 0;
  if (place.imageUrl && place.imageUrl.trim() !== '') {
    qualityBonus += 10;
  }
  if (place.address && place.address.trim() !== '') {
    qualityBonus += 5;
  }

  // 3. 인원수 가산점
  let groupBonus = 0;
  if (people >= 4) {
    // 4명 이상 단체: 공간이 넓은 자연 관광지나 액티비티에 가산점
    if (contentTypeId === '12' || contentTypeId === '28') {
      groupBonus += 10;
      companionReason += ` (${people}인 단체가 쾌적하게 머무르기 좋은 넓은 야외 공간)`;
    } else {
      groupBonus += 5;
    }
  } else if (people === 1 && companion === 'solo') {
    if (contentTypeId === '14') {
      groupBonus += 5;
    }
  }

  const totalScore = baseScore + typeBonus + qualityBonus + groupBonus;

  return {
    score: totalScore,
    reason: companionReason,
  };
}

/**
 * 관광공사 Place 목록을 받아 동행 조건 및 인원수에 따라 최적의 추천 장소를 반환합니다.
 *
 * @param places 원본 관광지 목록
 * @param filters 지역, 동행자 유형, 인원수 필터
 * @returns 점수 내림차순, 동점 시 가나다순으로 정렬된 최대 6개 추천 목록
 */
export function recommendPlaces(
  places: Place[],
  filters: Filters
): RecommendedPlace[] {
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

  // 2. 지역 코드(areaCode)가 필터와 일치하는 항목 우선 처리
  // (외부에서 필터링되지 않고 전체 목록이 전달되었을 경우를 대비)
  const targetPlaces = uniquePlaces.filter(
    (p) => !filters.areaCode || p.areaCode === filters.areaCode
  );

  // 지역에 맞는 관광지가 없으면 전체 고유 목록을 대상으로 추천 진행
  const candidatePlaces = targetPlaces.length > 0 ? targetPlaces : uniquePlaces;

  // 3. 각 장소별 점수 및 추천 사유 계산
  const evaluatedPlaces: RecommendedPlace[] = candidatePlaces.map((place) => {
    const { score, reason } = calculateScoreAndReason(place, filters);
    return {
      ...place,
      score,
      reason,
    };
  });

  // 4. 정렬: 점수 내림차순 -> 동점일 경우 한글 제목 오름차순(가나다순)
  evaluatedPlaces.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.title.localeCompare(b.title, 'ko');
  });

  // 5. 최대 6개 반환
  return evaluatedPlaces.slice(0, 6);
}
