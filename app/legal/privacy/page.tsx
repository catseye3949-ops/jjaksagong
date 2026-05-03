import Link from "next/link";

const sectionClass = "mt-8 space-y-3 text-sm leading-relaxed text-white/80";
const h2Class = "text-base font-semibold text-white";
const ulClass = "list-disc space-y-2 pl-5 text-white/80";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0b1020] px-5 py-14 pb-24 text-white sm:px-8">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-fuchsia-200/90">
          짝사공
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">개인정보 처리방침</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/75">
          짝사공(이하 &quot;서비스&quot;)는 이용자의 개인정보를 중요하게 생각하며, 다음과
          같은 정책을 따릅니다.
        </p>

        <section className={sectionClass}>
          <h2 className={h2Class}>1. 수집하는 개인정보</h2>
          <p>서비스는 다음 정보를 수집합니다:</p>
          <ul className={ulClass}>
            <li>이름 또는 닉네임</li>
            <li>이메일</li>
            <li>생년월일</li>
            <li>성별</li>
            <li>출생 시간 (선택)</li>
            <li>MBTI (선택)</li>
            <li>마케팅 수신 동의 여부</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>2. 개인정보 수집 목적</h2>
          <p>수집된 정보는 다음 목적을 위해 사용됩니다:</p>
          <ul className={ulClass}>
            <li>회원 관리 및 로그인</li>
            <li>개인 맞춤 리포트 제공</li>
            <li>서비스 개선</li>
            <li>마케팅 및 이벤트 안내 (동의한 경우)</li>
          </ul>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>3. 개인정보 보관 기간</h2>
          <p>
            회원 탈퇴 시 개인정보는 즉시 삭제됩니다. 단, 법적 의무가 있는 경우
            해당 기간 동안 보관될 수 있습니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>4. 개인정보 제3자 제공</h2>
          <p>
            서비스는 이용자의 개인정보를 외부에 제공하지 않습니다. 단, 결제
            처리 등 서비스 제공에 필요한 경우 일부 정보가 외부 서비스에 전달될
            수 있습니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>5. 개인정보 보호</h2>
          <p>
            서비스는 이용자의 개인정보 보호를 위해 합리적인 보안 조치를
            적용합니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>6. 이용자의 권리</h2>
          <p>
            이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제 요청할 수
            있습니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>7. 마케팅 정보 수신</h2>
          <p>
            이용자는 마케팅 정보 수신에 대해 선택할 수 있으며, 언제든지 철회할
            수 있습니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>8. 정책 변경</h2>
          <p>
            본 개인정보 처리방침은 필요 시 변경될 수 있으며, 변경 시 공지합니다.
          </p>
        </section>

        <section className={sectionClass}>
          <h2 className={h2Class}>9. 문의</h2>
          <p>개인정보 관련 문의는 이메일을 통해 접수할 수 있습니다.</p>
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
