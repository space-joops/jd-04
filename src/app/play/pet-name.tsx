// ============================================================================
// pet-name.tsx — 펫 이름 등록 화면 (§8-1)
//
// 첫 플레이 진입 시 한 번만 나온다: 이름이 없으면 게임(GameCore)을 아예
// 마운트하지 않는다 — "이름 없이 시작했다가 게임오버에서 입력"하는 흐름보다
// STELLAPET처럼 "먼저 이름을 지어주고 키운다"가 세계관(§2)에 맞다.
// 여기서 만든 uuid가 평생의 경쟁 키가 된다 (storage.ts).
// ============================================================================

import { useState } from "react";
import { COLORS } from "@/lib/constants";
import { sanitizePetName } from "@/lib/leaderboard";
import { type StoredPet, newPetId } from "@/lib/storage";

export function PetNameGate({
  onDone,
}: {
  onDone: (pet: StoredPet) => void;
}) {
  const [name, setName] = useState("");
  const clean = sanitizePetName(name);

  const submit = () => {
    if (!clean) return;
    onDone({ id: newPetId(), name: clean });
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center gap-6 px-6 text-center"
      style={{ backgroundColor: COLORS.space }}
    >
      <p className="font-pixel text-[10px] tracking-widest text-gray-400">
        NEW PET REGISTRATION
      </p>
      <h1
        className="font-pixel-ko text-3xl text-white md:text-4xl"
        style={{ textShadow: "3px 3px 0 #000" }}
      >
        펫 이름을 지어줘!
      </h1>
      <p className="font-pixel-ko text-sm leading-relaxed text-gray-300">
        궤도 청소 기록은 이 이름으로 경쟁해요.
        <br />
        (10자까지 · 나중에 게임오버 순위표에 올라요)
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        maxLength={10}
        placeholder="냠냠이"
        autoFocus
        aria-label="펫 이름"
        className="font-pixel-ko w-64 border-2 border-white/50 bg-black/40 px-3 py-2 text-center text-xl text-white outline-none placeholder:text-gray-600 focus-visible:border-white"
      />
      <button
        onClick={submit}
        disabled={!clean}
        className="font-pixel border-4 px-8 py-3 text-lg transition-transform focus-visible:scale-105 disabled:opacity-40"
        style={{
          color: COLORS.accent,
          borderColor: COLORS.accent,
          textShadow: "2px 2px 0 #000",
        }}
      >
        GO!
      </button>
    </div>
  );
}
