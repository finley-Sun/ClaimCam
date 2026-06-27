import svgPaths from "./svg-ac2i07a9vg";
import { imgGroup } from "./svg-m63kp";

export default function Vr({ className }: { className?: string }) {
  return (
    <div className={className || "overflow-clip relative size-[24px]"} data-name="vr">
      <div className="absolute contents inset-0" data-name="Clip path group">
        <div className="absolute inset-[11.46%_5.21%_11.46%_5.17%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-1.24px_-2.75px] mask-size-[24px_24px]" style={{ maskImage: `url("${imgGroup}")` }} data-name="Group">
          <svg className="absolute block inset-0 size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.51 18.5">
            <path d="M0.75 3.25C0.75 1.87 1.87 0.75 3.25 0.75H18.26C19.64 0.75 20.76 1.87 20.76 3.25V15.25C20.76 16.63 19.64 17.75 18.26 17.75H3.25C1.87 17.75 0.75 16.63 0.75 15.25V3.25Z" fill="var(--fill-0, #C9CFD6)" />
            <rect x="2.5" y="3.75" width="7" height="8.5" rx="1.5" fill="var(--fill-1, #1B1E21)" />
            <rect x="12" y="3.75" width="7" height="8.5" rx="1.5" fill="var(--fill-1, #1B1E21)" />
            <path d="M9.5 8H12" stroke="var(--fill-0, #C9CFD6)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}