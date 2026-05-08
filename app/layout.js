import "./globals.css";

export const metadata = {
  title: "Nexa",
  description: "Nexa multilingual professional directory.",
};

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
