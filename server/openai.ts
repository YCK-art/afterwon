import OpenAI from "openai";
import dotenv from "dotenv";

// 환경변수 로드
dotenv.config();

// OpenAI API 키는 환경변수에서 가져옵니다
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn("⚠️  OPENAI_API_KEY 환경변수가 설정되지 않았습니다.");
  console.warn("   환경변수를 설정하거나 .env 파일을 생성해주세요.");
}

export const openai = new OpenAI({
  apiKey: apiKey || "dummy-key", // 개발용 더미 키
  organization: "org-20S8SXNXU026hzoUM2tVbNSc", // 조직 ID 추가
}); 