import dotenv from "dotenv";

// 환경변수 로드 (가장 먼저)
dotenv.config();

import express from "express";
import cors from "cors";
import generateRouter from "./routes/generate";

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 라우트
app.use("/api", generateRouter);

// 헬스체크
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
}); 