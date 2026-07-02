import Script from "next/script";

const pixelId = process.env.NEXT_PUBLIC_X_PIXEL_ID?.trim();

function isValidPixelId(id: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

export default function XPixel() {
  if (!pixelId || !isValidPixelId(pixelId)) {
    return null;
  }

  return (
    <Script id="x-pixel" strategy="afterInteractive">
      {`
        !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
        },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
        a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
        twq('config','${pixelId}');
      `}
    </Script>
  );
}
