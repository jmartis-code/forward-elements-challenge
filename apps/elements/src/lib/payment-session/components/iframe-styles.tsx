"use client";

export function IframeStyles() {
  return (
    <style jsx global>{`
      html,
      body {
        min-height: 100%;
        height: 100%;
      }
      iframe {
        min-height: 370px !important;
        height: 370px !important;
      }
    `}</style>
  );
}
