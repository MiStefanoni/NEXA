/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/pt",
        permanent: false,
      },
      {
        source: "/landing.html",
        destination: "/landing",
        permanent: false,
      },
      {
        source: "/admin.html",
        destination: "/admin",
        permanent: false,
      },
      {
        source: "/admin-login.html",
        destination: "/admin/login",
        permanent: false,
      },
      {
        source: "/pt/index.html",
        destination: "/pt",
        permanent: false,
      },
      {
        source: "/en/index.html",
        destination: "/en",
        permanent: false,
      },
      {
        source: "/pt/browse-categories.html",
        destination: "/pt/categories",
        permanent: false,
      },
      {
        source: "/en/browse-categories.html",
        destination: "/en/categories",
        permanent: false,
      },
      {
        source: "/pt/professionals.html",
        destination: "/pt/professionals",
        permanent: false,
      },
      {
        source: "/en/professionals.html",
        destination: "/en/professionals",
        permanent: false,
      },
      {
        source: "/pt/apply.html",
        destination: "/pt/apply",
        permanent: false,
      },
      {
        source: "/en/apply.html",
        destination: "/en/apply",
        permanent: false,
      },
      {
        source: "/pt/diretrizes.html",
        destination: "/pt/guidelines",
        permanent: false,
      },
      {
        source: "/en/guidelines.html",
        destination: "/en/guidelines",
        permanent: false,
      },
      {
        source: "/pt/politica-de-privacidade.html",
        destination: "/pt/privacy-policy",
        permanent: false,
      },
      {
        source: "/en/privacy-policy.html",
        destination: "/en/privacy-policy",
        permanent: false,
      },
      {
        source: "/pt/politica-de-uso.html",
        destination: "/pt/terms-of-use",
        permanent: false,
      },
      {
        source: "/en/terms-of-use.html",
        destination: "/en/terms-of-use",
        permanent: false,
      },
      {
        source: "/pt/profile-template.html",
        has: [{ type: "query", key: "slug", value: "(?<slug>.*)" }],
        destination: "/pt/profile/:slug",
        permanent: false,
      },
      {
        source: "/en/profile-template.html",
        has: [{ type: "query", key: "slug", value: "(?<slug>.*)" }],
        destination: "/en/profile/:slug",
        permanent: false,
      },
      {
        source: "/pt/category-saude-bem-estar-cuidado.html",
        destination: "/pt/category/saude-bem-estar-cuidado",
        permanent: false,
      },
      {
        source: "/en/category-saude-bem-estar-cuidado.html",
        destination: "/en/category/saude-bem-estar-cuidado",
        permanent: false,
      },
      {
        source: "/pt/category-servicos-profissionais-negocios.html",
        destination: "/pt/category/servicos-profissionais-negocios",
        permanent: false,
      },
      {
        source: "/en/category-servicos-profissionais-negocios.html",
        destination: "/en/category/servicos-profissionais-negocios",
        permanent: false,
      },
      {
        source: "/pt/category-home-and-family-care.html",
        destination: "/pt/category/home-and-family-care",
        permanent: false,
      },
      {
        source: "/en/category-home-and-family-care.html",
        destination: "/en/category/home-and-family-care",
        permanent: false,
      },
      {
        source: "/pt/category-educacao-desenvolvimento-consultoria.html",
        destination: "/pt/category/educacao-desenvolvimento-consultoria",
        permanent: false,
      },
      {
        source: "/en/category-educacao-desenvolvimento-consultoria.html",
        destination: "/en/category/educacao-desenvolvimento-consultoria",
        permanent: false,
      }
    ];
  },
};

module.exports = nextConfig;
