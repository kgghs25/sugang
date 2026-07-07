import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";
import { applyCors } from "./_cors.js";

const client = new MongoClient(process.env.MONGODB_URI);

function verify(req) {
  const auth = req.headers.authorization || "";
  return jwt.verify(auth.replace("Bearer ", ""), process.env.JWT_SECRET);
}

export default async function handler(req, res) {
  // ===== CORS (github.io 전체 허용, 상세 로직은 api/_cors.js) =====
  const isPreflight = applyCors(req, res, "GET,OPTIONS");
  if (isPreflight) return res.status(200).end();
  // ================

  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  let payload;
  try {
    payload = verify(req);
  } catch {
    return res.status(401).json({ error: "인증이 만료되었습니다. 다시 로그인해 주세요." });
  }

  await client.connect();
  const col = client.db("sugang25").collection("confirmed");

  // 로그인한 본인 학번의 확정 수강내역만 조회 (다른 학생 것은 조회 불가)
  const doc = await col.findOne({ sid: payload.sid });

  if (!doc) {
    // 확정 기록이 없는 경우(편입생 등) — 빈 selections로 응답, 프런트에서 조용히 무시
    return res.status(200).json({ selections: {} });
  }

  return res.status(200).json({ selections: doc.selections || {} });
}
