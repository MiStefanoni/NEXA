import "./globals.css";

export const metadata = {
  title: "Nexa",
  description: "Nexa multilingual professional directory.",
  icons: {
    apple: "/Favicon/apple-touch-icon.png",
    icon: [
      { url: "/Favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/Favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/Favicon/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
