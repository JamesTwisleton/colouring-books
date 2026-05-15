import Providers from "@/components/ui/Providers";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="h-dvh flex flex-col bg-[#fff9f0] overflow-hidden pt-safe pl-safe pr-safe">
        {children}
      </div>
    </Providers>
  );
}
