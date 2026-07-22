// ============================================================================
// pet-name.tsx — 펫 이름 등록 화면 (§8-1)
//
// 첫 플레이 진입 시 한 번만 나온다: 이름이 없으면 게임(GameCore)을 아예
// 마운트하지 않는다. 여기서 만든 uuid가 평생의 경쟁 키가 된다 (storage.ts).
//
// 이름은 여기서 서버에 **선점**된다 (register_pet, §8-1) — 게임오버 때가
// 아니라 짓는 순간 중복을 알려줘야, 한 판을 다 놀고 나서 "이름이 겹쳐요"라는
// 사고가 없다. 중복이면 다른 이름을 요구하고, 네트워크 오류면 게임을 막지
// 않고 통과시킨다 (§12 — 다음 제출 때 자기 치유).
// ============================================================================

import { useState } from "react";
import { COLORS } from "@/lib/constants";
import { registerPet, sanitizePetName } from "@/lib/leaderboard";
import { type StoredPet, newPetId } from "@/lib/storage";
import { useT } from "../i18n-provider";

type GateState = "idle" | "checking" | "taken";

export function PetNameGate({
  onDone,
}: {
  onDone: (pet: StoredPet) => void;
}) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [state, setState] = useState<GateState>("idle");
  const clean = sanitizePetName(name);

  const submit = async () => {
    if (!clean || state === "checking") return;
    const pet: StoredPet = { id: newPetId(), name: clean };
    setState("checking");
    const result = await registerPet(pet);
    if (result === "taken") {
      setState("taken"); // 이미 있는 이름 — 다른 이름을 지어야 한다
      return;
    }
    // "ok" — 선점 완료. "error"(오프라인·env 미설정)도 통과 — 게임을 막지
    // 않는 게 우선이고, 등록은 게임오버 제출 때 다시 시도된다.
    onDone(pet);
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
        {t("petname.title")}
      </h1>
      <p className="font-pixel-ko whitespace-pre-line text-sm leading-relaxed text-gray-300">
        {t("petname.sub")}
      </p>
      <input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          if (state === "taken") setState("idle"); // 고치기 시작하면 경고 해제
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") void submit();
        }}
        maxLength={10}
        placeholder={t("petname.placeholder")}
        autoFocus
        aria-label={t("petname.aria")}
        className="font-pixel-ko w-64 border-2 bg-black/40 px-3 py-2 text-center text-xl text-white outline-none placeholder:text-gray-600 focus-visible:border-white"
        style={{
          borderColor: state === "taken" ? COLORS.danger : "rgba(255,255,255,0.5)",
        }}
      />
      {state === "taken" && (
        <p className="font-pixel-ko text-sm" style={{ color: COLORS.danger }}>
          {t("petname.taken")}
        </p>
      )}
      <button
        onClick={() => void submit()}
        disabled={!clean || state === "checking"}
        className="font-pixel border-4 px-8 py-3 text-lg transition-transform focus-visible:scale-105 disabled:opacity-40"
        style={{
          color: COLORS.accent,
          borderColor: COLORS.accent,
          textShadow: "2px 2px 0 #000",
        }}
      >
        {state === "checking" ? "..." : "GO!"}
      </button>
    </div>
  );
}
