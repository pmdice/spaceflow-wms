export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-amber-50/30 p-4">
      {children}
    </div>
  );
}
