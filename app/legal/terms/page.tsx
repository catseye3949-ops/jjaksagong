import Link from "next/link";

const sectionClass = "mt-8 space-y-3 text-sm leading-relaxed text-white/80";
const h2Class = "text-base font-semibold text-white";
const ulClass = "list-disc space-y-2 pl-5 text-white/80";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0b1020] px-5 py-14 pb-24 text-white sm:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-fuchsia-200/90">
          짝사공
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">이용약관</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/75">
          본 약관은 짝사공(이하 &quot;서비스&quot;)의 이용과 관련하여 서비스 제공자와
          이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>

        <section className={sectionClass}>
          <h2 className={h2Class}>제1조 (목적)</h2>
          <p>
            본 약관은 이용자가 제공하는 사주 기반 연애 공략 서비스의 이용 조건 및
            절차를 규정합니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>제2조 (서비스의 내용)</h2>
          <p>
            서비스는 이용자가 입력한 정보를 바탕으로 연애 관련 분석 및 참고용
            콘텐츠를 제공합니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>제3조 (회원가입)</h2>
          <p>
            이용자는 이메일 및 기타 필수 정보를 입력하여 회원가입을 할 수
            있습니다. 이용자는 정확한 정보를 제공해야 하며, 허위 정보 입력으로
            발생하는 문제에 대한 책임은 이용자에게 있습니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>제4조 (서비스 이용)</h2>
          <p>
            서비스는 기본적으로 무료 콘텐츠와 유료 콘텐츠로 구성됩니다. 유료
            콘텐츠는 결제를 완료한 경우에만 이용할 수 있습니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>제5조 (유료 서비스 및 결제)</h2>
          <p>
            이용자는 서비스에서 제공하는 유료 콘텐츠를 결제 후 이용할 수 있습니다.
            결제는 외부 결제 시스템을 통해 이루어질 수 있습니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>제6조 (환불 정책)</h2>
          <p>
            디지털 콘텐츠의 특성상 결제 완료 후에는 원칙적으로 환불이
            불가능합니다. 단, 서비스 오류 등 정당한 사유가 있을 경우 환불이
            가능합니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>제7조 (서비스의 성격)</h2>
          <p>
            서비스에서 제공하는 모든 내용은 참고용이며, 실제 결과를 보장하지
            않습니다. 서비스는 법적, 의학적, 재정적 조언을 제공하지 않습니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>제8조 (이용 제한)</h2>
          <p>다음 행위가 확인될 경우 서비스 이용이 제한될 수 있습니다:</p>
          <ul className={ulClass}>
            <li>타인의 정보 도용</li>
            <li>서비스의 정상적인 운영 방해</li>
            <li>불법적인 목적의 이용</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>제9조 (면책 조항)</h2>
          <p>
            서비스 제공자는 제공된 정보로 인해 발생하는 결과에 대해 책임을 지지
            않습니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>제10조 (약관의 변경)</h2>
          <p>
            본 약관은 필요 시 변경될 수 있으며, 변경 시 서비스 내 공지합니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>제11조 (문의)</h2>
          <p>서비스 관련 문의는 이메일을 통해 접수할 수 있습니다.</p>
        </section>

        <div className="mt-12 flex flex-wrap gap-4 text-sm">
          <Link
            href="/signup"
            className="text-fuchsia-200 underline-offset-4 hover:underline"
          >
            ← 회원가입
          </Link>
          <Link
            href="/"
            className="text-white/60 underline-offset-4 hover:text-white/85 hover:underline"
          >
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}
