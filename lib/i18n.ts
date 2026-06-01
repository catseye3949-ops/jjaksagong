export const SUPPORTED_LOCALES = ["ko", "zh-TW"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type TextDictionary = {
  nav: {
    logo: string;
    ranking: string;
    todayGames: string;
    videos: string;
    teams: string;
    search: string;
  };
  hero: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    cta: string;
  };
  trending: {
    title: string;
    rankBadgeSuffix: string;
  };
  games: {
    title: string;
    timeLabel: string;
  };
  videos: {
    title: string;
    viewsLabel: string;
    watchButton: string;
  };
  teams: {
    title: string;
  };
  fanSupport: {
    title: string;
    cta: string;
  };
};

export const TEXT: Record<Locale, TextDictionary> = {
  ko: {
    nav: {
      logo: "Cheeron",
      ranking: "랭킹",
      todayGames: "오늘의 경기",
      videos: "직캠",
      teams: "팀별 보기",
      search: "검색",
    },
    hero: {
      title: "치어리더를 응원한다",
      subtitle: "K-응원문화를 기록하는 글로벌 팬덤 아카이브",
      searchPlaceholder: "치어리더 이름 또는 팀 검색",
      cta: "오늘의 인기 치어리더 보기",
    },
    trending: {
      title: "오늘의 인기 치어리더",
      rankBadgeSuffix: "랭킹",
    },
    games: {
      title: "오늘의 경기 & 출연 예상",
      timeLabel: "경기 시간",
    },
    videos: {
      title: "인기 직캠",
      viewsLabel: "조회수",
      watchButton: "보러가기",
    },
    teams: {
      title: "팀별 보기",
    },
    fanSupport: {
      title: "팬 응원",
      cta: "응원 메시지 남기기",
    },
  },
  "zh-TW": {
    nav: {
      logo: "Cheeron",
      ranking: "排行榜",
      todayGames: "今日比賽",
      videos: "直拍",
      teams: "依球隊查看",
      search: "搜尋",
    },
    hero: {
      title: "為啦啦隊應援",
      subtitle: "記錄 K-應援文化的全球粉絲檔案平台",
      searchPlaceholder: "搜尋啦啦隊員姓名或球隊",
      cta: "查看今日人氣啦啦隊員",
    },
    trending: {
      title: "今日人氣啦啦隊員",
      rankBadgeSuffix: "排名",
    },
    games: {
      title: "今日比賽與預計出場",
      timeLabel: "比賽時間",
    },
    videos: {
      title: "熱門直拍",
      viewsLabel: "觀看數",
      watchButton: "前往觀看",
    },
    teams: {
      title: "依球隊查看",
    },
    fanSupport: {
      title: "粉絲應援",
      cta: "留下應援訊息",
    },
  },
};

export function isSupportedLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

