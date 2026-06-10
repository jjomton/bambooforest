import { useState } from 'react';
import { 
  Shield, 
  Terminal, 
  ArrowRight, 
  ExternalLink, 
  Lock, 
  Mail, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  EyeOff, 
  Cpu, 
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const GithubIcon = () => (
  <svg className="w-4 h-4 animate-pulse-slow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export function Portfolio() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'rls' | 'moderation'>('architecture');
  const [openTrouble, setOpenTrouble] = useState<number | null>(null);

  const toggleTrouble = (index: number) => {
    if (openTrouble === index) {
      setOpenTrouble(null);
    } else {
      setOpenTrouble(index);
    }
  };

  const troubleshootingList = [
    {
      title: "PowerShell 실행 보안 장애 (UnauthorizedAccess)",
      desc: "Windows OS의 PowerShell 기본 보안 정책 제한으로 인해 로컬 npm CLI 스크립트 실행이 전면 차단되는 장애를 겪었습니다.",
      cause: "Windows의 기본 ExecutionPolicy가 'Restricted'로 설정되어 로컬 스크립트의 서명이 검증되지 않아 작동이 제한되었습니다.",
      solution: "CMD 터미널 세션 또는 스크립트 호출 시 '-ExecutionPolicy Bypass' 옵션을 활용하여 현재 세션 범위 내 권한을 우회하도록 구성함으로써 빌드 및 개발 환경을 정상화하였습니다."
    },
    {
      title: "노션 API 404 데이터베이스 찾기 실패 (object_not_found)",
      desc: "개발 에러 아카이빙을 위한 Notion API 연동 중 봇이 데이터베이스를 찾지 못하고 404 에러를 반환하는 문제가 있었습니다.",
      cause: "Notion API 통합(Integration) 봇이 생성되었으나, 타겟 데이터베이스 페이지에 명시적으로 커넥션 추가(Connection) 권한을 공유하지 않아 접근 권한 부족이 발생했습니다.",
      solution: "노션 데이터베이스 우측 상단 '연결 추가' 메뉴에서 'bambooforest' 봇을 명시적으로 연결하여 API 동기화 통신을 최종 개방하였습니다."
    },
    {
      title: "Vite 빌드 타입 불일치 에러 (TS2741: Property 'is_blinded' is missing)",
      desc: "안정화 및 빌드 과정에서 TypeScript 타입 정적 분석 시 번들링 컴파일 에러가 발생하여 빌드가 중단되었습니다.",
      cause: "신규 개발된 신고 및 자동 블라인드 정책에 따라 댓글 데이터 타입이 확장되었으나, 테스트를 위해 생성된 기존 Mock 데이터 객체에 필수 속성인 'is_blinded'가 누락되어 검파일 에러를 유발했습니다.",
      solution: "Mock Comment 데이터 객체들의 선언부에 'is_blinded: false' 기본값을 일괄 보완 및 선언하여 빌드 컴파일을 성공시켰습니다."
    },
    {
      title: "Git Author 식별자 미지정 장애 (Author identity unknown)",
      desc: "협업 환경 초기화 중 코드 커밋 및 머지 시도가 거부되며 Git 프로세스가 중단되는 문제가 발생하였습니다.",
      cause: "개발 로컬 Git 설정에 유저 이메일과 이름 정보가 지정되지 않아 커밋의 소유자를 식별할 수 없는 상황이었습니다.",
      solution: "git config 설정을 통하여 변영진 총괄의 식별 정보(byj1230@gmail.com)를 등록하여 협업 개발 흐름을 마무리지었습니다."
    }
  ];

  return (
    <div className="portfolio-root min-height-screen bg-gray-950 text-gray-100 selection:bg-emerald-500 selection:text-black">
      
      {/* 1. 네비게이션 바 */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-gray-950/80 border-b border-gray-900 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-gradient-emerald">Youngjin.Dev</span>
          </div>
          <nav className="hidden md:flex space-x-8 text-sm font-medium text-gray-400">
            <a href="#about" className="hover:text-emerald-400 transition-colors">소개</a>
            <a href="#tech" className="hover:text-emerald-400 transition-colors">기술 스택</a>
            <a href="#project" className="hover:text-emerald-400 transition-colors">대표 프로젝트</a>
            <a href="#trouble" className="hover:text-emerald-400 transition-colors">트러블슈팅</a>
          </nav>
          <div>
            <a 
              href="#/board" 
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2 rounded-full shadow-lg transition-glow cursor-pointer"
            >
              <span>대나무숲 서비스 가기</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* 2. 히어로 섹션 */}
      <section id="about" className="relative pt-20 pb-16 px-6 overflow-hidden">
        {/* 장식용 배경 광원 */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-xs font-semibold mb-6">
            <Shield className="w-3.5 h-3.5" />
            <span>보안 아키텍처 및 빌드 자동화 전문가</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            안전한 아키텍처와 <br className="md:hidden" />
            <span className="text-gradient-emerald">자동화 인프라</span>를 설계합니다
          </h1>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            안녕하세요. <strong>개발 총괄 변영진</strong>입니다. <br />
            보안과 성능의 시너지를 중시하며, Supabase RLS 기반의 철저한 익명 권한 제어와 Notion API 연동을 통한 빌드 자동화를 설계 및 구축합니다.
          </p>
          
          <div className="flex justify-center space-x-4">
            <a 
              href="https://github.com/jjomton/bambooforest" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center space-x-2 bg-gray-900 border border-gray-800 hover:border-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              <GithubIcon />
              <span>GitHub 레포지토리</span>
            </a>
            <a 
              href="mailto:byj1230@gmail.com"
              className="inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>연락하기</span>
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto divider-gradient" />

      {/* 3. 기술 스택 섹션 */}
      <section id="tech" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">기술 스택 (Tech Stack)</h2>
            <p className="text-sm text-gray-400 mt-2">프로젝트 설계 및 구현에 핵심적으로 활용된 핵심 기술입니다.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Backend & Security */}
            <div className="portfolio-card p-6">
              <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-4">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">Backend & Security</h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                Supabase, PostgreSQL, RLS(Row Level Security) 정책을 기반으로 서버리스 아키텍처를 설계하여 강력한 익명 보안 인프라를 구축했습니다.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-900 border border-gray-800 text-emerald-400 text-xs px-2.5 py-1 rounded-md">Supabase</span>
                <span className="bg-gray-900 border border-gray-800 text-emerald-400 text-xs px-2.5 py-1 rounded-md">PostgreSQL</span>
                <span className="bg-gray-900 border border-gray-800 text-emerald-400 text-xs px-2.5 py-1 rounded-md">RLS Policies</span>
              </div>
            </div>

            {/* Frontend */}
            <div className="portfolio-card p-6">
              <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">Frontend</h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                React 19와 TypeScript를 적용하여 정적 안정성을 보장하고, Vite 및 Tailwind CSS v4를 이용하여 반응형 고품질 UI를 고속 렌더링합니다.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-900 border border-gray-800 text-blue-400 text-xs px-2.5 py-1 rounded-md">React 19</span>
                <span className="bg-gray-900 border border-gray-800 text-blue-400 text-xs px-2.5 py-1 rounded-md">TypeScript</span>
                <span className="bg-gray-900 border border-gray-800 text-blue-400 text-xs px-2.5 py-1 rounded-md">Tailwind v4</span>
              </div>
            </div>

            {/* Automation & DevOps */}
            <div className="portfolio-card p-6">
              <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mb-4">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white">DevOps & Automation</h3>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                GitHub Actions를 이용한 CI/CD 및 Node.js 스크립트 기반의 Notion API 동기화 자동화를 개발하여 프로젝트 자산화 프로세스를 효율화했습니다.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="bg-gray-900 border border-gray-800 text-purple-400 text-xs px-2.5 py-1 rounded-md">GitHub Actions</span>
                <span className="bg-gray-900 border border-gray-800 text-purple-400 text-xs px-2.5 py-1 rounded-md">Notion API</span>
                <span className="bg-gray-900 border border-gray-800 text-purple-400 text-xs px-2.5 py-1 rounded-md">Netlify CI/CD</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto divider-gradient" />

      {/* 4. 대표 프로젝트 섹션 */}
      <section id="project" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">대표 프로젝트 (Featured Project)</h2>
            <p className="text-sm text-gray-400 mt-2">완벽한 보안성을 자랑하는 익명 피드백 소통 창구</p>
          </div>

          <div className="portfolio-card p-6 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-6 border-b border-gray-900 gap-4">
              <div>
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">BaaS Serverless Architecture</span>
                <h3 className="text-xl md:text-2xl font-bold text-white mt-1">🎋 휴먼센터 대나무숲 (Human Bamboo Forest)</h3>
              </div>
              <div>
                <a 
                  href="#/board" 
                  className="inline-flex items-center space-x-2 bg-emerald-950 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-900 transition-all cursor-pointer"
                >
                  <span>라이브 데모 실행</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-sm">
              <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-900">
                <span className="text-gray-400 block mb-1">담당 역할</span>
                <span className="font-semibold text-white">개발 총괄, Supabase 보안 및 RLS 설계, Notion API 및 CI/CD 구축</span>
              </div>
              <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-900">
                <span className="text-gray-400 block mb-1">개발 스택</span>
                <span className="font-semibold text-white">React 19, TypeScript, Tailwind v4, Supabase (PostgreSQL, Realtime)</span>
              </div>
              <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-900">
                <span className="text-gray-400 block mb-1">핵심 성과</span>
                <span className="font-semibold text-white">섀도 매핑 테이블을 이용한 작성자 비노출 구현, 3회 신고 시 자동 블라인드 트리거 구축</span>
              </div>
            </div>

            {/* 인터랙티브 분석 탭 영역 */}
            <div className="bg-gray-950/80 rounded-2xl border border-gray-900 overflow-hidden">
              <div className="flex border-b border-gray-900 text-xs md:text-sm font-semibold bg-gray-900/30">
                <button 
                  onClick={() => setActiveTab('architecture')}
                  className={`flex-1 py-4 text-center border-b-2 transition-all cursor-pointer ${activeTab === 'architecture' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                >
                  시스템 아키텍처
                </button>
                <button 
                  onClick={() => setActiveTab('rls')}
                  className={`flex-1 py-4 text-center border-b-2 transition-all cursor-pointer ${activeTab === 'rls' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                >
                  섀도 매핑 RLS 보안
                </button>
                <button 
                  onClick={() => setActiveTab('moderation')}
                  className={`flex-1 py-4 text-center border-b-2 transition-all cursor-pointer ${activeTab === 'moderation' ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5' : 'border-transparent text-gray-400 hover:text-gray-200'}`}
                >
                  자동 모더레이션 엔진
                </button>
              </div>

              <div className="p-6 text-sm leading-relaxed text-gray-300">
                {activeTab === 'architecture' && (
                  <div>
                    <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-emerald-400" />
                      서버리스 DB 기반 실시간 아키텍처
                    </h4>
                    <p className="mb-4 text-gray-400">
                      별도의 백엔드 WAS 서버를 구축하지 않고, Supabase BaaS 인프라를 활용하여 프런트엔드에서 데이터베이스와 직접 실시간 보안 통신을 수행하도록 아키텍처를 설계하였습니다.
                    </p>
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-xs font-mono overflow-x-auto">
                      <div className="text-gray-400">// 아키텍처 주요 제어 흐름</div>
                      <div className="text-emerald-400">React SPA Client </div>
                      <div className="text-gray-500">  └─ (Supabase API Call via JWT)</div>
                      <div className="text-emerald-400">    └─ Supabase Auth & RLS Rule (인가 검증)</div>
                      <div className="text-gray-500">      ├─ PostgreSQL Database (익명 적재)</div>
                      <div className="text-gray-500">      └─ Realtime Socket (대댓글 실시간 수신 및 렌더링)</div>
                    </div>
                  </div>
                )}

                {activeTab === 'rls' && (
                  <div>
                    <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      섀도 매핑 테이블(Shadow Mapping Table) 패턴
                    </h4>
                    <p className="mb-3 text-gray-400">
                      사용자의 수정 및 삭제 권한을 제어하되, 타인에게 작성자 식별자(user_id)가 절대로 노출되지 않도록 하는 **섀도 매핑 테이블 설계**를 주도하였습니다.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mb-4 text-gray-400">
                      <li>
                        <strong className="text-white">분리 설계:</strong> <code>posts</code> 테이블에는 외래키(user_id)를 두지 않고, 비밀 테이블인 <code>post_authors</code>에 매핑 정보를 숨깁니다.
                      </li>
                      <li>
                        <strong className="text-white">DB Trigger 활용:</strong> 작성 시 보안 세션인 <code>auth.uid()</code>를 데이터베이스 트리거 내에서 추출하여 섀도 테이블에 자동으로 기록합니다.
                      </li>
                      <li>
                        <strong className="text-white">RLS 정책:</strong> <code>post_authors</code>는 오직 본인 외에는 조회할 수 없도록 격리하고, 수정/삭제 시 섀도 테이블의 관계를 대조하여 소유권을 검증합니다.
                      </li>
                    </ul>
                    <div className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl flex items-start space-x-3">
                      <EyeOff className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-emerald-300">
                        이를 통해 클라이언트의 API 응답 데이터 패킷 분석 시에도 작성자와 게시글 간의 연결 관계를 수학적으로 차단하여 수강생들의 완벽한 비밀 보장을 보장합니다.
                      </span>
                    </div>
                  </div>
                )}

                {activeTab === 'moderation' && (
                  <div>
                    <h4 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-emerald-400" />
                      3회 신고 누적 시 자동 블라인드 시스템
                    </h4>
                    <p className="mb-3 text-gray-400">
                      커뮤니티의 자정 능력을 위해 비속어 입력 방지 필터링과 신고 연동 블라인드 트리거를 기획 및 구현하였습니다.
                    </p>
                    <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-xs font-mono space-y-1 mb-4 text-gray-400">
                      <div><span className="text-purple-400">CREATE TRIGGER</span> handle_auto_blind</div>
                      <div><span className="text-purple-400">AFTER INSERT ON</span> reports</div>
                      <div><span className="text-purple-400">FOR EACH ROW EXECUTE FUNCTION</span> public.handle_auto_blind();</div>
                      <div className="text-emerald-500 mt-2">// Trigger Function Logic:</div>
                      <div>- 타겟 글의 누적 신고 수(Report Count) 집계</div>
                      <div>- 신고 수가 3회 이상일 시 target_table.is_blinded = TRUE 자동 반영</div>
                    </div>
                    <p className="text-gray-400 text-xs">
                      동시에 프런트엔드에서 공백 및 특수문자 우회를 방어하는 정규식 기반 비속어 필터 알고리즘(<code>profanityFilter.ts</code>)을 내재화하여 비방 행위를 원천 차단합니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto divider-gradient" />

      {/* 5. 트러블 슈팅 섹션 */}
      <section id="trouble" className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">트러블슈팅 및 장애 조치 (Troubleshooting)</h2>
            <p className="text-sm text-gray-400 mt-2">프로젝트 진행 중 겪은 문제를 기술적으로 아카이빙하고 극복한 기록입니다.</p>
          </div>

          <div className="space-y-4">
            {troubleshootingList.map((item, index) => (
              <div 
                key={index} 
                className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden transition-all duration-200"
              >
                <button 
                  onClick={() => toggleTrouble(index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-800/40 transition-colors focus:outline-none cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                      0{index + 1}
                    </span>
                    <span className="font-bold text-white text-sm md:text-base">{item.title}</span>
                  </div>
                  {openTrouble === index ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>

                {openTrouble === index && (
                  <div className="px-6 pb-6 pt-2 text-sm text-gray-300 border-t border-gray-800 bg-gray-950/40 space-y-3">
                    <p className="text-gray-400">{item.desc}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="bg-red-950/10 border border-red-500/10 p-4 rounded-xl">
                        <span className="text-xs text-red-400 font-bold block mb-1">원인 분석 (Root Cause)</span>
                        <span className="text-xs text-gray-300 leading-relaxed">{item.cause}</span>
                      </div>
                      <div className="bg-emerald-950/10 border border-emerald-500/10 p-4 rounded-xl">
                        <span className="text-xs text-emerald-400 font-bold block mb-1">해결 및 조치 (Resolution)</span>
                        <span className="text-xs text-gray-300 leading-relaxed">{item.solution}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. 푸터 */}
      <footer className="border-t border-gray-900 py-12 px-6 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p>© 2026 Youngjin Byun. All rights reserved.</p>
          </div>
          <div className="flex space-x-6">
            <a href="https://github.com/jjomton/bambooforest" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition-colors">
              GitHub
            </a>
            <a href="mailto:byj1230@gmail.com" className="hover:text-emerald-400 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
