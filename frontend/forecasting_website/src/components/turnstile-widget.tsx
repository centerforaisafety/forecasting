import React from "react";
import { Turnstile } from "@marsidev/react-turnstile";

interface TurnstileWidgetProps {
  setToken: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function TurnstileWidget({ setToken }: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY || "";

  return (
    <Turnstile
      siteKey={siteKey}
      onSuccess={setToken}
      options={{
        // size: 'invisible',
        theme: "auto"
      }}
    />
  );
}
