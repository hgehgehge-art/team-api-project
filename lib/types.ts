export type Companion = 'couple' | 'friends' | 'family' | 'solo';
export type Environment = 'all' | 'indoor' | 'outdoor';

export interface Filters {
  areaCode: string;        // 예: 서울 '1' (TourAPI 실제 지역 코드)
  companion: Companion;
  people: number;          // 1 ~ 6명
  environment?: Environment; // 날씨/공간 맞춤: 전체('all') | 실내 중심('indoor') | 야외 중심('outdoor')
}

export interface Place {
  id: string;
  title: string;
  address: string;
  imageUrl: string | null;
  contentTypeId: string;   // 한국관광공사 관광지 유형 코드 (예: 12-관광지, 14-문화시설, 15-축제공연, 28-레포츠 등)
  areaCode: string;
  latitude: number | null;
  longitude: number | null;
}

export interface RecommendedPlace extends Place {
  score: number;
  reason: string;
}
