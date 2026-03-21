import type { Metadata } from "next";
import { GameProvider } from "@/context/GameContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "The ID Game",
  description: "A party game prototype",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <GameProvider>
          <div id="phone-viewport">{children}</div>
        </GameProvider>
      </body>
    </html>
  );
}
