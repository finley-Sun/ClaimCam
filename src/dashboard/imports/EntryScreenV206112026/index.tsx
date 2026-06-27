import svgPaths from "./svg-hvl55jsmte";
import imgLogoOnColor from "./3729220ae32d50d86bc608c0af0bc3da2c0f8946.png";

function H3BodyContainer() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[24px] items-center relative shrink-0 text-center w-[523px]" data-name="h3&body-container">
      <p className="font-['Poppins:Medium',sans-serif] leading-[48px] not-italic relative shrink-0 text-[40px] text-white w-full">Choose your portal</p>
      <p className="font-['DM_Sans:Regular',sans-serif] font-normal leading-[24px] relative shrink-0 text-[#c9cfd6] text-[20px] w-full" style={{ fontVariationSettings: '"opsz" 14' }}>{`Pick the portal that fits how you're covered — ClaimCam builds your 3D archive around it.`}</p>
    </div>
  );
}

function Home() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="Home">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="Home">
          <path d={svgPaths.p4f22280} fill="var(--fill-0, black)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function OwnerIcon() {
  return (
    <div className="bg-[#ffa16c] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[16px] shrink-0" data-name="owner-icon">
      <Home />
    </div>
  );
}

function IconContainer() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="icon-container">
      <OwnerIcon />
      <div className="overflow-clip relative shrink-0 size-[64px]" data-name="Upper Right Arrow">
        <div className="absolute inset-1/4" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32.001 32">
            <path d={svgPaths.p94b7af0} fill="var(--fill-0, #939393)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function OwnerIntro() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal gap-[12px] items-start relative shrink-0 w-full" data-name="owner-intro">
      <p className="leading-[28px] relative shrink-0 text-[24px] text-white w-full" style={{ fontVariationSettings: '"opsz" 14' }}>
        Owner Portal
      </p>
      <p className="leading-[20px] relative shrink-0 text-[#c9cfd6] text-[16px] w-full" style={{ fontVariationSettings: '"opsz" 14' }}>
        Protect your home and belongings — document structure, grounds, and rebuild value before damage happens.
      </p>
    </div>
  );
}

function Divider({ className }: { className?: string }) {
  return (
    <div className={className || "content-stretch flex flex-col h-[0.8px] items-start justify-center relative shrink-0 w-full"} data-name="divider">
      <div className="bg-[rgba(255,255,255,0.05)] h-[0.8px] relative shrink-0 w-full" data-name="line" />
    </div>
  );
}

function Sofa() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Sofa">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Sofa">
          <path d={svgPaths.p2ddc4400} fill="var(--fill-0, #C9CFD6)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function BelongingsContainer() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-full" data-name="belongings-container">
      <Sofa />
      <p className="[word-break:break-word] flex-[1_0_0] font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] min-w-px relative text-[#c9cfd6] text-[16px]" style={{ fontVariationSettings: '"opsz" 14' }}>
        Insured belongings
      </p>
    </div>
  );
}

function RebuildContainer() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-full" data-name="rebuild-container">
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Tool">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[22px] left-[calc(50%-0.5px)] top-1/2 w-[17px]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 22">
            <path d={svgPaths.pee68200} fill="var(--fill-0, #C9CFD6)" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="[word-break:break-word] flex-[1_0_0] font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] min-w-px relative text-[#c9cfd6] text-[16px]" style={{ fontVariationSettings: '"opsz" 14' }}>{`Structure & rebuild value`}</p>
    </div>
  );
}

function LiabilityContainer() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-full" data-name="liability-container">
      <div className="relative shrink-0 size-[24px]" data-name="trees">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[19px] left-[calc(50%+0.27px)] top-[calc(50%+0.5px)] w-[17px]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 19">
            <path clipRule="evenodd" d={svgPaths.p4706a00} fill="var(--fill-0, #C9CFD6)" fillRule="evenodd" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="[word-break:break-word] flex-[1_0_0] font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] min-w-px relative text-[#c9cfd6] text-[16px]" style={{ fontVariationSettings: '"opsz" 14' }}>{`Yard, walkways & liability risks`}</p>
    </div>
  );
}

function FeatureList() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="feature-list">
      <BelongingsContainer />
      <RebuildContainer />
      <LiabilityContainer />
    </div>
  );
}

function HomeOwnerContainer() {
  return (
    <div className="backdrop-blur-[50px] bg-[#4a4a4a] content-stretch flex flex-col gap-[12px] items-center overflow-clip p-[24px] relative rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1)] shrink-0 w-[445px]" data-name="homeOwner-container">
      <IconContainer />
      <OwnerIntro />
      <Divider />
      <FeatureList />
    </div>
  );
}

function OwnerIcon1() {
  return (
    <div className="bg-[#ffa16c] content-stretch flex items-center overflow-clip p-[8px] relative rounded-[16px] shrink-0" data-name="owner-icon">
      <div className="overflow-clip relative shrink-0 size-[32px]" data-name="building">
        <div className="absolute inset-[8.33%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 26.6667 26.6667">
            <path d={svgPaths.p4f86480} fill="var(--fill-0, black)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function IconContainer1() {
  return (
    <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="icon-container">
      <OwnerIcon1 />
      <div className="overflow-clip relative shrink-0 size-[64px]" data-name="Upper Right Arrow">
        <div className="absolute inset-1/4" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32.001 32">
            <path d={svgPaths.p94b7af0} fill="var(--fill-0, #939393)" id="Vector" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function OwnerIntro1() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col font-['DM_Sans:Regular',sans-serif] font-normal gap-[12px] items-start relative shrink-0 w-full" data-name="owner-intro">
      <p className="leading-[28px] relative shrink-0 text-[24px] text-white w-full" style={{ fontVariationSettings: '"opsz" 14' }}>
        Tenant Portal
      </p>
      <p className="leading-[20px] relative shrink-0 text-[#c9cfd6] text-[16px] w-full" style={{ fontVariationSettings: '"opsz" 14' }}>
        Document your personal belongings and compare move-in vs move-out condition to protect your deposit.
      </p>
    </div>
  );
}

function Sofa1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="Sofa">
      <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Sofa">
          <path d={svgPaths.p2ddc4400} fill="var(--fill-0, #C9CFD6)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function BelongingsContainer1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-full" data-name="belongings-container">
      <Sofa1 />
      <p className="[word-break:break-word] flex-[1_0_0] font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] min-w-px relative text-[#c9cfd6] text-[16px]" style={{ fontVariationSettings: '"opsz" 14' }}>
        Insured belongings
      </p>
    </div>
  );
}

function RebuildContainer1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-full" data-name="rebuild-container">
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Moving">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute h-[23px] left-1/2 top-[calc(50%+0.5px)] w-[20px]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 23">
            <path clipRule="evenodd" d={svgPaths.p1d3f180} fill="var(--fill-0, #C9CFD6)" fillRule="evenodd" id="Vector" />
          </svg>
        </div>
      </div>
      <p className="[word-break:break-word] flex-[1_0_0] font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] min-w-px relative text-[#c9cfd6] text-[16px]" style={{ fontVariationSettings: '"opsz" 14' }}>{`Move-in & move-out compare`}</p>
    </div>
  );
}

function LiabilityContainer1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0 w-full" data-name="liability-container">
      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Folder">
        <div className="absolute inset-[6.23%_9.37%_6.33%_9.37%]" data-name="Vector">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 19.5024 20.9843">
            <path d={svgPaths.p35ef06c0} fill="var(--fill-0, #C9CFD6)" id="Vector" />
          </svg>
        </div>
        <div className="absolute inset-[60.42%_40.42%_27.08%_42.92%]">
          <div className="absolute inset-[-13.33%_-10%]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4.80001 3.8">
              <path d={svgPaths.p34bddc00} id="Vector 1" stroke="var(--stroke-0, #C9CFD6)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.8" />
            </svg>
          </div>
        </div>
      </div>
      <p className="[word-break:break-word] flex-[1_0_0] font-['DM_Sans:Regular',sans-serif] font-normal leading-[20px] min-w-px relative text-[#c9cfd6] text-[16px]" style={{ fontVariationSettings: '"opsz" 14' }}>
        Fast, evidence-backed claims
      </p>
    </div>
  );
}

function FeatureList1() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="feature-list">
      <BelongingsContainer1 />
      <RebuildContainer1 />
      <LiabilityContainer1 />
    </div>
  );
}

function TenantContainer() {
  return (
    <div className="backdrop-blur-[50px] bg-[#4a4a4a] content-stretch flex flex-col gap-[12px] items-center overflow-clip p-[24px] relative rounded-[16px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.1)] shrink-0 w-[445px]" data-name="tenant-container">
      <IconContainer1 />
      <OwnerIntro1 />
      <div className="content-stretch flex flex-col h-[0.8px] items-start justify-center relative shrink-0 w-full" data-name="divider">
        <div className="bg-[rgba(255,255,255,0.05)] h-[0.8px] relative shrink-0 w-full" data-name="line" />
      </div>
      <FeatureList1 />
    </div>
  );
}

function EntryPortalContainer() {
  return (
    <div className="content-stretch flex gap-[32px] items-center relative shrink-0 w-full" data-name="entry-portal-container">
      <HomeOwnerContainer />
      <TenantContainer />
    </div>
  );
}

function EntryScreenContainer() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute content-stretch flex flex-col gap-[24px] items-center left-1/2 top-[calc(50%+0.04px)] w-[922px]" data-name="entryScreen-container">
      <div className="h-[87.271px] relative shrink-0 w-[376px]" data-name="logo-onColor">
        <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgLogoOnColor} />
      </div>
      <H3BodyContainer />
      <EntryPortalContainer />
    </div>
  );
}

export default function EntryScreenV() {
  return (
    <div className="bg-white relative size-full" data-name="entryScreen_v2_06-11-2026">
      <div className="absolute bg-[rgba(0,0,0,0.8)] h-[1024px] left-0 top-0 w-[1440px]" />
      <EntryScreenContainer />
    </div>
  );
}