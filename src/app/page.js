import LinkedInPostGenerator from "./LinkedInPostGenerator";
import { Analytics } from "@vercel/analytics/next";

export default function Home() {
  return (
    <>
      <LinkedInPostGenerator />
      <Analytics />
    </>
  );
}
