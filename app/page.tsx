import Link from "next/link";
import Image from "next/image";
import AuthLandingBar from "@/components/AuthLandingBar";

const previewBasic = [
  "두뇌 회전이 빠르고 판단력이 뛰어나며, 한 번 목표를 세우면 끝까지 밀어붙이는 강한 추진력과 인내심을 지닌 타입입니다. 의리가 있고 옳지 않은 일을 쉽게 넘기지 않는 정의감이 있으나, 자기 주장이 강하고 고집이 센 편이라 주변 사람들과 충돌이 생기기 쉽습니다. 스스로에 대한 확신이 강해 결단력은 뛰어나지만, 유연성이 부족하면 관계에서 어려움을 겪을 수 있습니다. 또한 괴강의 기질을 지녀 에너지가 강하고 평범한 삶보다는 극단적인 흐름을 경험하기 쉬우며, 잘될 때는 크게 성공하고 그렇지 않을 때는 크게 흔들리는 특징이 있습니다. 끈기와 뚝심이 강해 실패하더라도 쉽게 무너지지 않고 다시 도전하는 힘이 있으며, 감각과 재능도 좋아 표현력이나 예술적인 영역에서도 두각을 나타낼 수 있습니다. 전체적으로 강한 의지와 개성을 바탕으로 자신의 길을 개척해 나가는 스타일이지만, 인간관계에서는 한 걸음 물러나는 여유를 갖는 것이 중요합니다.",
];

const previewStrategy = [
  "작은 약속도 목숨 걸고 지키세요.",
  "의리 있는 모습에 호감을 느껴요.",
  "가볍고 '쿨한' 태도는 오히려 역효과를 불러 일으킵니다.",
];

const targetUsers = [
  "좋아하는 사람의 속을 모르겠는 분",
  "연락은 되는데 관계가 안 진전되는 분",
  "썸인지 아닌지 헷갈리는 분",
  "사주로 연애 스타일을 알고 싶은 분",
];

const reviews = [
  {
    type: "20대 직장인 · ENFJ",
    rating: 5,
    animal: "갑진",
    animalIcon: "🐉",
    animalClass: "text-rose-200 border-rose-300/30 bg-rose-400/10",
    content:
      "짝남 성격과 생각보다 잘 맞아서 어이가 없을 정도에여. 읽으면서 간간히 웃기기도 합니당. 돈이 아깝진 않은 것 같아여 소장하려구요",
  },
  {
    type: "30대 프리랜서 · INFP",
    rating: 5,
    animal: "갑자",
    animalIcon: "🐭",
    animalClass: "text-sky-200 border-sky-300/30 bg-sky-400/10",
    content:
      "썸녀와 연락 방식 공략 부분이 도움됐어요. 괜히 밀당한다고 답장 늦게 했었는데 그게 오히려 안 좋다고 해서 그 이후로 자연스럽게 바꿨더니 분위기가 달라졌네요",
  },
  {
    type: "20대 대학원생 · ISTJ",
    rating: 4,
    animal: "기묘",
    animalIcon: "🐇",
    animalClass: "text-amber-200 border-amber-300/30 bg-amber-400/10",
    content:
      "진짜 결제하고 보길 잘했어요 여러분 이거 꼭 하세요 ㅋㅋㅋㅋㅋㅋ 소개팅남 파악하려고 구매했는데 뭔가 지금까지의 데이터(?)랑 정말 잘 들어맞는듯 ㅋㅋ 가격도 싸고 후회 안함니다. 소개팅남 너 딱기다려 !!",
  },
  {
    type: "20대 취준생 · INFJ",
    rating: 5,
    animal: "을사",
    animalIcon: "🐍",
    animalClass: "text-violet-200 border-violet-300/30 bg-violet-400/10",
    content:
      "내 남친을 왜이리 잘 아시는겨. 나도 몰랐던 내 남친을 구체적으로 알려줌.내 남친의 완벽한 이상형이 될 수 있겠어요ㅠㅡ..;; 지금 남자친구가 나와 잘맞는 남자친구라는 걸 나도 내심 알고있었는데 사주학적으로 알려줘서 뭔가 안심했습니다ㅋㅋㅋ",
  },
  {
    type: "30대 직장인 · ESTP",
    rating: 4,
    animal: "병오",
    animalIcon: "🐎",
    animalClass: "text-emerald-200 border-emerald-300/30 bg-emerald-400/10",
    content:
      "무작정 잘해주는 게 답이 아니란 걸 처음 알았네요. 언제 다가가고 언제 멈춰야 하는지 전략?이 구체적이라 바로 적용하기 쉬웠어요.",
  },
  {
    type: "20대 디자이너 · ISFP",
    rating: 5,
    animal: "신유",
    animalIcon: "🐓",
    animalClass: "text-slate-200 border-slate-300/30 bg-slate-300/10",
    content:
      "나랑 잘 맞는 사람은 어떤 사람인지 직접 부딪치지 않고도 알 수 있어서 좋았어열ㅎㅎㅎ나중에 남친과의 궁합으로 봐도 재밌을 것 같아요!!",
  },
];

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1020] text-white">
      <section className="block md:hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 right-[-80px] h-[280px] w-[280px] rounded-full bg-[#ff1f8e]/20 blur-3xl" />
          <div className="absolute bottom-[-120px] left-[-80px] h-[300px] w-[300px] rounded-full bg-[#6d2fff]/20 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_45%)]" />
        </div>

        <div className="relative mx-auto min-h-screen max-w-[430px] border-x border-white/10 bg-gradient-to-b from-[#1a0a16] via-[#170a1f] to-[#10091a] shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
          <header className="flex items-center justify-between px-5 pb-2 pt-4">
            <p className="text-sm font-semibold tracking-wide text-white/95">짝사공</p>
            <span className="h-2 w-2 rounded-full bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.9)]" />
          </header>

          <div className="px-5 pb-44 pt-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <h1 className="text-[28px] font-bold leading-[1.25] tracking-tight text-white">
                좋아하는 그 사람,
                <br />
                왜 이렇게 헷갈릴까요?
              </h1>
              <p className="mt-3 text-sm leading-6 text-white/70">
                생년월일로 상대의 연애 성향과 공략 포인트를 확인해보세요.
              </p>
            </div>

            <div className="relative mt-4 rounded-3xl border border-white/10 bg-[#130a19] p-4">
              <div className="pointer-events-none absolute -right-10 -top-8 h-36 w-36 rounded-full bg-[#ff2a9b]/20 blur-2xl" />
              <div className="pointer-events-none absolute -left-8 bottom-[-32px] h-28 w-28 rounded-full bg-[#742bff]/25 blur-2xl" />
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0f0a16]">
                <div className="aspect-[4/3] w-full">
                  <Image
                    src="/images/front/jjaksagong_mobile.png"
                    alt="짝사공 모바일 메인 비주얼"
                    width={1200}
                    height={900}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-[13px] font-semibold text-pink-200">샘플 - 2005.2.25일생의 기본 특징</p>
                <p className="mt-2 text-sm leading-relaxed text-white/75">
                  {previewBasic[0]}
                </p>
              </article>
              <article className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-400/10 p-4">
                <p className="text-[13px] font-semibold text-fuchsia-100">샘플 - 공략 포인트 3가지</p>
                <ul className="mt-2 space-y-2 text-sm leading-relaxed text-white/80">
                  {previewStrategy.map((item) => (
                    <li key={item}>
                      • {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>

          <div className="pointer-events-none fixed inset-x-0 bottom-[76px] z-20 flex justify-center">
            <div className="pointer-events-auto w-full max-w-[430px] px-5 py-3">
              <Link
                href="/main"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#ff2a9b] via-[#ff1f86] to-[#d3005f] px-6 py-4 text-sm font-semibold text-white shadow-[0_10px_32px_rgba(255,31,134,0.45)]"
              >
                상대 생년월일 입력하기
              </Link>
            </div>
          </div>

          <nav className="fixed bottom-0 left-1/2 z-30 flex h-[72px] w-full max-w-[430px] -translate-x-1/2 items-center rounded-t-[28px] border-t border-white/10 bg-[#080b1a] shadow-[0_-8px_30px_rgba(0,0,0,0.35)] md:hidden">
            <Link
              href="/"
              className="flex h-full flex-1 flex-col items-center justify-center gap-1 text-[#ff2d6f]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M3 10.5L12 3l9 7.5" />
                <path d="M5.5 9.5V20h13V9.5" />
              </svg>
              <span className="text-[11px] font-medium">홈</span>
            </Link>

            <Link
              href="/main"
              className="flex h-full flex-1 flex-col items-center justify-center gap-1 text-white/55"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M12 3l1.8 4.6L18 9.4l-4.2 1.8L12 16l-1.8-4.8L6 9.4l4.2-1.8L12 3z" />
                <path d="M19 15l.9 2.2L22 18l-2.1.8L19 21l-.9-2.2L16 18l2.1-.8L19 15z" />
              </svg>
              <span className="text-[11px] font-medium">분석</span>
            </Link>

            <Link
              href="#"
              className="flex h-full flex-1 flex-col items-center justify-center gap-1 text-white/55"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path d="M7 4.5h8.5l3 3V19.5H7z" />
                <path d="M15.5 4.5V8h3" />
                <path d="M9.5 11.5h6M9.5 14.5h6M9.5 17.5h4.5" />
              </svg>
              <span className="text-[11px] font-medium">연애리포트</span>
            </Link>

            <Link
              href="/mypage"
              className="flex h-full flex-1 flex-col items-center justify-center gap-1 text-white/55"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="8" r="3.2" />
                <path d="M5.5 19.5c1.3-3 3.5-4.5 6.5-4.5s5.2 1.5 6.5 4.5" />
              </svg>
              <span className="text-[11px] font-medium">마이페이지</span>
            </Link>
          </nav>
        </div>
      </section>

      <section className="hidden md:block">
        <AuthLandingBar />
        {/* background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-120px] top-[-80px] h-[320px] w-[320px] rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute right-[-100px] top-[120px] h-[360px] w-[360px] rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute bottom-[-100px] left-[20%] h-[320px] w-[320px] rounded-full bg-pink-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%)]" />
        </div>

        {/* hero */}
        <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-32 md:pt-36">
          <div className="pointer-events-none absolute inset-0 z-0">
            <Image
              src="/images/front/male.png"
              alt=""
              width={500}
              height={700}
              aria-hidden="true"
              className="absolute left-0 top-1/2 h-[400px] w-[220px] -translate-y-1/2 scale-105 select-none object-cover object-center opacity-35 blur-[2px] sm:h-[420px] sm:w-[250px] md:h-[440px] md:w-[290px] lg:h-[450px] lg:w-[330px]"
            />
            <Image
              src="/images/front/female.png"
              alt=""
              width={500}
              height={700}
              aria-hidden="true"
              className="absolute right-0 top-1/2 h-[400px] w-[220px] -translate-y-1/2 scale-105 select-none object-cover object-center opacity-35 blur-[2px] sm:h-[420px] sm:w-[250px] md:h-[440px] md:w-[290px] lg:h-[450px] lg:w-[330px]"
            />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm font-medium text-pink-200 backdrop-blur">
              <span className="text-fuchsia-300">짝</span>
              <span className="text-fuchsia-300">사</span>랑,{" "}
              <span className="text-fuchsia-300">공</span>략이 필요합니다
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              좋아하는 그 사람,
              <br />
              <span className="bg-gradient-to-r from-pink-300 via-fuchsia-200 to-violet-300 bg-clip-text text-transparent">
                왜 이렇게 헷갈릴까요?
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/70 md:text-lg">
              짝사공은 생년월일을 바탕으로
              <br className="hidden md:block" />그 사람의 연애 성향과 공략
              포인트를 보여주는 사주 연애 서비스입니다.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/main"
                className="inline-flex rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-7 py-4 text-base font-semibold text-white shadow-[0_10px_40px_rgba(217,70,239,0.35)] transition duration-300 hover:scale-[1.02]"
              >
                상대 생년월일 입력하러 가기
              </Link>
            </div>
          </div>
        </section>

        {/* preview cards */}
        <section className="relative mx-auto max-w-6xl px-6 pb-10">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-white/8 p-8 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
              <p className="text-sm font-semibold text-pink-200">
                샘플 카드 미리보기
              </p>
              <h2 className="mt-3 text-2xl font-bold leading-tight text-white">
                2005.2.25일생의 기본 특징
              </h2>

              <ul className="mt-6 space-y-4 text-sm leading-7 text-white/80">
                {previewBasic.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-pink-400 shadow-[0_0_12px_rgba(244,114,182,0.9)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5">
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                  sample emotion
                </p>
                <p className="mt-2 text-lg font-semibold text-white">
                  “겉은 차분하지만, 마음을 쉽게 정하지는 않는 타입”
                </p>
                <p className="mt-3 text-sm leading-6 text-white/60">
                  그래서 더더욱 접근 방식이 중요합니다.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-500/15 via-violet-500/10 to-pink-500/10 p-8 backdrop-blur-xl shadow-[0_20px_80px_rgba(90,24,154,0.35)]">
              <p className="text-sm font-semibold text-fuchsia-200">
                넷플릭스 예고편처럼
              </p>
              <h2 className="mt-3 text-2xl font-bold leading-tight text-white">
                호감도 공략 포인트 미리보기
              </h2>

              <ul className="mt-6 space-y-4 text-sm leading-7 text-white/80">
                {previewStrategy.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-2 w-2 rounded-full bg-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.9)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 rounded-2xl border border-white/10 bg-[#120f1f]/70 p-5">
                <p className="text-sm text-white/55">
                  더 자세한 접근이 궁금하다면
                </p>
                <p className="mt-2 text-xl font-bold text-white">
                  전체 연애공략법 보기
                </p>
                <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <p className="mt-4 text-sm leading-6 text-white/60">
                  1. 핵심 전략 한 줄<br />
                  2. 절대 하면 안 되는 행동
                  <br />
                  3. 단계별 접근법
                  <br />
                  4. 연락 스타일 공략
                  <br />
                  5. 감정 트리거
                  <br />
                  6. 식는 포인트
                  <br />
                  7. 관계 가능성
                  <br />
                  8. 한 줄 결론
                  <br />
                  <br />
                  실제로 짝사랑에게 어떻게 다가가야 하는지 보여드립니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* target users */}
        <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-8">
          <div className="rounded-[32px] border border-white/10 bg-white/6 p-8 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)] md:p-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xl font-semibold text-violet-200 md:text-2xl">
                이런 분들에게 맞아요
              </p>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {targetUsers.map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 transition hover:bg-white/8"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-violet-500 text-sm font-bold text-white shadow-lg">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-sm font-medium leading-6 text-white/80 md:text-base">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* reviews */}
        <section className="relative mx-auto max-w-6xl px-6 pb-24 pt-4">
          <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.35)] md:p-10">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold text-pink-200">
                실제 사용자 후기
              </p>
              <h3 className="mt-3 text-3xl font-bold leading-tight text-white md:text-4xl">
                사주로 연애 공략이 됩니다
              </h3>
              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
                과장된 성공담보다, 썸/연인 관계에서 실제로 도움이 됐다는
                이야기들을 모았습니다.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((review, index) => (
                <article
                  key={`${review.type}-${index}`}
                  className="group rounded-2xl border border-white/10 bg-white/6 p-5 backdrop-blur-lg transition duration-300 hover:-translate-y-1 hover:border-fuchsia-300/35 hover:bg-white/10 hover:shadow-[0_14px_36px_rgba(217,70,239,0.2)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold tracking-wide text-violet-200/90">
                      후기 {index + 1}
                    </p>
                    <p className="text-xs tracking-[0.14em] text-pink-200">
                      {"★".repeat(review.rating)}
                      <span className="text-white/25">
                        {"★".repeat(5 - review.rating)}
                      </span>
                    </p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <p className="inline-flex rounded-full border border-fuchsia-200/20 bg-fuchsia-400/10 px-2.5 py-1 text-[11px] font-medium text-fuchsia-100/90">
                      {review.type}
                    </p>
                    <p
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium ${review.animalClass}`}
                    >
                      <span className="text-[10px]">{review.animalIcon}</span>
                      <span>{review.animal}</span>
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/85">
                    {review.content}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link
                href="/main"
                className="inline-flex rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500 px-8 py-4 text-base font-semibold text-white shadow-[0_10px_40px_rgba(217,70,239,0.35)] transition duration-300 hover:scale-[1.02]"
              >
                나도 상대 생년월일 입력해보기
              </Link>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
