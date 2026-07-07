// =========================================================
// CORS 공통 헬퍼
// - GitHub Pages(*.github.io) 주소라면 계정/조직 이름과 상관없이 전부 허용
// - github.io가 아닌 다른 사이트는 차단 (완전 개방 "*" 보다 안전)
// - 앞으로 GitHub 계정/조직 이름이 또 바뀌어도, 이 파일 하나만 보면 되고
//   api/submit.js, api/auth/login.js 등 나머지 파일은 다시 안 고쳐도 됩니다.
//
// 파일명 맨 앞에 "_"를 붙여서, Vercel이 이 파일을 API 엔드포인트로
// 취급하지 않고 순수 "공용 함수 모음"으로만 인식하게 했습니다.
// (Vercel 공식 규칙: /api 안에서도 _로 시작하는 파일/폴더는 배포 대상에서 제외됨)
// =========================================================

// github.io로 끝나는 주소만 허용하는 정규식
// 예: https://kgghs25.github.io  ✅ 통과 / https://evil-site.com ❌ 차단
const ALLOWED_ORIGIN_REGEX = /^https:\/\/[a-z0-9-]+\.github\.io$/i;

/**
 * 요청의 Origin을 검사해서, GitHub Pages 주소일 때만 CORS 허용 헤더를 붙여준다.
 * @param {object} req  - Vercel이 넘겨주는 request 객체
 * @param {object} res  - Vercel이 넘겨주는 response 객체
 * @param {string} methods - 이 엔드포인트가 허용할 HTTP 메서드 (예: "GET,POST,OPTIONS")
 * @returns {boolean} - true면 OPTIONS 사전 요청(preflight)이니, 호출부에서 바로 종료하면 됨
 */
export function applyCors(req, res, methods) {
  const origin = req.headers.origin || "";

  // github.io로 끝나는 주소일 때만 그 주소를 그대로 돌려줌 (패턴 매칭은 코드에서, 헤더값은 항상 "정확한 주소 하나")
  if (ALLOWED_ORIGIN_REGEX.test(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  // 캐시 서버(CDN 등)가 "요청자마다 응답이 다를 수 있다"는 걸 알도록 표시 (필수는 아니지만 안전한 습관)
  res.setHeader("Vary", "Origin");

  res.setHeader("Access-Control-Allow-Methods", methods);
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // OPTIONS 요청(브라우저가 본 요청 전에 보내는 사전 확인)이면 true를 돌려줘서
  // 호출한 쪽에서 바로 200 응답하고 끝내도록 함
  return req.method === "OPTIONS";
}
