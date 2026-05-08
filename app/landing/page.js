import { LandingPage } from "../../components/landing-page";

export const metadata = {
  title: "Nexa | Lista de Espera",
  description: "Entre na lista de espera da Nexa e receba novidades sobre o lançamento da plataforma.",
  icons: {
    apple: "/Favicon/apple-touch-icon.png",
    icon: [
      { url: "/Favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/Favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    shortcut: "/Favicon/favicon.ico",
  },
};

export default function LandingRoute() {
  return <LandingPage />;
}
