import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LinkPilot AI – LinkedIn Post Generator",
  description:
    "Generate engaging, actionable LinkedIn posts with AI. Add images, preview formatting, and post directly to LinkedIn.",
  openGraph: {
    title: "LinkPilot AI – LinkedIn Post Generator",
    description:
      "Generate engaging, actionable LinkedIn posts with AI. Add images, preview formatting, and post directly to LinkedIn.",
    url: "https://linkpilot-ai.vercel.app/",
    siteName: "LinkPilot AI",
    images: [
      {
        url: "https://linkpilot-ai.vercel.app/public/file.svg",
        width: 1200,
        height: 630,
        alt: "LinkPilot AI – LinkedIn Post Generator",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "LinkPilot AI – LinkedIn Post Generator",
    description:
      "Generate engaging, actionable LinkedIn posts with AI. Add images, preview formatting, and post directly to LinkedIn.",
    images: ["https://linkpilot-ai.vercel.app/public/file.svg"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>LinkPilot AI – LinkedIn Post Generator</title>
        <meta
          name="description"
          content="Generate engaging, actionable LinkedIn posts with AI. Add images, preview formatting, and post directly to LinkedIn."
        />
        <meta
          property="og:title"
          content="LinkPilot AI – LinkedIn Post Generator"
        />
        <meta
          property="og:description"
          content="Generate engaging, actionable LinkedIn posts with AI. Add images, preview formatting, and post directly to LinkedIn."
        />
        <meta property="og:url" content="https://linkpilot-ai.vercel.app/" />
        <meta property="og:site_name" content="LinkPilot AI" />
        <meta
          property="og:image"
          content="https://linkpilot-ai.vercel.app/file.svg"
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="LinkPilot AI – LinkedIn Post Generator"
        />
        <meta
          name="twitter:description"
          content="Generate engaging, actionable LinkedIn posts with AI. Add images, preview formatting, and post directly to LinkedIn."
        />
        <meta
          name="twitter:image"
          content="https://linkpilot-ai.vercel.app/file.svg"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
