import Script from "next/script"

export function AdSenseScript() {
  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7818876710105434"
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  )
}