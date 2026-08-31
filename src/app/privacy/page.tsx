import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "개인정보처리방침 | 미스터 타로",
  description: "미스터 타로의 개인정보 처리 방침입니다.",
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="MR. TAROT" title="개인정보처리방침" updatedAt="2026년 9월 1일">
      <LegalSection title="1. 이 방침이 설명하는 것">
        <p>미스터 타로는 회원 가입 없이 세 장의 타로 리딩을 제공하는 웹서비스입니다. 이 방침은 서비스 이용 중 어떤 정보가 처리되는지 설명합니다.</p>
      </LegalSection>

      <LegalSection title="2. 질문과 카드 선택">
        <p>입력한 질문은 현재 리딩을 만드는 동안 브라우저 메모리에서만 사용합니다. 질문 원문은 서버, 공유 링크, 분석 이벤트 또는 제휴사에 저장하거나 전송하지 않습니다.</p>
        <p>선택한 카드 조합은 결과 공유 링크를 만들 때만 짧은 토큰으로 표현될 수 있습니다. 이 토큰에는 질문이나 이용자 식별 정보가 포함되지 않습니다.</p>
      </LegalSection>

      <LegalSection title="3. 제휴 링크">
        <p>일부 리딩 뒤에는 쿠팡 파트너스 제휴 링크가 표시될 수 있습니다. 링크를 선택하면 쿠팡의 웹사이트로 이동하며, 그 이후의 정보 처리는 쿠팡의 정책을 따릅니다.</p>
        <p>제휴 링크를 열지 않아도 타로 결과는 언제나 확인할 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="4. 문의와 변경">
        <p>이 방침 또는 개인정보 처리에 관한 문의는 <a className="text-[#d3aa68] underline underline-offset-4" href="mailto:joel610@naver.com">joel610@naver.com</a>으로 보내주세요.</p>
        <p>서비스 운영 방식이 바뀌면 이 페이지의 업데이트 날짜와 함께 방침을 수정합니다.</p>
      </LegalSection>
    </LegalPage>
  );
}
