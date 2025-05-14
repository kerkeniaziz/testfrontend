
import { Providers } from "@/compnents/provider";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
        <Providers>
        {children}
        </Providers>
        </>
  );
}
