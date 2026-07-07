import { MongoClient } from "mongodb";
import jwt from "jsonwebtoken";
import { applyCors } from "../_cors.js";

const client = new MongoClient(process.env.MONGODB_URI);

function verify(req){
  const auth = req.headers.authorization || "";
  return jwt.verify(auth.replace("Bearer ", ""), process.env.JWT_SECRET);
}

export default async function handler(req, res){
  // ===== CORS (github.io 전체 허용, 상세 로직은 api/_cors.js) =====
  const isPreflight = applyCors(req, res, "GET,POST,DELETE,OPTIONS");
  if (isPreflight) return res.status(200).end();
  // ================

  let user;
  try { user = verify(req); }
  catch { return res.status(401).json({ error: "로그인이 필요합니다." }); }

  await client.connect();
  const col = client.db("sugang25").collection("roadmaps");

  // 목록 조회 (충족여부 포함)
  if (req.method === "GET") {
    const list = await col
      .find({ sid: user.sid }, { projection: { name: 1, savedAt: 1, isComplete: 1 } })
      .sort({ savedAt: -1 }).toArray();
    return res.status(200).json(list);
  }

  // 저장 (동일 이름 덮어쓰기)
  if (req.method === "POST") {
    const { name, selections, excluded, isComplete } = req.body;
    if (!name) return res.status(400).json({ error: "로드맵 이름이 필요합니다." });
    await col.updateOne(
      { sid: user.sid, name },
      { $set: {
          sid: user.sid, name,
          selections: selections || {},
          excluded: excluded || {},
          isComplete: !!isComplete,
          savedAt: new Date()
      }},
      { upsert: true }
    );
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
