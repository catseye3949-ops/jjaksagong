export function calculateIlju(birthdate: string, birthtime: string) {
  if (!birthdate) return null;

  const [year, month, day] = birthdate.split("-").map(Number);

  if (!year || !month || !day) return null;

  // birthtime은 현재 일주 계산에 사용하지 않지만, 추후 시주 계산 확장을 위해 유지합니다.
  void birthtime;

  const stems = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
  const branches = [
    "자",
    "축",
    "인",
    "묘",
    "진",
    "사",
    "오",
    "미",
    "신",
    "유",
    "술",
    "해",
  ];

  const sexagenaryCycle = Array.from({ length: 60 }, (_, index) => {
    return `${stems[index % 10]}${branches[index % 12]}`;
  });

  // 기준일: 1984-01-31 (갑자일)
  const baseDateUtc = Date.UTC(1984, 0, 31);
  const targetDateUtc = Date.UTC(year, month - 1, day);
  const oneDayMs = 24 * 60 * 60 * 1000;
  const dayDiff = Math.floor((targetDateUtc - baseDateUtc) / oneDayMs);
  const cycleIndex = ((dayDiff % 60) + 60) % 60;

  return sexagenaryCycle[cycleIndex];
}