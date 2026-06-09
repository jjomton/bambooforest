/**
 * 비속어 필터링 유틸리티
 */

// 테스트 및 실제 검증용 비속어 목록
const PROFANITY_WORDS = [
  '바보',
  '멍청이',
  '쓰레기',
  '시발',
  '개새끼',
  '미친',
  '존나',
  '썅',
  '병신'
];

/**
 * 입력된 텍스트에 비속어가 포함되어 있는지 확인합니다.
 * 공백을 무시하여 '시 발' 등 우회하려는 패턴도 부분적으로 감지합니다.
 */
export const containsProfanity = (text: string): boolean => {
  if (!text) return false;
  
  const cleanedText = text.replace(/\s+/g, '').toLowerCase();
  
  return PROFANITY_WORDS.some((word) => cleanedText.includes(word));
};

/**
 * 발견된 비속어 목록을 배열로 반환합니다. (사용자 안내용)
 */
export const getDetectedProfanities = (text: string): string[] => {
  if (!text) return [];
  
  const cleanedText = text.replace(/\s+/g, '').toLowerCase();
  
  return PROFANITY_WORDS.filter((word) => cleanedText.includes(word));
};
