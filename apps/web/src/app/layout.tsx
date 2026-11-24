import "@/app/globals.css";
import { Shell } from "@/components/layout/Shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cross-Machine Plasma Transfer Analysis",
  description:
    "Domain shift, transfer learning, and uncertainty in magnetic equilibrium reconstruction between DIII-D and MAST.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
