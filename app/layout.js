import "./globals.css";

export const metadata = {
  title: "Athmiya Geleyara Balaga — Ganesha Festival Invitation",
  description: "Welcome to the Ganesha Festival, 02 – 04 October 2026, Yelahanka Newtown, Bangalore.",
};
export const viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0e0704" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Noto+Serif+Kannada:wght@500;700&display=swap"
          rel="stylesheet"
        />
      </head>
            <body>
        {children}
        <a href="https://rakvih.in" target="_blank" rel="noopener noreferrer" id="credit">Designed and developed by <span class="rakvih">Rakvih</span></a>
      </body>
    </html>
  );
}
