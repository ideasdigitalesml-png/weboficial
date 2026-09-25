import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import Script from "next/script";
import { ReferralCapture } from "@/components/ReferralCapture";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  weight: ["500", "700"],
  subsets: ["latin"],
});

const SITE_DESCRIPTION =
  "Tu página profesional, lista en minutos. Sin programar, sin complicaciones. $13.400/mes con Mercado Pago.";

const SITE_TITLE = "weboficial — Tu página profesional, lista en minutos";
const SITE_OG_DESCRIPTION =
  "Sin programar, sin complicaciones. Elegís tu diseño, completás tus datos y listo. Desde $13.400/mes con Mercado Pago.";

export const metadata: Metadata = {
  metadataBase: new URL("https://weboficial.com.ar"),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_OG_DESCRIPTION,
    type: "website",
    url: "https://weboficial.com.ar",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_OG_DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} h-full antialiased`} data-theme="light">
      <head>
        {/* Warms up the connection to the 3rd-party origins GA4/Meta Pixel
            actually send tracking requests to (not the script-host origins,
            which load later via next/script anyway), so those requests
            don't each pay DNS+TCP+TLS setup on top of the round trip --
            exactly the 3 origins Lighthouse's network-dependency-tree audit
            flagged as preconnect candidates (~250-315ms est. LCP savings). */}
        <link rel="preconnect" href="https://www.facebook.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://connect.facebook.net" />
        {process.env.NODE_ENV === "production" && (
          <>
            {/* GA4 */}
            <Script
              src="https://www.googletagmanager.com/gtag/js?id=G-0KVP0P2XKR"
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-0KVP0P2XKR');
              `}
            </Script>

            {/* Meta Pixel */}
            <Script id="meta-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '2925352314465309');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img height="1" width="1" style={{display:"none"}}
                src="https://www.facebook.com/tr?id=2925352314465309&ev=PageView&noscript=1"
              />
            </noscript>
          </>
        )}
      </head>
      <body className="min-h-full flex flex-col">
        <ReferralCapture />
        {/* `contents` keeps this invisible to layout (every page already
            supplies its own flex/width classes on its own root element) --
            it exists purely to give the document exactly one <main>
            landmark, which Lighthouse's accessibility audit flagged as
            missing. */}
        <main className="contents">{children}</main>
      </body>
    </html>
  );
}
