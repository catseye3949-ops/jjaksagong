export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-violet-50 text-slate-900">
      <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2">
        <div>
          <div className="mb-4 inline-flex rounded-full border border-violet-200 bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">
            짝사랑 사주 연애 공략 서비스
          </div>

          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            그 사람,
            <br />
            어떻게 다가가야 할까?
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            생년월일과 출생 시간을 입력하면,
            <br className="hidden md:block" />
            일주 중심으로 상대의 기본 성향을 무료로 보여드립니다.
            <br className="hidden md:block" />더 구체적인 연애 공략은 유료
            리포트로 확인하세요.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#input-form"
              className="rounded-2xl bg-violet-600 px-6 py-4 text-center font-semibold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-700"
            >
              무료로 성향 보기
            </a>
            <a
              href="#premium"
              className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              공략 리포트 보기
            </a>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">무료 제공</p>
              <p className="mt-1 font-semibold">일주 + 기본 성향</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">유료 리포트</p>
              <p className="mt-1 font-semibold">공략법 3,900원</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">핵심 방식</p>
              <p className="mt-1 font-semibold">사주 × 연애 전략</p>
            </div>
          </div>
        </div>

        <div
          id="input-form"
          className="rounded-3xl bg-white p-6 shadow-2xl shadow-violet-100 ring-1 ring-slate-200 md:p-8"
        >
          <div className="mb-6">
            <p className="text-sm font-medium text-violet-600">
              무료 분석 시작
            </p>
            <h2 className="mt-2 text-2xl font-bold">만세력 입력</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              출생 시간을 모르면 입력하지 않아도 됩니다. 결과는 일주 중심으로
              제공됩니다.
            </p>
          </div>

          <form className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                상대 이름 또는 별명
              </label>
              <input
                id="name"
                type="text"
                placeholder="예: 김유경"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
              />
            </div>

            <div>
              <label
                htmlFor="birthdate"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                생년월일
              </label>
              <input
                id="birthdate"
                type="date"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
              />
            </div>

            <div>
              <label
                htmlFor="birthtime"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                출생 시간 <span className="text-slate-400">(선택)</span>
              </label>
              <input
                id="birthtime"
                type="time"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
              />
            </div>

            <div>
              <label
                htmlFor="gender"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                성별
              </label>
              <select
                id="gender"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-violet-500"
                defaultValue=""
              >
                <option value="" disabled>
                  선택하세요
                </option>
                <option value="female">여성</option>
                <option value="male">남성</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-slate-900 px-6 py-4 font-semibold text-white transition hover:bg-slate-800"
            >
              무료 결과 보기
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-violet-600">
              무료 결과 예시
            </p>
            <div className="relative">
              <img
                src="/whitedragongirl.png"
                alt="경진일주 이미지"
                className="w-full h-auto rounded-2xl mb-6"
              />
              <div className="absolute inset-0 bg-black/20 rounded-2xl"></div>
            </div>
            <h3 className="mt-3 text-2xl font-bold">김유경(경진일주)</h3>

            <div className="mt-6 space-y-5">
              <div>
                <p className="text-sm text-slate-500">핵심 포인트</p>
                <p className="mt-1 text-lg font-semibold">
                  신뢰가 쌓이면 의리가 됩니다.
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">기본 성향</p>
                <p className="mt-1 leading-7 text-slate-700">
                  겉으로는 단단하고 판단이 빠른 편이지만, 속으로는 인간관계에서
                  쉽게 피로를 느끼기도 합니다. 그래서 아무에게나 마음을 열지
                  않고, 믿을 수 있다고 느낄 때 비로소 깊게 들어갑니다.
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">연애 심리</p>
                <p className="mt-1 leading-7 text-slate-700">
                  초반에는 상대를 빠르게 판단하고 거리를 둡니다. 하지만 신뢰가
                  쌓이면 오래 관계를 유지하려는 성향이 강합니다. 반대로 배신이나
                  거짓이 보이면 관계를 빠르게 정리하는 편입니다.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">킬 포인트</p>
                <p className="mt-1 font-semibold text-slate-900">
                  신뢰가 무엇보다 중요합니다
                </p>
              </div>
            </div>
          </div>

          <div
            id="premium"
            className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm"
          >
            <p className="text-sm font-semibold text-violet-300">
              유료 공략 리포트
            </p>
            <h3 className="mt-3 text-2xl font-bold">
              3,900원으로 전체 공략 보기
            </h3>
            <p className="mt-4 leading-7 text-slate-300">
              단순한 성격풀이가 아니라, 실제 연애 상황에서 통하는 접근법을
              보여드립니다.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "🔒 이 사람에게 먹히는 접근법",
                "🔒 절대 하면 안 되는 행동",
                "🔒 연락 템포와 대화 방식",
                "🔒 썸에서 관계를 진전시키는 포인트",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-slate-100"
                >
                  {item}
                </div>
              ))}
            </div>

            <button className="mt-8 w-full rounded-2xl bg-violet-500 px-6 py-4 font-semibold text-white transition hover:bg-violet-400">
              결제하고 전체 보기
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
