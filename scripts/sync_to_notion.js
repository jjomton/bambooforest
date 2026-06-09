import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// .env 환경변수 로드
dotenv.config();

const notionApiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.NOTION_DATABASE_ID;

if (!notionApiKey || !databaseId) {
  console.error('❌ 에러: .env 파일에 NOTION_API_KEY 또는 NOTION_DATABASE_ID가 누락되었습니다.');
  process.exit(1);
}

// Notion 클라이언트 초기화
const notion = new Client({ auth: notionApiKey });

// 실행 인자 확인
const filePath = process.argv[2];
if (!filePath) {
  console.error('❌ 에러: 동기화할 마크다운 파일 경로를 지정해 주세요.');
  console.log('👉 사용법: node scripts/sync_to_notion.js <마크다운파일경로>');
  process.exit(1);
}

const absolutePath = path.resolve(filePath);
if (!fs.existsSync(absolutePath)) {
  console.error(`❌ 에러: 파일을 찾을 수 없습니다. 경로: ${absolutePath}`);
  process.exit(1);
}

// 마크다운 파싱 및 노션 블록 변환 함수
function parseMarkdownToNotionBlocks(mdContent) {
  const lines = mdContent.split(/\r?\n/);
  const blocks = [];
  let currentCodeBlock = null;
  let codeLanguage = 'plain text';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 1. 코드 블록 처리
    if (line.trim().startsWith('```')) {
      if (currentCodeBlock === null) {
        // 코드 블록 시작
        codeLanguage = line.trim().slice(3).toLowerCase() || 'javascript';
        // 노션 지원 언어 매핑 예외 처리
        if (codeLanguage === 'js') codeLanguage = 'javascript';
        if (codeLanguage === 'ts') codeLanguage = 'typescript';
        if (codeLanguage === 'text') codeLanguage = 'plain text';
        currentCodeBlock = [];
      } else {
        // 코드 블록 종료
        blocks.push({
          object: 'block',
          type: 'code',
          code: {
            rich_text: [{ type: 'text', text: { content: currentCodeBlock.join('\n') } }],
            language: codeLanguage,
          },
        });
        currentCodeBlock = null;
      }
      continue;
    }

    if (currentCodeBlock !== null) {
      currentCodeBlock.push(line);
      continue;
    }

    // 2. 제목 (Header) 처리
    if (line.startsWith('# ')) {
      blocks.push({
        object: 'block',
        type: 'heading_1',
        heading_1: {
          rich_text: [{ type: 'text', text: { content: line.slice(2).trim() } }],
        },
      });
    } else if (line.startsWith('## ')) {
      blocks.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ type: 'text', text: { content: line.slice(3).trim() } }],
        },
      });
    } else if (line.startsWith('### ')) {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [{ type: 'text', text: { content: line.slice(4).trim() } }],
        },
      });
    }
    // 3. 인용구 (Quote) 처리
    else if (line.startsWith('> ')) {
      blocks.push({
        object: 'block',
        type: 'quote',
        quote: {
          rich_text: [{ type: 'text', text: { content: line.slice(2).trim() } }],
        },
      });
    }
    // 4. 불릿 리스트 처리
    else if (line.startsWith('* ') || line.startsWith('- ')) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ type: 'text', text: { content: line.slice(2).trim() } }],
        },
      });
    }
    // 5. 일반 단락 (빈 줄은 무시하거나 빈 단락 처리)
    else {
      if (line.trim() !== '') {
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ type: 'text', text: { content: line.trim() } }],
          },
        });
      }
    }
  }

  return blocks;
}

async function syncToNotion() {
  try {
    console.log(`⏳ 파일 읽는 중: ${path.basename(absolutePath)}...`);
    const mdContent = fs.readFileSync(absolutePath, 'utf-8');

    // 첫 번째 Heading 1이나 Heading 2를 찾아서 제목으로 삼고, 없으면 파일명을 제목으로 삼음
    const titleMatch = mdContent.match(/^(?:#|##)\s+(.+)$/m);
    const pageTitle = titleMatch ? titleMatch[1].trim() : path.basename(absolutePath, '.md');

    console.log(`Parsing 시작... 제목: "${pageTitle}"`);
    const blocks = parseMarkdownToNotionBlocks(mdContent);

    // 노션 API 제한으로 페이지 본문 블록은 한 번에 최대 100개까지만 생성 가능
    const chunkedBlocks = blocks.slice(0, 100);

    console.log('🚀 노션 데이터베이스에 업로드 중...');
    
    // 데이터베이스 구조에 맞추어 페이지 생성
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        // 노션 트러블슈팅 DB의 '이름' 컬럼 (Title 속성)
        '이름': {
          title: [
            {
              text: {
                content: pageTitle,
              },
            },
          ],
        }
      },
      children: chunkedBlocks,
    });

    console.log(`✅ 성공적으로 노션에 등록되었습니다!`);
    console.log(`🔗 노션 페이지 URL: ${response.url}`);
  } catch (error) {
    console.error('❌ 노션 API 동기화 중 오류 발생:');
    console.error(error.message || error);
    if (error.body) {
      console.error('상세 오류:', JSON.parse(error.body));
    }
  }
}

syncToNotion();
