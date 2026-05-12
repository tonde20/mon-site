"use client";

export default function LogoCMA({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/images/logo-cma.png"
      alt="Logo CMA"
      className={className ?? "w-full h-full object-cover"}
      onError={(e: any) => {
        e.currentTarget.style.display = "none";
        e.currentTarget.parentElement.innerHTML =
          '<svg class="w-5 h-5 text-white m-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m5 0h4m-6-5h.01M13 16h.01"/></svg>';
      }}
    />
  );
}
