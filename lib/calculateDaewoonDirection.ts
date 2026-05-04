const YANG_STEMS = new Set(["갑", "병", "무", "경", "임"]);
const YIN_STEMS = new Set(["을", "정", "기", "신", "계"]);

export type DaewoonDirection = "forward" | "backward";

export type DaewoonDirectionResult = {
  direction: DaewoonDirection;
  yearGan: string;
  yearGanYinYang: "yang" | "yin";
};

function classifyYinYang(gan: string): "yang" | "yin" | null {
  if (YANG_STEMS.has(gan)) return "yang";
  if (YIN_STEMS.has(gan)) return "yin";
  return null;
}

/**
 * 연간(년천간)의 음양과 성별에 따른 대운 순행·역행 방향을 반환합니다.
 */
export function calculateDaewoonDirection(
  gender: "male" | "female",
  yearGan: string,
): DaewoonDirectionResult | null {
  if (gender !== "male" && gender !== "female") {
    return null;
  }
  const gan = yearGan.trim();
  if (gan.length !== 1) {
    return null;
  }
  const yinYang = classifyYinYang(gan);
  if (!yinYang) {
    return null;
  }

  const isForward =
    (gender === "male" && yinYang === "yang") || (gender === "female" && yinYang === "yin");

  return {
    direction: isForward ? "forward" : "backward",
    yearGan: gan,
    yearGanYinYang: yinYang,
  };
}
