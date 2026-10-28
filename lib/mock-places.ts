import { Place } from './types';

/**
 * 한국관광공사 TourAPI contentTypeId 참고:
 * - 12: 관광지 (자연/명소)
 * - 14: 문화시설 (박물관, 미술관 등)
 * - 15: 축제공연행사
 * - 28: 레포츠 (액티비티)
 * - 38: 쇼핑
 * - 39: 음식점
 *
 * areaCode 참고:
 * - '1': 서울
 * - '6': 부산
 * - '32': 강원
 * - '39': 제주
 */
export const MOCK_PLACES: Place[] = [
  // --- 서울 (areaCode: '1') ---
  {
    id: 'mock-seoul-1',
    title: '경복궁 & 국립민속박물관',
    address: '서울특별시 종로구 사직로 161',
    imageUrl: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
    contentTypeId: '12', // 관광지(역사)
    areaCode: '1',
    latitude: 37.5796,
    longitude: 126.9770,
  },
  {
    id: 'mock-seoul-2',
    title: '국립현대미술관 서울관',
    address: '서울특별시 종로구 삼청로 30',
    imageUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80',
    contentTypeId: '14', // 문화시설
    areaCode: '1',
    latitude: 37.5788,
    longitude: 126.9806,
  },
  {
    id: 'mock-seoul-3',
    title: '남산서울타워 & 둘레길 산책로',
    address: '서울특별시 용산구 남산공원길 105',
    imageUrl: 'https://images.unsplash.com/photo-1578637387939-43c525550085?auto=format&fit=crop&w=800&q=80',
    contentTypeId: '12', // 관광지(자연/전망)
    areaCode: '1',
    latitude: 37.5512,
    longitude: 126.9882,
  },
  {
    id: 'mock-seoul-4',
    title: '잠실 롯데월드 어드벤처 & 아이스링크',
    address: '서울특별시 송파구 올림픽로 240',
    imageUrl: 'https://images.unsplash.com/photo-1513889961551-628c1e5e2ee9?auto=format&fit=crop&w=800&q=80',
    contentTypeId: '28', // 레포츠/테마파크
    areaCode: '1',
    latitude: 37.5111,
    longitude: 127.0982,
  },
  {
    id: 'mock-seoul-5',
    title: '서울숲공원 & 곤충식물원',
    address: '서울특별시 성동구 뚝섬로 273',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    contentTypeId: '12', // 관광지(자연)
    areaCode: '1',
    latitude: 37.5444,
    longitude: 127.0374,
  },
  {
    id: 'mock-seoul-6',
    title: '동대문 디자인 플라자 (DDP) 전시관',
    address: '서울특별시 중구 을지로 281',
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
    contentTypeId: '14', // 문화시설
    areaCode: '1',
    latitude: 37.5670,
    longitude: 127.0094,
  },
  {
    id: 'mock-seoul-7',
    title: '광장시장 먹거리 골목',
    address: '서울특별시 종로구 창경궁로 88',
    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    contentTypeId: '39', // 음식점
    areaCode: '1',
    latitude: 37.5701,
    longitude: 126.9998,
  },

  // --- 부산 (areaCode: '6') ---
  {
    id: 'mock-busan-1',
    title: '해운대 해변열차 & 블루라인파크',
    address: '부산광역시 해운대구 달맞이길62번길 13',
    imageUrl: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80',
    contentTypeId: '28', // 레포츠/체험
    areaCode: '6',
    latitude: 35.1601,
    longitude: 129.1738,
  },
  {
    id: 'mock-busan-2',
    title: '감천문화마을',
    address: '부산광역시 사하구 감내2로 203',
    imageUrl: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=800&q=80',
    contentTypeId: '12', // 관광지
    areaCode: '6',
    latitude: 35.0975,
    longitude: 129.0106,
  },
  {
    id: 'mock-busan-3',
    title: '부산시립미술관',
    address: '부산광역시 해운대구 APEC로 58',
    imageUrl: 'https://images.unsplash.com/photo-1544531585-9847b68c8c86?auto=format&fit=crop&w=800&q=80',
    contentTypeId: '14', // 문화시설
    areaCode: '6',
    latitude: 35.1661,
    longitude: 129.1378,
  },
  {
    id: 'mock-busan-4',
    title: '광안리 해수욕장 & 드론쇼 관람존',
    address: '부산광역시 수영구 광안해변로 219',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    contentTypeId: '12', // 관광지(자연)
    areaCode: '6',
    latitude: 35.1532,
    longitude: 129.1186,
  },

  // --- 제주 (areaCode: '39') ---
  {
    id: 'mock-jeju-1',
    title: '성산일출봉',
    address: '제주특별자치도 서귀포시 성산읍 일출로 284-12',
    imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    contentTypeId: '12', // 관광지(자연)
    areaCode: '39',
    latitude: 33.4581,
    longitude: 126.9426,
  },
  {
    id: 'mock-jeju-2',
    title: '아르떼뮤지엄 제주',
    address: '제주특별자치도 제주시 애월읍 어림비로 478',
    imageUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=800&q=80',
    contentTypeId: '14', // 문화시설
    areaCode: '39',
    latitude: 33.3970,
    longitude: 126.3571,
  },
  {
    id: 'mock-jeju-3',
    title: '9.81 파크 제주 (무동력 레이싱)',
    address: '제주특별자치도 제주시 애월읍 천덕로 880-24',
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80',
    contentTypeId: '28', // 레포츠
    areaCode: '39',
    latitude: 33.3891,
    longitude: 126.3712,
  },
  {
    id: 'mock-jeju-4',
    title: '사려니숲길',
    address: '제주특별자치도 제주시 조천읍 교래리 산 137-1',
    imageUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    contentTypeId: '12', // 관광지(자연)
    areaCode: '39',
    latitude: 33.4074,
    longitude: 126.6433,
  },
];
