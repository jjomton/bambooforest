import { containsProfanity, getDetectedProfanities } from '../src/lib/profanityFilter';

const testCases = [
  { text: '이것은 정상적인 건의사항입니다.', expected: false },
  { text: '너 정말 바보구나!', expected: true },
  { text: '이런 개새끼 같으니라고', expected: true },
  { text: '시    발  비속어 우회 테스트', expected: true }, // 공백 무시 테스트
  { text: '완벽하게 클린한 글', expected: false },
  { text: '미 친 거 아 닌 가 요 ?', expected: true } // 글자 사이 공백 테스트
];

console.log('=== 비속어 필터링 유틸리티 검증 테스트 ===\n');

let passed = 0;
testCases.forEach(({ text, expected }, index) => {
  const result = containsProfanity(text);
  const detected = getDetectedProfanities(text);
  const isMatch = result === expected;
  
  if (isMatch) passed++;
  
  console.log(`[테스트 ${index + 1}] ${isMatch ? '✅ 통과' : '❌ 실패'}`);
  console.log(`- 입력 텍스트: "${text}"`);
  console.log(`- 결과: ${result ? '비속어 감지됨' : '정상'}`);
  if (result) {
    console.log(`- 감지된 단어: ${detected.join(', ')}`);
  }
  console.log('----------------------------------------');
});

console.log(`\n결과 요약: ${testCases.length}개 중 ${passed}개 통과`);
