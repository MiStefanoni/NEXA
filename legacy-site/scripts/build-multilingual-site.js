const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");
const dataPath = path.join(projectRoot, "data", "professionals.json");
const csvPath = path.join(projectRoot, "data", "professionals.csv");
const ENGLISH_PUBLICLY_VISIBLE = false;

const CATEGORY_ORDER = [
  "saude-bem-estar-cuidado",
  "servicos-profissionais-negocios",
  "home-and-family-care",
  "educacao-desenvolvimento-consultoria",
];

const CATEGORY_META = {
  "saude-bem-estar-cuidado": {
    pt: {
      title: "Saúde, Bem-Estar e Cuidado",
      description:
        "Psicólogas, nutricionistas, fisioterapeutas, personal trainers, terapeutas ocupacionais, fonoaudiólogas, médicas, dentistas, terapeutas, profissionais de estética.",
      note: "Atendimento especializado com foco em saúde, acolhimento e confiança.",
      pageDescription:
        "Encontre profissionais de saúde, bem-estar e cuidado oferecendo suporte especializado, atendimento confiável e experiências mais seguras para suas clientes.",
    },
    en: {
      title: "Health, Wellness & Care",
      description:
        "Psychologists, nutritionists, physical therapists, personal trainers, occupational therapists, speech therapists, doctors, dentists, therapists, and beauty professionals.",
      note: "Specialized care centered on wellbeing, trust, and client support.",
      pageDescription:
        "Explore health, wellness, and care professionals offering trusted expertise, thoughtful support, and structured client experiences.",
    },
  },
  "servicos-profissionais-negocios": {
    pt: {
      title: "Serviços Profissionais e Negócios",
      description:
        "Advogadas, contadoras, consultoras empresariais, recrutadoras, profissionais de RH, estrategistas de marca, arquitetas, designers, programadoras, assessoras e especialistas B2B.",
      note: "Serviços estruturados para operação, crescimento e suporte profissional.",
      pageDescription:
        "Descubra profissionais que apoiam negócios, operações e entregas especializadas com clareza, organização e credibilidade.",
    },
    en: {
      title: "Professional & Business Services",
      description:
        "Lawyers, accountants, business consultants, recruiters, HR professionals, brand strategists, architects, designers, developers, assistants, and B2B specialists.",
      note: "Structured services for operations, growth, and professional support.",
      pageDescription:
        "Discover professionals supporting businesses, operations, and specialized delivery with clarity, structure, and credibility.",
    },
  },
  "home-and-family-care": {
    pt: {
      title: "Casa e Família",
      description:
        "Babás, chefs e cozinheiras, cuidadora de idosos, diaristas, personal organizers, serviços gerais e construção.",
      note: "Serviços domésticos, familiares e de manutenção com confiança e apoio prático.",
      pageDescription:
        "Explore profissionais que apoiam a rotina da casa e da família com organização, cuidado, manutenção e serviços práticos.",
    },
    en: {
      title: "Home and Family Care",
      description:
        "Nannies, chefs and cooks, elder care providers, cleaners, personal organizers, and general home and construction services.",
      note: "Trusted home, family, and maintenance services with practical day-to-day support.",
      pageDescription:
        "Explore professionals supporting home and family life through organization, care, upkeep, and practical residential services.",
    },
  },
  "educacao-desenvolvimento-consultoria": {
    pt: {
      title: "Educação, Desenvolvimento e Consultoria",
      description:
        "Professoras particulares, especialistas em idiomas, orientadoras educacionais, mentoras, consultoras de carreira, educadoras, facilitadoras.",
      note: "Aprendizado, orientação e desenvolvimento com método e clareza.",
      pageDescription:
        "Explore profissionais focadas em ensino, desenvolvimento e consultoria com abordagens estruturadas para aprendizado e crescimento.",
    },
    en: {
      title: "Education, Development & Consulting",
      description:
        "Private tutors, language specialists, educational advisors, mentors, career consultants, educators, and facilitators.",
      note: "Learning, guidance, and development delivered with structure and clarity.",
      pageDescription:
        "Explore professionals focused on education, development, and consulting through structured guidance for learning and growth.",
    },
  },
};

const ROLE_PT = {
  "Admissions Consultant": "Consultora de Admissões",
  "Brand Designer & Creative Director": "Designer de Marca e Diretora Criativa",
  "Brand Strategist": "Estrategista de Marca",
  "Business Analyst": "Analista de Negócios",
  "Business Attorney": "Advogada Empresarial",
  CPA: "Contadora Pública Certificada",
  "Care Coordinator": "Coordenadora de Cuidados",
  "Career Coach": "Mentora de Carreira",
  Carpenter: "Carpinteira",
  "Closet Installer": "Instaladora de Closets",
  "Communications Advisor": "Consultora de Comunicação",
  "Community Manager": "Gerente de Comunidade",
  "Concierge Specialist": "Especialista em Concierge",
  "Content Producer": "Produtora de Conteúdo",
  "Conversion Copywriter": "Copywriter de Conversão",
  "Copywriter & Content Strategist": "Copywriter e Estrategista de Conteúdo",
  Doula: "Doula",
  Electrician: "Eletricista",
  "Email Designer": "Designer de Email",
  "Email Marketer": "Especialista em Email Marketing",
  "Event Planner": "Planejadora de Eventos",
  "Executive Assistant": "Assistente Executiva",
  "Floral Designer": "Designer Floral",
  "Frontend Developer": "Desenvolvedora Front-end",
  "Grant Writer": "Redatora de Projetos",
  "HR Advisor": "Consultora de RH",
  "HVAC Technician": "Técnica de HVAC",
  Handyperson: "Profissional de Reparos",
  "Home Inspector": "Inspetora Residencial",
  "Home Organizer": "Organizadora Residencial",
  "Host & MC": "Apresentadora e Mestre de Cerimônias",
  Illustrator: "Ilustradora",
  "Interior Painter": "Pintora de Interiores",
  "Lactation Consultant": "Consultora de Amamentação",
  "Landscape Designer": "Designer de Paisagismo",
  "Leadership Coach": "Mentora de Liderança",
  "Learning Designer": "Designer de Aprendizagem",
  "Licensed Therapist": "Terapeuta Licenciada",
  "Literacy Specialist": "Especialista em Alfabetização",
  "Massage Therapist": "Massoterapeuta",
  "Mediation Specialist": "Especialista em Mediação",
  "Messaging Strategist": "Estrategista de Mensagem",
  "Mindset Coach": "Mentora de Mindset",
  Nutritionist: "Nutricionista",
  "Occupational Therapist": "Terapeuta Ocupacional",
  "Operations Consultant": "Consultora de Operações",
  "Personal Stylist": "Consultora de Estilo",
  Photographer: "Fotógrafa",
  "Physical Therapist": "Fisioterapeuta",
  Plumber: "Encanadora",
  "Podcast Producer": "Produtora de Podcasts",
  "Procurement Specialist": "Especialista em Compras",
  "Project Manager": "Gerente de Projetos",
  Publicist: "Publicista",
  "Retreat Curator": "Curadora de Retiros",
  "SAT Prep Tutor": "Tutora de Preparação para o SAT",
  "SEO Specialist": "Especialista em SEO",
  "STEM Tutor": "Tutora de STEM",
  "Sleep Consultant": "Consultora do Sono",
  "Social Strategist": "Estrategista de Mídias Sociais",
  "Spanish Tutor": "Tutora de Espanhol",
  "Tablescape Designer": "Designer de Mesas",
  "Tile Specialist": "Especialista em Revestimentos",
  "Travel Planner": "Planejadora de Viagens",
  "UX Designer": "Designer de UX",
  Videographer: "Videomaker",
  "Webflow Developer": "Desenvolvedora Webflow",
  "Wedding Coordinator": "Coordenadora de Casamentos",
  "Workshop Facilitator": "Facilitadora de Workshops",
  "Yoga Instructor": "Instrutora de Yoga",
};

const PHRASE_PT_REPLACEMENTS = {
  "Accounting firm partner": "Sócia de escritório contábil",
  "Boutique agency owner": "Fundadora de agência boutique",
  "Boutique publicist": "Publicista boutique",
  "Certified coach": "Coach certificada",
  "Certified consultant": "Consultora certificada",
  "Certified mediator": "Mediadora certificada",
  "Certified reading specialist": "Especialista certificada em leitura",
  "Certified technician": "Técnica certificada",
  "Certified tradeswoman": "Profissional técnica certificada",
  "Clinic-based specialist": "Especialista vinculada a clínica",
  "Coaching practice owner": "Fundadora de prática de coaching",
  "Concierge consultant": "Consultora de concierge",
  Consultant: "Consultora",
  "Consulting lead": "Líder de consultoria",
  "Contract developer": "Desenvolvedora contratada",
  "Creative freelancer": "Profissional criativa freelancer",
  "Creative stylist": "Stylist criativa",
  "Curriculum consultant": "Consultora curricular",
  "Education consultant": "Consultora educacional",
  "Email consultant": "Consultora de email",
  "Executive coach": "Coach executiva",
  "Experience director": "Diretora de experiência",
  Facilitator: "Facilitadora",
  "Fractional analyst": "Analista fracionada",
  "Fractional community lead": "Líder fracionada de comunidade",
  "Fractional support partner": "Parceira fracionada de suporte",
  "Freelance specialist": "Especialista freelancer",
  "Freelance writer": "Redatora freelancer",
  "Independent advisor": "Consultora independente",
  "Independent care provider": "Profissional de cuidado independente",
  "Independent consultant": "Consultora independente",
  "Independent coordinator": "Coordenadora independente",
  "Independent craftsperson": "Artesã independente",
  "Independent educator": "Educadora independente",
  "Independent installer": "Instaladora independente",
  "Independent planner": "Planejadora independente",
  "Independent service provider": "Prestadora de serviços independente",
  "Independent strategist": "Estrategista independente",
  "Independent studio": "Estúdio independente",
  "Installation specialist": "Especialista em instalação",
  "Licensed contractor": "Contratada licenciada",
  "Licensed inspector": "Inspetora licenciada",
  "Licensed plumber": "Encanadora licenciada",
  "Licensed practice owner": "Fundadora de prática licenciada",
  "Licensed provider": "Profissional licenciada",
  "Lifecycle consultant": "Consultora de ciclo de vida",
  "Lifestyle consultant": "Consultora de lifestyle",
  "Lifestyle service provider": "Prestadora de serviços de lifestyle",
  "Outdoor design consultant": "Consultora de design externo",
  "Pediatric specialist": "Especialista pediátrica",
  "People operations consultant": "Consultora de operações de pessoas",
  "Planning studio owner": "Fundadora de estúdio de planejamento",
  Presenter: "Apresentadora",
  "Private instructor": "Instrutora particular",
  "Private practice owner": "Fundadora de prática privada",
  "Private tutor": "Tutora particular",
  "Production consultant": "Consultora de produção",
  "Production lead": "Líder de produção",
  "Production partner": "Parceira de produção",
  "Strategy studio founder": "Fundadora de estúdio de estratégia",
  "Studio founder": "Fundadora de estúdio",
  "Studio owner": "Fundadora de estúdio",
  "Test prep tutor": "Tutora de preparação para provas",
  "Wellness studio owner": "Fundadora de estúdio de bem-estar",
  "Project-based": "Por projeto",
  Remote: "Remoto",
  Hybrid: "Híbrido",
  "On-site": "Presencial",
  English: "Inglês",
  Spanish: "Espanhol",
  Arabic: "Árabe",
  Portuguese: "Português",
  French: "Francês",
  Turkish: "Turco",
  Italian: "Italiano",
};

const SITE_COPY = {
  pt: {
    htmlLang: "pt-BR",
    nav: {
      categories: "Explorar categorias",
      professionals: "Explorar profissionais",
      howItWorks: "Como funciona",
      apply: "Candidatar-se",
      browse: "Explorar",
      menu: "Menu",
      forProfessionals: "Para profissionais",
      applyNow: "Entre para a Nexa",
    },
    footer: {
      howItWorks: "Como funciona",
      categories: "Explorar categorias",
      professionals: "Explorar profissionais",
      applyNow: "Entre para a Nexa",
      guidelines: "Diretrizes",
      privacy: "Privacidade",
      usage: "Política de uso",
    },
    home: {
      title: "Nexa | Diretório Profissional Multilíngue para Mulheres",
      description:
        "Nexa é um diretório profissional que conecta mulheres profissionais a clientes por meio de visibilidade confiável, perfis bem apresentados e contatos estruturados.",
      heroEyebrow: "Visibilidade profissional, pensada com cuidado",
      heroTitle: "Mulheres profissionais, novas conexões, mais oportunidades",
      heroBody:
        "A Nexa é uma plataforma criada para ampliar a presença de mulheres no mercado, conectando talentos a clientes, empresas e parceiros que procuram serviços com confiança, qualidade e profissionalismo. Aqui, cada perfil ganha uma vitrine própria para mostrar experiências, serviços e diferenciais abrindo caminhos para novas conexões e oportunidades reais.",
      heroPrimary: "Encontrar profissionais",
      heroSecondary: "Entrar para a Nexa",
      heroImageAlt: "Mulher usando a plataforma Nexa",
      howEyebrow: "Como funciona",
      howTitle: "Do cadastro ao contato: uma jornada simples, segura e profissional",
      steps: [
        {
          step: "Passo 1",
          title: "Candidate-se para fazer parte",
          body: "Envie suas informações para análise. A curadoria da Nexa ajuda a manter a plataforma organizada, confiável e alinhada ao seu propósito: valorizar mulheres profissionais e seus talentos.",
        },
        {
          step: "Passo 2",
          title: "Crie seu perfil profissional",
          body: "Apresente sua trajetória, seus serviços, sua experiência e seus diferenciais em uma página clara, estruturada e fácil de conhecer.",
        },
        {
          step: "Passo 3",
          title: "Receba conexões qualificadas",
          body: "Clientes, empresas e parceiros podem encontrar seu perfil por área de atuação, localização e formato de atendimento, facilitando contatos mais diretos e relevantes.",
        },
      ],
      categoriesEyebrow: "Categorias",
      categoriesTitle: "Encontre mulheres profissionais em áreas essenciais para a sua vida, sua rotina e seu negócio",
      featuredEyebrow: "Profissionais em destaque",
      featuredTitle: "Conheça as profissionais que já fazem parte da Nexa",
      availability: "Disponibilidade",
      featuredFilterAria: "Filtrar profissionais em destaque por disponibilidade",
      filters: { all: "Todas", remote: "Remoto", local: "Local" },
      joinEyebrow: "ENTRE PARA A NEXA",
      joinTitle: "Faça parte de uma plataforma criada para valorizar o seu trabalho",
      joinBody:
        "A Nexa reúne mulheres que querem apresentar seus serviços com mais profissionalismo, fortalecer sua presença no mercado e ser encontradas por quem procura talento, confiança e qualidade. Ao entrar para a Nexa, seu trabalho ganha um espaço próprio para mostrar quem você é, o que você faz e por que a sua experiência merece ser reconhecida. Um perfil pensado para valorizar sua trajetória Apresente seus serviços, sua experiência, seus diferenciais e sua forma de atuação em uma página clara, profissional e fácil de compartilhar. Mais chances de ser encontrada por quem procura o que você oferece A Nexa organiza profissionais por categoria, localização e formato de atendimento, facilitando o encontro entre mulheres qualificadas e pessoas interessadas em contratar. Uma presença profissional mais forte e organizada Seu trabalho passa a ocupar um espaço confiável, com foco em visibilidade, conexão e novas oportunidades sem depender apenas das redes sociais.",
      joinPoints: [],
      joinCta: "",
      inlineFormTitle: "Envie sua candidatura",
      inlineFormBody:
        "Preencha suas informações para que a equipe da Nexa conheça melhor sua atuação profissional e avalie seu perfil para fazer parte da plataforma.",
      inlineFormName: "Nome",
      inlineFormNamePlaceholder: "Seu nome completo",
      inlineFormEmail: "Email",
      inlineFormEmailPlaceholder: "nome@exemplo.com",
      inlineFormCategory: "Categoria",
      inlineFormCategoryPlaceholder: "Selecione uma categoria",
      inlineFormDescription: "Descrição",
      inlineFormDescriptionPlaceholder: "Conte sobre seu trabalho, serviços e clientes ideais.",
      inlineFormSubmit: "Enviar candidatura",
    },
    browseCategories: {
      title: "Categorias | Nexa",
      description: "Explore categorias de serviço no diretório multilíngue da Nexa.",
      eyebrow: "Explorar categorias",
      heading: "Conheça os serviços liderados por mulheres disponíveis na Nexa",
      intro:
        "Navegue por categorias curadas para facilitar descoberta, comparação e contatos mais profissionais.",
    },
    professionals: {
      title: "Profissionais | Nexa",
      description: "Explore todas as profissionais listadas na Nexa em português.",
      eyebrow: "Profissionais",
      heading: "Explore o diretório completo da Nexa",
      intro:
        "Conheça mulheres profissionais em todas as categorias ativas da Nexa. O diretório é alimentado por uma base compartilhada para manter os perfis consistentes conforme o catálogo cresce.",
      availability: "Disponibilidade",
      directoryFilterAria: "Filtrar profissionais por disponibilidade",
      filters: { all: "Todas", remote: "Remoto", local: "Local" },
      searchPlaceholder: "Buscar uma profissional",
      searchAria: "Buscar profissionais",
    },
    apply: {
      title: "Candidatar-se | Nexa",
      description: "Candidate-se para participar da Nexa como profissional listada.",
      eyebrow: "Aplicação profissional",
      heading: "Candidate-se para entrar na Nexa",
      intro:
        "A Nexa recebe mulheres profissionais que desejam um espaço confiável e bem apresentado para divulgar seus serviços. Candidate-se para ser considerada no diretório e em uma página de perfil estruturada.",
      points: [
        "Análise cuidadosa para manter o diretório coerente, confiável e alinhado.",
        "Estruturas de perfil pensadas para clareza, confiança e descoberta.",
        "Caminhos de contato estruturados que reduzem ruído e melhoram alinhamento.",
      ],
      formTitle: "Formulário de aplicação profissional",
      name: "Nome",
      namePlaceholder: "Seu nome completo",
      email: "Email",
      emailPlaceholder: "nome@exemplo.com",
      category: "Categoria",
      categoryPlaceholder: "Selecione uma categoria",
      location: "Localização",
      locationPlaceholder: "Cidade, estado ou remoto",
      website: "Website ou portfólio",
      websitePlaceholder: "https://seusite.com",
      descriptionLabel: "Descrição",
      descriptionPlaceholder: "Conte sobre seu trabalho, serviços, experiência e clientes ideais.",
      submit: "Enviar candidatura",
    },
    profileTemplate: {
      title: "Perfil | Nexa",
      description: "Página de perfil profissional da Nexa em português.",
    },
    category: {
      eyebrow: "Categoria",
      noteEyebrow: "Nota Nexa",
      browseAll: "Explorar todas as profissionais",
      metaTitle: (title) => `${title} | Nexa`,
      metaDescription: (title) => `Explore profissionais da categoria ${title} na Nexa.`,
    },
    legal: {
      backHome: "Voltar para início",
    },
  },
  en: {
    htmlLang: "en",
    nav: {
      categories: "Browse categories",
      professionals: "Browse professionals",
      howItWorks: "How it works",
      apply: "Apply",
      browse: "Browse",
      menu: "Menu",
      forProfessionals: "For professionals",
      applyNow: "Apply now",
    },
    footer: {
      howItWorks: "How it works",
      categories: "Browse categories",
      professionals: "Browse professionals",
      applyNow: "Apply now",
      guidelines: "Guidelines",
      privacy: "Privacy",
      usage: "Terms of use",
    },
    home: {
      title: "Nexa | Multilingual Professional Directory for Women",
      description:
        "Nexa is a professional directory connecting women professionals to clients through trusted visibility, polished profiles, and structured inquiries.",
      heroEyebrow: "Professional visibility, thoughtfully designed",
      heroTitle: "Connecting women professionals to opportunity",
      heroBody:
        "Nexa is a curated professional directory that helps women showcase their work, share expertise, and receive structured client inquiries in a safer, more professional environment.",
      heroPrimary: "Browse professionals",
      heroSecondary: "Join as a professional",
      heroImageAlt: "Woman using the Nexa platform",
      howEyebrow: "How it works",
      howTitle: "A directory experience built around clarity and trust",
      steps: [
        {
          step: "Step 1",
          title: "Apply to join",
          body: "Submit your details for review so the directory remains professional, credible, and aligned with Nexa’s standards.",
        },
        {
          step: "Step 2",
          title: "Build your profile",
          body: "Present your services, background, and portfolio with a polished profile designed for discovery rather than social posting.",
        },
        {
          step: "Step 3",
          title: "Receive structured inquiries",
          body: "Clients reach out through guided contact flows, helping you assess fit without open direct messaging.",
        },
      ],
      categoriesEyebrow: "Categories",
      categoriesTitle: "Explore professionals across trusted service categories",
      featuredEyebrow: "Featured professionals",
      featuredTitle: "Discover standout profiles on Nexa",
      availability: "Availability",
      featuredFilterAria: "Filter featured professionals by availability",
      filters: { all: "All", remote: "Remote", local: "Local" },
      joinEyebrow: "Join Nexa",
      joinTitle: "Build a professional presence clients can trust",
      joinBody:
        "Nexa is designed for women professionals who want visibility without the noise of a social platform or the pressure of a transactional marketplace.",
      joinPoints: [
        "Curated directory placement for stronger credibility and fit.",
        "Structured profile layouts that highlight expertise and services clearly.",
        "Safer contact pathways without open direct messaging.",
      ],
      joinCta: "",
      inlineFormTitle: "Professional application",
      inlineFormBody:
        "Fill in your information so the Nexa team can better understand your professional work and evaluate your profile to join the platform.",
      inlineFormName: "Name",
      inlineFormNamePlaceholder: "Your full name",
      inlineFormEmail: "Email",
      inlineFormEmailPlaceholder: "name@example.com",
      inlineFormCategory: "Category",
      inlineFormCategoryPlaceholder: "Select a category",
      inlineFormDescription: "Description",
      inlineFormDescriptionPlaceholder: "Tell us about your work, services, and ideal clients.",
      inlineFormSubmit: "Submit application",
    },
    browseCategories: {
      title: "Browse Categories | Nexa",
      description: "Explore service categories across the multilingual Nexa directory.",
      eyebrow: "Browse categories",
      heading: "Explore the women-led services available on Nexa",
      intro:
        "Browse curated service categories built for easier discovery, cleaner comparison, and more professional client inquiries.",
    },
    professionals: {
      title: "Professionals | Nexa",
      description: "Browse all listed professionals across Nexa categories in English.",
      eyebrow: "Professionals",
      heading: "Browse the full Nexa directory",
      intro:
        "Explore women professionals across every active Nexa category. The directory is driven by shared profile data so listings stay consistent as the catalog grows.",
      availability: "Availability",
      directoryFilterAria: "Filter professionals by availability",
      filters: { all: "All", remote: "Remote", local: "Local" },
      searchPlaceholder: "Search for a professional",
      searchAria: "Search professionals",
    },
    apply: {
      title: "Apply | Nexa",
      description: "Apply to join Nexa as a listed professional.",
      eyebrow: "Professional application",
      heading: "Apply to join Nexa",
      intro:
        "Nexa welcomes women professionals who want a polished, trusted place to present their services. Apply to be considered for directory placement and a structured profile page.",
      points: [
        "Thoughtful review to keep the directory credible and aligned.",
        "Profile layouts designed for clarity, trust, and discovery.",
        "Structured inquiry pathways that reduce noise and improve fit.",
      ],
      formTitle: "Professional application form",
      name: "Name",
      namePlaceholder: "Your full name",
      email: "Email",
      emailPlaceholder: "name@example.com",
      category: "Category",
      categoryPlaceholder: "Select a category",
      location: "Location",
      locationPlaceholder: "City, State or Remote",
      website: "Website or portfolio",
      websitePlaceholder: "https://yourwebsite.com",
      descriptionLabel: "Description",
      descriptionPlaceholder: "Tell us about your work, services, experience, and ideal clients.",
      submit: "Submit application",
    },
    profileTemplate: {
      title: "Profile | Nexa",
      description: "Reusable professional profile template for Nexa in English.",
    },
    category: {
      eyebrow: "Category",
      noteEyebrow: "Nexa note",
      browseAll: "Browse all professionals",
      metaTitle: (title) => `${title} | Nexa`,
      metaDescription: (title) => `Browse ${title} professionals on Nexa.`,
    },
    legal: {
      backHome: "Back to home",
    },
  },
};

const LEGAL_PAGES = {
  guidelines: {
    pt: {
      slug: "diretrizes",
      title: "Diretrizes da Nexa",
      description: "Diretrizes da plataforma Nexa para profissionais participantes.",
      sections: [
        {
          heading: "Diretrizes da Plataforma Nexa",
          paragraphs: [
            "A Nexa foi criada para ser um ambiente profissional estruturado, seguro e confiável, com o objetivo de aumentar a visibilidade de mulheres que oferecem serviços.",
            "Para manter a qualidade e a proposta da plataforma, todas as profissionais devem seguir as diretrizes abaixo:",
          ],
        },
        {
          heading: "1. Profissionalismo",
          paragraphs: ["Os perfis devem refletir uma atuação profissional clara, com descrição objetiva dos serviços oferecidos."],
          bullets: [
            "Conteúdo ofensivo, discriminatório ou inadequado",
            "Informações falsas ou enganosas",
            "Linguagem excessivamente informal ou incompatível com ambiente profissional",
          ],
          bulletsIntro: "Não é permitido:",
        },
        {
          heading: "2. Clareza de serviços",
          bullets: [
            "Descrever claramente seus serviços",
            "Indicar forma de atuação (remoto/local)",
            "Informar, sempre que possível, escopo e tipo de contratação",
          ],
          bulletsIntro: "Cada profissional deve:",
        },
        {
          heading: "3. Uso adequado da plataforma",
          paragraphs: ["A Nexa é um diretório profissional, não uma rede social."],
          bullets: [
            "Uso da plataforma para fins não relacionados à prestação de serviços",
            "Divulgação de conteúdo pessoal sem relação profissional",
            "Uso da plataforma para spam ou autopromoção fora do escopo do perfil",
          ],
          bulletsIntro: "Não é permitido:",
        },
        {
          heading: "4. Atualização de informações",
          bullets: [
            "Manter suas informações atualizadas",
            "Garantir que os dados apresentados sejam verdadeiros",
          ],
          bulletsIntro: "A profissional é responsável por:",
        },
        {
          heading: "5. Conduta",
          bullets: [
            "Manter postura ética",
            "Respeitar clientes e outras profissionais",
            "Utilizar a plataforma de forma responsável",
          ],
          bulletsIntro: "Esperamos que todas as profissionais:",
        },
      ],
    },
    en: {
      slug: "guidelines",
      title: "Nexa Guidelines",
      description: "Platform guidelines for professionals participating in Nexa.",
      sections: [
        {
          heading: "Nexa Platform Guidelines",
          paragraphs: [
            "Nexa was created to be a structured, safe, and trustworthy professional environment focused on increasing the visibility of women offering services.",
            "To preserve the quality and purpose of the platform, all professionals are expected to follow the guidelines below:",
          ],
        },
        {
          heading: "1. Professionalism",
          paragraphs: ["Profiles should reflect clear professional practice, with objective descriptions of the services offered."],
          bullets: [
            "Offensive, discriminatory, or inappropriate content",
            "False or misleading information",
            "Excessively informal language or language incompatible with a professional environment",
          ],
          bulletsIntro: "The following is not allowed:",
        },
        {
          heading: "2. Service clarity",
          bullets: [
            "Clearly describe services",
            "Indicate delivery mode (remote/local)",
            "Whenever possible, explain scope and engagement type",
          ],
          bulletsIntro: "Each professional should:",
        },
        {
          heading: "3. Appropriate platform use",
          paragraphs: ["Nexa is a professional directory, not a social network."],
          bullets: [
            "Using the platform for purposes unrelated to service delivery",
            "Publishing personal content unrelated to professional work",
            "Using the platform for spam or self-promotion outside the scope of the profile",
          ],
          bulletsIntro: "The following is not allowed:",
        },
        {
          heading: "4. Keeping information current",
          bullets: [
            "Keep information up to date",
            "Ensure presented data is accurate",
          ],
          bulletsIntro: "Each professional is responsible for:",
        },
        {
          heading: "5. Conduct",
          bullets: [
            "Maintaining an ethical posture",
            "Respecting clients and other professionals",
            "Using the platform responsibly",
          ],
          bulletsIntro: "We expect all professionals to:",
        },
      ],
    },
  },
  privacy: {
    pt: {
      slug: "politica-de-privacidade",
      title: "Política de Privacidade",
      description: "Política de Privacidade da Nexa.",
      sections: [
        {
          heading: "Política de Privacidade da Nexa",
          paragraphs: ["A Nexa valoriza a privacidade e a segurança das informações de suas usuárias."],
        },
        {
          heading: "1. Coleta de dados",
          bullets: [
            "Criação e exibição do perfil profissional",
            "Funcionamento da plataforma",
            "Comunicação com a usuária",
          ],
          bulletsIntro: "A Nexa coleta apenas as informações necessárias para:",
        },
        {
          heading: "2. Uso das informações",
          bullets: [
            "Exibir o perfil profissional na plataforma",
            "Permitir que clientes entrem em contato",
            "Melhorar a experiência da plataforma",
          ],
          bulletsIntro: "Os dados fornecidos serão utilizados para:",
        },
        {
          heading: "3. Compartilhamento de dados",
          paragraphs: [
            "A Nexa não vende, não aluga e não compartilha dados pessoais com terceiros para fins comerciais.",
          ],
          bullets: [
            "Para funcionamento interno da plataforma",
            "Quando exigido por obrigação legal",
          ],
          bulletsIntro: "Os dados poderão ser utilizados apenas:",
        },
        {
          heading: "4. Dados públicos vs privados",
          bullets: [
            "Informações inseridas no perfil profissional são públicas",
            "Informações pessoais sensíveis não são solicitadas nem exibidas",
          ],
        },
        {
          heading: "5. Segurança",
          paragraphs: [
            "A Nexa adota medidas razoáveis para proteger os dados das usuárias, mas não pode garantir segurança absoluta contra acessos indevidos.",
          ],
        },
        {
          heading: "6. Controle dos dados",
          bullets: [
            "Solicitar atualização ou remoção de seus dados",
            "Encerrar sua participação na plataforma a qualquer momento",
          ],
          bulletsIntro: "A usuária pode:",
        },
      ],
    },
    en: {
      slug: "privacy-policy",
      title: "Privacy Policy",
      description: "Nexa privacy policy.",
      sections: [
        {
          heading: "Nexa Privacy Policy",
          paragraphs: ["Nexa values the privacy and security of its users’ information."],
        },
        {
          heading: "1. Data collection",
          bullets: [
            "Creating and displaying the professional profile",
            "Platform operation",
            "Communication with the user",
          ],
          bulletsIntro: "Nexa only collects the information necessary for:",
        },
        {
          heading: "2. Use of information",
          bullets: [
            "Displaying the professional profile on the platform",
            "Allowing clients to get in touch",
            "Improving the platform experience",
          ],
          bulletsIntro: "The information provided may be used to:",
        },
        {
          heading: "3. Data sharing",
          paragraphs: [
            "Nexa does not sell, rent, or share personal data with third parties for commercial purposes.",
          ],
          bullets: [
            "For the platform’s internal operation",
            "When required by law",
          ],
          bulletsIntro: "Data may only be used:",
        },
        {
          heading: "4. Public vs private data",
          bullets: [
            "Information included in the professional profile is public",
            "Sensitive personal information is neither requested nor displayed",
          ],
        },
        {
          heading: "5. Security",
          paragraphs: [
            "Nexa adopts reasonable measures to protect user data, but cannot guarantee absolute security against unauthorized access.",
          ],
        },
        {
          heading: "6. Data control",
          bullets: [
            "Request updates or removal of personal data",
            "End participation on the platform at any time",
          ],
          bulletsIntro: "The user may:",
        },
      ],
    },
  },
  usage: {
    pt: {
      slug: "politica-de-uso",
      title: "Política de Uso",
      description: "Política de uso da plataforma Nexa.",
      sections: [
        {
          heading: "Política de Uso da Nexa",
          paragraphs: [
            "A Nexa se reserva o direito de revisar, aprovar, editar ou remover perfis a qualquer momento, com o objetivo de manter a qualidade e a segurança da plataforma.",
          ],
        },
        {
          heading: "1. Aprovação de perfis",
          bullets: [
            "Todos os perfis passam por análise antes de serem publicados",
            "A Nexa pode recusar perfis que não estejam alinhados com suas diretrizes",
          ],
        },
        {
          heading: "2. Remoção ou suspensão",
          bullets: [
            "Descumprimento das diretrizes",
            "Informações falsas ou inconsistentes",
            "Uso indevido da plataforma",
            "Conduta inadequada",
          ],
          bulletsIntro: "A Nexa poderá remover ou suspender perfis em casos como:",
        },
        {
          heading: "3. Limitação de responsabilidade",
          paragraphs: ["A Nexa atua como intermediadora de visibilidade e conexão."],
          bullets: [
            "Não participa das negociações entre profissionais e clientes",
            "Não garante resultados, contratações ou pagamentos",
            "Não se responsabiliza por acordos realizados fora da plataforma",
          ],
        },
        {
          heading: "4. Contato entre usuários",
          bullets: [
            "O contato entre clientes e profissionais é de responsabilidade das partes",
            "A Nexa não realiza mediação de conflitos",
          ],
        },
      ],
    },
    en: {
      slug: "terms-of-use",
      title: "Terms of Use",
      description: "Nexa platform terms of use.",
      sections: [
        {
          heading: "Nexa Terms of Use",
          paragraphs: [
            "Nexa reserves the right to review, approve, edit, or remove profiles at any time in order to preserve the quality and safety of the platform.",
          ],
        },
        {
          heading: "1. Profile approval",
          bullets: [
            "All profiles are reviewed before publication",
            "Nexa may reject profiles that are not aligned with its guidelines",
          ],
        },
        {
          heading: "2. Removal or suspension",
          bullets: [
            "Violation of the guidelines",
            "False or inconsistent information",
            "Improper use of the platform",
            "Inappropriate conduct",
          ],
          bulletsIntro: "Nexa may remove or suspend profiles in cases such as:",
        },
        {
          heading: "3. Limitation of liability",
          paragraphs: ["Nexa acts as an intermediary for visibility and connection."],
          bullets: [
            "It does not participate in negotiations between professionals and clients",
            "It does not guarantee results, hires, or payments",
            "It is not responsible for agreements made outside the platform",
          ],
        },
        {
          heading: "4. Contact between users",
          bullets: [
            "Contact between clients and professionals is the responsibility of the parties involved",
            "Nexa does not mediate conflicts",
          ],
        },
      ],
    },
  },
};

function loadSourceProfiles() {
  const currentProfiles = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  const firstProfile = currentProfiles[0] || {};
  const hasUsableRoleSource =
    (typeof firstProfile.role_title === "string" && firstProfile.role_title.trim()) ||
    (typeof firstProfile.role_title_en === "string" && firstProfile.role_title_en.trim());

  if (hasUsableRoleSource) {
    return currentProfiles;
  }

  try {
    const gitProfiles = JSON.parse(
      execSync("git show HEAD:data/professionals.json", { cwd: projectRoot, encoding: "utf8" })
    );
    return gitProfiles;
  } catch (error) {
    return currentProfiles;
  }
}

const rawProfiles = loadSourceProfiles();

function sourceValue(profile, key) {
  if (profile[key] !== undefined) return profile[key];
  if (profile[`${key}_en`] !== undefined) return profile[`${key}_en`];
  return "";
}

function translatePhraseToPt(value) {
  let output = String(value || "");
  const entries = Object.entries(PHRASE_PT_REPLACEMENTS).sort((a, b) => b[0].length - a[0].length);
  for (const [search, replacement] of entries) {
    output = output.replaceAll(search, replacement);
  }
  return output;
}

function normalizeYears(value) {
  const match = String(value || "").match(/\d+/);
  return match ? `${match[0]}+` : String(value || "");
}

function getCity(location) {
  return String(location || "").split(",")[0].trim();
}

function buildShortBioPt(profile) {
  const roleEn = sourceValue(profile, "role_title");
  const role = ROLE_PT[roleEn] || translatePhraseToPt(roleEn);
  if (sourceValue(profile, "remote_or_local") === "Remote") {
    return `${role} com atendimento remoto, oferecendo um serviço claro, confiável e bem estruturado para clientes em busca de qualidade.`;
  }
  const city = getCity(sourceValue(profile, "location"));
  return `${role} com atuação em ${city}, oferecendo um serviço profissional, claro e confiável para clientes que valorizam boa execução.`;
}

function buildAboutPt(profile) {
  const roleEn = sourceValue(profile, "role_title");
  const role = ROLE_PT[roleEn] || translatePhraseToPt(roleEn);
  const category = CATEGORY_META[profile.category_slug].pt.title;
  return `${profile.name} atua como ${role.toLowerCase()} na categoria ${category}, com uma abordagem orientada por clareza, organização e confiança. Seu trabalho combina entrega prática com comunicação cuidadosa, para que cada cliente compreenda escopo, próximos passos e resultados desde o início.`;
}

function buildExperienceSummaryPt(profile) {
  const roleEn = sourceValue(profile, "role_title");
  const role = ROLE_PT[roleEn] || translatePhraseToPt(roleEn);
  return `A experiência recente de ${profile.name} como ${role.toLowerCase()} reúne atendimento consistente, comunicação profissional e processos bem definidos para que cada entrega aconteça com organização do início ao fim.`;
}

function buildClientFocusPt(profile) {
  const roleEn = sourceValue(profile, "role_title");
  const role = ROLE_PT[roleEn] || translatePhraseToPt(roleEn);
  return `Clientes em busca de ${role.toLowerCase()}`;
}

function buildServiceDescriptionPt(profile, serviceTitlePt) {
  const roleEn = sourceValue(profile, "role_title");
  const role = ROLE_PT[roleEn] || translatePhraseToPt(roleEn);
  return `Atendimento estruturado em ${serviceTitlePt.toLowerCase()}, com escopo claro, cronograma alinhado e apoio profissional para clientes que procuram ${role.toLowerCase()}.`;
}

function buildServiceTitlePt(profile, index) {
  const roleEn = sourceValue(profile, "role_title");
  const role = ROLE_PT[roleEn] || translatePhraseToPt(roleEn);
  const original = String(sourceValue(profile, `service_${index}_title`) || "");
  if (index === 1) return role;
  if (/advisory|strategy|consult/i.test(original)) return "Consultoria estratégica";
  if (/support/i.test(original)) return "Suporte especializado";
  return index === 2 ? "Consultoria estratégica" : "Suporte especializado";
}

function buildPortfolioTitlePt(index) {
  return `Projeto em destaque ${String(index).padStart(2, "0")}`;
}

function buildPortfolioDescriptionPt(profile, index) {
  const roleEn = sourceValue(profile, "role_title");
  const role = ROLE_PT[roleEn] || translatePhraseToPt(roleEn);
  return `Projeto recente de ${profile.name} com foco em ${role.toLowerCase()}, combinando execução cuidadosa, boa comunicação e resultados claros para o cliente.`;
}

function buildSafetyNotePt() {
  return "A Nexa não oferece mensagens diretas abertas. O contato com clientes acontece por caminhos estruturados para apoiar mais clareza, profissionalismo e segurança nas interações.";
}

function buildProfile(profile) {
  const roleTitleEn = sourceValue(profile, "role_title");
  const roleTitlePt = ROLE_PT[roleTitleEn] || translatePhraseToPt(roleTitleEn);
  const categoryMeta = CATEGORY_META[profile.category_slug];
  const serviceTitlesPt = [1, 2, 3].map((index) => buildServiceTitlePt(profile, index));

  return {
    name: profile.name,
    slug: profile.slug,
    category_slug: profile.category_slug,
    category_pt: categoryMeta.pt.title,
    category_en: categoryMeta.en.title,
    role_title_pt: roleTitlePt,
    role_title_en: roleTitleEn,
    short_bio_pt: buildShortBioPt(profile),
    short_bio_en: sourceValue(profile, "short_bio"),
    full_about_pt: buildAboutPt(profile),
    full_about_en: sourceValue(profile, "full_about"),
    location: sourceValue(profile, "location"),
    remote_or_local: sourceValue(profile, "remote_or_local"),
    languages: sourceValue(profile, "languages"),
    profile_type_pt: translatePhraseToPt(sourceValue(profile, "profile_type")),
    profile_type_en: sourceValue(profile, "profile_type"),
    verified: String(profile.verified),
    featured: String(profile.featured),
    service_1_title_pt: serviceTitlesPt[0],
    service_1_title_en: sourceValue(profile, "service_1_title"),
    service_1_description_pt: buildServiceDescriptionPt(profile, serviceTitlesPt[0]),
    service_1_description_en: sourceValue(profile, "service_1_description"),
    service_1_delivery: sourceValue(profile, "service_1_delivery"),
    service_1_engagement_pt: translatePhraseToPt(sourceValue(profile, "service_1_engagement")),
    service_1_engagement_en: sourceValue(profile, "service_1_engagement"),
    service_2_title_pt: serviceTitlesPt[1],
    service_2_title_en: sourceValue(profile, "service_2_title"),
    service_2_description_pt: buildServiceDescriptionPt(profile, serviceTitlesPt[1]),
    service_2_description_en: sourceValue(profile, "service_2_description"),
    service_2_delivery: sourceValue(profile, "service_2_delivery"),
    service_2_engagement_pt: translatePhraseToPt(sourceValue(profile, "service_2_engagement")),
    service_2_engagement_en: sourceValue(profile, "service_2_engagement"),
    service_3_title_pt: serviceTitlesPt[2],
    service_3_title_en: sourceValue(profile, "service_3_title"),
    service_3_description_pt: buildServiceDescriptionPt(profile, serviceTitlesPt[2]),
    service_3_description_en: sourceValue(profile, "service_3_description"),
    service_3_delivery: sourceValue(profile, "service_3_delivery"),
    service_3_engagement_pt: translatePhraseToPt(sourceValue(profile, "service_3_engagement")),
    service_3_engagement_en: sourceValue(profile, "service_3_engagement"),
    experience_years: normalizeYears(sourceValue(profile, "experience_years")),
    client_focus_pt: buildClientFocusPt(profile),
    client_focus_en: sourceValue(profile, "client_focus"),
    projects_delivered: sourceValue(profile, "projects_delivered"),
    experience_summary_pt: buildExperienceSummaryPt(profile),
    experience_summary_en: sourceValue(profile, "experience_summary"),
    portfolio_1_title_pt: buildPortfolioTitlePt(1),
    portfolio_1_title_en: sourceValue(profile, "portfolio_1_title"),
    portfolio_1_description_pt: buildPortfolioDescriptionPt(profile, 1),
    portfolio_1_description_en: sourceValue(profile, "portfolio_1_description"),
    portfolio_2_title_pt: buildPortfolioTitlePt(2),
    portfolio_2_title_en: sourceValue(profile, "portfolio_2_title"),
    portfolio_2_description_pt: buildPortfolioDescriptionPt(profile, 2),
    portfolio_2_description_en: sourceValue(profile, "portfolio_2_description"),
    portfolio_3_title_pt: buildPortfolioTitlePt(3),
    portfolio_3_title_en: sourceValue(profile, "portfolio_3_title"),
    portfolio_3_description_pt: buildPortfolioDescriptionPt(profile, 3),
    portfolio_3_description_en: sourceValue(profile, "portfolio_3_description"),
    email: sourceValue(profile, "email"),
    website: sourceValue(profile, "website"),
    website_label: profile.website_label || "",
    social_link: sourceValue(profile, "social_link"),
    social_label: profile.social_label || "",
    safety_note_pt: buildSafetyNotePt(),
    safety_note_en: sourceValue(profile, "safety_note"),
    profile_image: profile.profile_image || "",
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function toCsv(rows) {
  const headers = Object.keys(rows[0]);
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function buildHreflang(ptPath, enPath) {
  if (!ENGLISH_PUBLICLY_VISIBLE) {
    return `
    <link rel="alternate" hreflang="pt-BR" href="${ptPath}" />
    <link rel="alternate" hreflang="x-default" href="${ptPath}" />`;
  }

  return `
    <link rel="alternate" hreflang="pt-BR" href="${ptPath}" />
    <link rel="alternate" hreflang="en" href="${enPath}" />
    <link rel="alternate" hreflang="x-default" href="${ptPath}" />`;
}

function renderHeader(lang, currentKey, switchHref) {
  const copy = SITE_COPY[lang];
  const isActive = (key) => (key === currentKey ? "text-teal" : "");
  const desktopLanguageSwitcher = ENGLISH_PUBLICLY_VISIBLE
    ? `
          <div class="flex items-center rounded-full border border-charcoal/15 bg-white p-1 shadow-soft">
            <a href="${lang === "pt" ? "#" : switchHref}" class="rounded-full px-3 py-2 text-xs font-semibold ${lang === "pt" ? "bg-mist text-teal" : "text-charcoal/70"}" ${currentKey === "profile-template" ? 'data-profile-lang-switch="pt"' : ""}>PT</a>
            <a href="${lang === "en" ? "#" : switchHref}" class="rounded-full px-3 py-2 text-xs font-semibold ${lang === "en" ? "bg-mist text-teal" : "text-charcoal/70"}" ${currentKey === "profile-template" ? 'data-profile-lang-switch="en"' : ""}>EN</a>
          </div>`
    : "";
  const mobileLanguageSwitcher = ENGLISH_PUBLICLY_VISIBLE
    ? `
          <div class="mb-2 flex items-center rounded-full border border-charcoal/15 bg-ivory p-1">
            <a href="${lang === "pt" ? "#" : switchHref}" class="rounded-full px-3 py-2 text-xs font-semibold ${lang === "pt" ? "bg-mist text-teal" : "text-charcoal/70"}" ${currentKey === "profile-template" ? 'data-profile-lang-switch="pt"' : ""}>PT</a>
            <a href="${lang === "en" ? "#" : switchHref}" class="rounded-full px-3 py-2 text-xs font-semibold ${lang === "en" ? "bg-mist text-teal" : "text-charcoal/70"}" ${currentKey === "profile-template" ? 'data-profile-lang-switch="en"' : ""}>EN</a>
          </div>`
    : "";

  return `
    <header class="sticky top-0 z-50 border-b border-charcoal/10 bg-ivory/95 backdrop-blur">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <a href="/${lang}/index.html" class="inline-flex items-center" aria-label="Nexa home">
          <img src="/Nexa2.png" alt="Nexa" class="h-10 w-auto" />
        </a>
        <nav aria-label="Primary" class="hidden items-center gap-8 text-sm font-medium md:flex">
          <a href="/${lang}/browse-categories.html" class="relative pb-1 transition-colors hover:text-teal ${isActive("categories")}">${copy.nav.categories}</a>
          <a href="/${lang}/professionals.html" class="relative pb-1 transition-colors hover:text-teal ${isActive("professionals")}">${copy.nav.professionals}</a>
          <a href="/${lang}/index.html#how-it-works" class="relative pb-1 transition-colors hover:text-teal ${isActive("how")}">${copy.nav.howItWorks}</a>
        </nav>
        <div class="hidden items-center gap-3 md:flex">
          ${desktopLanguageSwitcher}
          <a href="/${lang}/apply.html" class="rounded-2xl bg-clay px-5 py-3 text-sm font-semibold text-white shadow-soft transition-colors hover:bg-clay/90">${copy.nav.applyNow}</a>
        </div>
        <div class="flex items-center gap-3 md:hidden">
          <button id="mobile-menu-button" type="button" aria-expanded="false" aria-controls="mobile-menu" class="inline-flex items-center rounded-2xl border border-charcoal/15 bg-white px-4 py-2 text-sm font-semibold text-charcoal shadow-soft">${copy.nav.menu}</button>
        </div>
      </div>
      <div id="mobile-menu" class="hidden border-t border-charcoal/10 bg-white md:hidden">
        <nav aria-label="Mobile primary" class="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-4 text-sm font-medium lg:px-8">
          ${mobileLanguageSwitcher}
          <a href="/${lang}/browse-categories.html" class="rounded-2xl px-4 py-3 transition-colors hover:bg-mist hover:text-teal">${copy.nav.categories}</a>
          <a href="/${lang}/professionals.html" class="rounded-2xl px-4 py-3 transition-colors hover:bg-mist hover:text-teal">${copy.nav.professionals}</a>
          <a href="/${lang}/index.html#how-it-works" class="rounded-2xl px-4 py-3 transition-colors hover:bg-mist hover:text-teal">${copy.nav.howItWorks}</a>
          <a href="/${lang}/apply.html" class="mt-2 rounded-2xl bg-clay px-4 py-3 text-center font-semibold text-white shadow-soft">${copy.nav.applyNow}</a>
        </nav>
      </div>
    </header>`;
}

function renderFooter(lang) {
  const copy = SITE_COPY[lang];
  return `
    <footer class="border-t border-charcoal/10">
      <div class="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <a href="/${lang}/index.html" class="inline-flex items-center" aria-label="Nexa home">
          <img src="/Nexa2.png" alt="Nexa" class="h-10 w-auto" />
        </a>
        <nav aria-label="Footer" class="flex flex-wrap gap-5 text-sm text-charcoal/75">
          <a href="/${lang}/index.html#how-it-works" class="hover:text-teal">${copy.footer.howItWorks}</a>
          <a href="/${lang}/browse-categories.html" class="hover:text-teal">${copy.footer.categories}</a>
          <a href="/${lang}/professionals.html" class="hover:text-teal">${copy.footer.professionals}</a>
          <a href="/${lang}/apply.html" class="hover:text-teal">${copy.footer.applyNow}</a>
          <a href="/${lang}/${LEGAL_PAGES.guidelines[lang].slug}.html" class="hover:text-teal">${copy.footer.guidelines}</a>
          <a href="/${lang}/${LEGAL_PAGES.privacy[lang].slug}.html" class="hover:text-teal">${copy.footer.privacy}</a>
          <a href="/${lang}/${LEGAL_PAGES.usage[lang].slug}.html" class="hover:text-teal">${copy.footer.usage}</a>
        </nav>
      </div>
    </footer>`;
}

function renderLegalPage(lang, key) {
  const page = LEGAL_PAGES[key][lang];
  const otherLang = lang === "pt" ? "en" : "pt";
  const otherPage = LEGAL_PAGES[key][otherLang];
  const copy = SITE_COPY[lang].legal;

  const sections = page.sections
    .map((section) => {
      const paragraphs = (section.paragraphs || [])
        .map((paragraph) => `<p class="leading-8 text-charcoal/75">${escapeHtml(paragraph)}</p>`)
        .join("");
      const bulletsIntro = section.bulletsIntro
        ? `<p class="leading-8 text-charcoal/75">${escapeHtml(section.bulletsIntro)}</p>`
        : "";
      const bullets = section.bullets?.length
        ? `<ul class="space-y-3 text-sm leading-7 text-charcoal/75">${section.bullets
            .map((bullet) => `<li>${escapeHtml(bullet)}</li>`)
            .join("")}</ul>`
        : "";

      return `
        <section class="rounded-3xl bg-white p-8 shadow-soft">
          <h2 class="font-display text-2xl font-bold">${escapeHtml(section.heading)}</h2>
          <div class="mt-5 space-y-4">
            ${paragraphs}
            ${bulletsIntro}
            ${bullets}
          </div>
        </section>`;
    })
    .join("");

  const body = `
    <main>
      <section class="mx-auto max-w-5xl px-6 py-16 lg:px-8 lg:py-20">
        <div class="max-w-3xl">
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-teal">Nexa</p>
          <h1 class="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">${escapeHtml(page.title)}</h1>
          <p class="mt-6 text-lg leading-8 text-charcoal/75">${escapeHtml(page.description)}</p>
        </div>
        <div class="mt-12 space-y-6">
          ${sections}
        </div>
        <a href="/${lang}/index.html" class="mt-10 inline-flex rounded-2xl border border-charcoal/15 bg-white px-5 py-3 text-sm font-semibold text-charcoal shadow-soft transition-colors hover:border-teal hover:text-teal">${escapeHtml(copy.backHome)}</a>
      </section>
    </main>`;

  return renderLayout({
    lang,
    currentKey: "",
    title: `${page.title} | Nexa`,
    description: page.description,
    ptPath: `/pt/${LEGAL_PAGES[key].pt.slug}.html`,
    enPath: `/en/${LEGAL_PAGES[key].en.slug}.html`,
    switchHref: `/${otherLang}/${otherPage.slug}.html`,
    body,
  });
}

function renderLayout({ lang, currentKey, title, description, ptPath, enPath, switchHref, body, scripts = "" }) {
  const robotsMeta =
    !ENGLISH_PUBLICLY_VISIBLE && lang === "en"
      ? '\n    <meta name="robots" content="noindex, nofollow" />'
      : "";
  return `<!DOCTYPE html>
<html lang="${SITE_COPY[lang].htmlLang}">
  <head>
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    ${buildHreflang(ptPath, enPath)}
    ${robotsMeta}
    <link rel="apple-touch-icon" sizes="180x180" href="/Favicon/apple-touch-icon.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/Favicon/favicon-32x32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/Favicon/favicon-16x16.png" />
    <link rel="shortcut icon" href="/Favicon/favicon.ico" />
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              ivory: "#F7F6F4",
              charcoal: "#2B2B2B",
              clay: "#843088",
              teal: "#E47E4A",
              mist: "#F9E1CF",
            },
            fontFamily: {
              sans: ["Inter", "sans-serif"],
              display: ["DM Sans", "sans-serif"],
            },
            boxShadow: {
              soft: "0 16px 40px rgba(43, 43, 43, 0.08)",
            },
          },
        },
      };
    </script>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
    <style>
      html {
        scroll-behavior: smooth;
      }
    </style>
  </head>
  <body class="bg-ivory font-sans text-charcoal antialiased">
    ${renderHeader(lang, currentKey, switchHref)}
    ${body}
    ${renderFooter(lang)}
    <script src="/assets/js/nexa-directory.js"></script>
    <script>
      NexaDirectory.setupMobileMenu();
      NexaDirectory.setupApplicationForms();
      ${scripts}
    </script>
  </body>
</html>`;
}

function renderCategoryCards(lang) {
  const cardLabel = lang === "pt" ? "Ver profissionais" : "Browse category";
  return CATEGORY_ORDER.map((slug) => {
    const meta = CATEGORY_META[slug][lang];
    return `
      <article class="flex h-full flex-col justify-between rounded-3xl bg-white p-7 shadow-soft">
        <div>
          <h3 class="font-display text-2xl font-bold">${escapeHtml(meta.title)}</h3>
          <p class="mt-3 leading-7 text-charcoal/75">${escapeHtml(meta.description)}</p>
        </div>
        <a href="/${lang}/category-${slug}.html" class="mt-6 inline-flex items-center text-sm font-semibold text-teal">${escapeHtml(cardLabel)}</a>
      </article>`;
  }).join("");
}

function renderCategoryOptions(lang) {
  const placeholder = SITE_COPY[lang].apply.categoryPlaceholder;
  return [
    `<option>${escapeHtml(placeholder)}</option>`,
    ...CATEGORY_ORDER.map((slug) => `<option>${escapeHtml(CATEGORY_META[slug][lang].title)}</option>`),
  ].join("");
}

function renderHomePage(lang) {
  const copy = SITE_COPY[lang].home;
  const otherLang = lang === "pt" ? "en" : "pt";
  const ptPath = "/pt/index.html";
  const enPath = "/en/index.html";

  const body = `
    <main id="top">
      <section class="mx-auto flex min-h-[85vh] max-w-7xl items-center px-6 py-16 lg:px-8 lg:py-24">
        <div class="grid w-full items-end gap-12 lg:grid-cols-[1fr_minmax(0,45vw)] lg:gap-16">
          <div class="max-w-2xl">
            <p class="mb-4 text-sm font-semibold uppercase tracking-[0.24em] text-teal">${escapeHtml(copy.heroEyebrow)}</p>
            <h1 class="font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">${escapeHtml(copy.heroTitle)}</h1>
            <p class="mt-6 max-w-xl text-lg leading-8 text-charcoal/75">${escapeHtml(copy.heroBody)}</p>
            <div class="mt-8 flex flex-col gap-4 sm:flex-row">
              <a href="/${lang}/professionals.html" class="rounded-2xl bg-clay px-6 py-4 text-center text-sm font-semibold text-white shadow-soft hover:bg-clay/90">${escapeHtml(copy.heroPrimary)}</a>
              <a href="/${lang}/apply.html" class="rounded-2xl border border-charcoal/15 bg-white px-6 py-4 text-center text-sm font-semibold text-charcoal shadow-soft hover:border-teal hover:text-teal">${escapeHtml(copy.heroSecondary)}</a>
            </div>
          </div>
          <div class="flex items-end justify-center lg:justify-end">
            <img src="/Women.png" alt="${escapeHtml(copy.heroImageAlt)}" class="w-full max-w-md self-end object-contain lg:max-w-none" />
          </div>
        </div>
      </section>

      <section id="how-it-works" class="mx-auto max-w-7xl px-6 py-8 lg:px-8 lg:py-12">
        <div class="max-w-2xl">
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-teal">${escapeHtml(copy.howEyebrow)}</p>
          <h2 class="mt-3 font-display text-3xl font-bold sm:text-4xl">${escapeHtml(copy.howTitle)}</h2>
        </div>
        <div class="mt-10 grid gap-6 md:grid-cols-3">
          ${copy.steps
            .map(
              (step) => `
            <article class="rounded-3xl bg-white p-8 shadow-soft">
              <p class="text-sm font-semibold text-clay">${escapeHtml(step.step)}</p>
              <h3 class="mt-4 font-display text-2xl font-bold">${escapeHtml(step.title)}</h3>
              <p class="mt-4 leading-7 text-charcoal/75">${escapeHtml(step.body)}</p>
            </article>`
            )
            .join("")}
        </div>
      </section>

      <section id="categories" class="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div class="max-w-2xl">
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-teal">${escapeHtml(copy.categoriesEyebrow)}</p>
          <h2 class="mt-3 font-display text-3xl font-bold sm:text-4xl">${escapeHtml(copy.categoriesTitle)}</h2>
        </div>
        <div class="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          ${renderCategoryCards(lang)}
        </div>
      </section>

      <section id="professionals" class="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div class="max-w-2xl">
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-teal">${escapeHtml(copy.featuredEyebrow)}</p>
          <h2 class="mt-3 font-display text-3xl font-bold sm:text-4xl">${escapeHtml(copy.featuredTitle)}</h2>
        </div>
        <div class="mt-8 flex flex-wrap items-center gap-3">
          <p class="text-sm font-semibold uppercase tracking-[0.18em] text-charcoal/55">${escapeHtml(copy.availability)}</p>
          <div id="featured-location-filter" class="flex flex-wrap gap-3 text-sm font-semibold" aria-label="${escapeHtml(copy.featuredFilterAria)}">
            <button type="button" data-directory-filter="all" class="rounded-full border border-charcoal/15 bg-white px-4 py-2 shadow-soft transition-colors hover:border-teal hover:text-teal">${escapeHtml(copy.filters.all)}</button>
            <button type="button" data-directory-filter="remote" class="rounded-full border border-charcoal/15 bg-white px-4 py-2 shadow-soft transition-colors hover:border-teal hover:text-teal">${escapeHtml(copy.filters.remote)}</button>
            <button type="button" data-directory-filter="local" class="rounded-full border border-charcoal/15 bg-white px-4 py-2 shadow-soft transition-colors hover:border-teal hover:text-teal">${escapeHtml(copy.filters.local)}</button>
          </div>
        </div>
        <div id="featured-profiles" class="mt-10 grid gap-6 lg:grid-cols-3"></div>
      </section>

      <section id="join" class="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div class="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div class="rounded-3xl bg-white p-8 shadow-soft">
            <p class="text-sm font-semibold uppercase tracking-[0.24em] text-teal">${escapeHtml(copy.joinEyebrow)}</p>
            <h2 class="mt-3 font-display text-3xl font-bold sm:text-4xl">${escapeHtml(copy.joinTitle)}</h2>
            <p class="mt-5 leading-8 text-charcoal/75">${escapeHtml(copy.joinBody)}</p>
            <ul class="mt-6 space-y-4 text-sm leading-7 text-charcoal/75">
              ${copy.joinPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
            </ul>
            ${copy.joinCta ? `<a href="/${lang}/apply.html" class="mt-8 inline-flex rounded-2xl bg-clay px-5 py-4 text-sm font-semibold text-white shadow-soft hover:bg-clay/90">${escapeHtml(copy.joinCta)}</a>` : ""}
          </div>
          <section class="rounded-3xl bg-white p-8 shadow-soft" aria-labelledby="application-form-title">
            <h3 id="application-form-title" class="font-display text-2xl font-bold">${escapeHtml(copy.inlineFormTitle)}</h3>
            <p class="mt-3 leading-8 text-charcoal/75">${escapeHtml(copy.inlineFormBody)}</p>
            <form class="mt-6 grid gap-5" data-professional-application-form data-application-lang="${lang}" data-application-source="home" novalidate>
              <div>
                <label for="name" class="mb-2 block text-sm font-medium">${escapeHtml(copy.inlineFormName)}</label>
                <input id="name" name="name" type="text" required class="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none ring-0 placeholder:text-charcoal/35 focus:border-teal" placeholder="${escapeHtml(copy.inlineFormNamePlaceholder)}" />
              </div>
              <div>
                <label for="email" class="mb-2 block text-sm font-medium">${escapeHtml(copy.inlineFormEmail)}</label>
                <input id="email" name="email" type="email" required class="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none ring-0 placeholder:text-charcoal/35 focus:border-teal" placeholder="${escapeHtml(copy.inlineFormEmailPlaceholder)}" />
              </div>
              <div>
                <label for="category" class="mb-2 block text-sm font-medium">${escapeHtml(copy.inlineFormCategory)}</label>
                <select id="category" name="category" required class="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none focus:border-teal">
                  ${renderCategoryOptions(lang)}
                </select>
              </div>
              <div>
                <label for="description" class="mb-2 block text-sm font-medium">${escapeHtml(copy.inlineFormDescription)}</label>
                <textarea id="description" name="description" rows="5" required class="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal" placeholder="${escapeHtml(copy.inlineFormDescriptionPlaceholder)}"></textarea>
              </div>
              <p data-application-feedback class="hidden rounded-2xl border border-clay/15 bg-mist px-4 py-3 text-sm text-charcoal/75"></p>
              <button type="submit" class="rounded-2xl bg-clay px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-clay/90">${escapeHtml(copy.inlineFormSubmit)}</button>
            </form>
          </section>
        </div>
      </section>
    </main>`;

  return renderLayout({
    lang,
    currentKey: "home",
    title: copy.title,
    description: copy.description,
    ptPath,
    enPath,
    switchHref: `/${otherLang}/index.html`,
    body,
    scripts: `NexaDirectory.renderFeaturedProfessionals("featured-profiles", { lang: "${lang}", filterContainerId: "featured-location-filter" });`,
  });
}

function renderBrowseCategoriesPage(lang) {
  const copy = SITE_COPY[lang].browseCategories;
  const otherLang = lang === "pt" ? "en" : "pt";

  const body = `
    <main>
      <section class="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div class="max-w-3xl">
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-teal">${escapeHtml(copy.eyebrow)}</p>
          <h1 class="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">${escapeHtml(copy.heading)}</h1>
          <p class="mt-6 max-w-2xl text-lg leading-8 text-charcoal/75">${escapeHtml(copy.intro)}</p>
        </div>
        <div class="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          ${renderCategoryCards(lang)}
        </div>
      </section>
    </main>`;

  return renderLayout({
    lang,
    currentKey: "categories",
    title: copy.title,
    description: copy.description,
    ptPath: "/pt/browse-categories.html",
    enPath: "/en/browse-categories.html",
    switchHref: `/${otherLang}/browse-categories.html`,
    body,
  });
}

function renderProfessionalsPage(lang) {
  const copy = SITE_COPY[lang].professionals;
  const otherLang = lang === "pt" ? "en" : "pt";

  const body = `
    <main>
      <section class="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div class="max-w-3xl">
          <p class="text-sm font-semibold uppercase tracking-[0.24em] text-teal">${escapeHtml(copy.eyebrow)}</p>
          <h1 class="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">${escapeHtml(copy.heading)}</h1>
          <p class="mt-6 text-lg leading-8 text-charcoal/75">${escapeHtml(copy.intro)}</p>
        </div>
        <div class="mt-10 flex flex-wrap gap-3 text-sm font-semibold">
          ${CATEGORY_ORDER.map(
            (slug) =>
              `<a href="#${slug}" class="rounded-full border border-charcoal/15 bg-white px-4 py-2 shadow-soft transition-colors hover:border-teal hover:text-teal">${escapeHtml(CATEGORY_META[slug][lang].title)}</a>`
          ).join("")}
        </div>
        <div class="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex flex-wrap items-center gap-3">
            <p class="text-sm font-semibold uppercase tracking-[0.18em] text-charcoal/55">${escapeHtml(copy.availability)}</p>
            <div id="directory-location-filter" class="flex flex-wrap gap-3 text-sm font-semibold" aria-label="${escapeHtml(copy.directoryFilterAria)}">
              <button type="button" data-directory-filter="all" class="rounded-full border border-charcoal/15 bg-white px-4 py-2 shadow-soft transition-colors hover:border-teal hover:text-teal">${escapeHtml(copy.filters.all)}</button>
              <button type="button" data-directory-filter="remote" class="rounded-full border border-charcoal/15 bg-white px-4 py-2 shadow-soft transition-colors hover:border-teal hover:text-teal">${escapeHtml(copy.filters.remote)}</button>
              <button type="button" data-directory-filter="local" class="rounded-full border border-charcoal/15 bg-white px-4 py-2 shadow-soft transition-colors hover:border-teal hover:text-teal">${escapeHtml(copy.filters.local)}</button>
            </div>
          </div>
          <div class="w-full lg:max-w-md">
            <label for="directory-search" class="sr-only">${escapeHtml(copy.searchAria)}</label>
            <input id="directory-search" type="search" placeholder="${escapeHtml(copy.searchPlaceholder)}" class="w-full rounded-2xl border border-charcoal/15 bg-white px-4 py-3 text-sm shadow-soft outline-none placeholder:text-charcoal/40 focus:border-teal" />
          </div>
        </div>
        <div id="professionals-directory" class="mt-14 space-y-14"></div>
      </section>
    </main>`;

  return renderLayout({
    lang,
    currentKey: "professionals",
    title: copy.title,
    description: copy.description,
    ptPath: "/pt/professionals.html",
    enPath: "/en/professionals.html",
    switchHref: `/${otherLang}/professionals.html`,
    body,
    scripts: `NexaDirectory.renderProfessionalsDirectory("professionals-directory", { lang: "${lang}" });`,
  });
}

function renderApplyPage(lang) {
  const copy = SITE_COPY[lang].apply;
  const otherLang = lang === "pt" ? "en" : "pt";

  const body = `
    <main>
      <section class="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div class="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div class="rounded-3xl bg-white p-8 shadow-soft">
            <p class="text-sm font-semibold uppercase tracking-[0.24em] text-teal">${escapeHtml(copy.eyebrow)}</p>
            <h1 class="mt-3 font-display text-4xl font-bold sm:text-5xl">${escapeHtml(copy.heading)}</h1>
            <p class="mt-5 leading-8 text-charcoal/75">${escapeHtml(copy.intro)}</p>
            <ul class="mt-6 space-y-4 text-sm leading-7 text-charcoal/75">
              ${copy.points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
            </ul>
          </div>
          <section class="rounded-3xl bg-white p-8 shadow-soft" aria-labelledby="apply-form-title">
            <h2 id="apply-form-title" class="font-display text-2xl font-bold">${escapeHtml(copy.formTitle)}</h2>
            <form class="mt-6 grid gap-5" data-professional-application-form data-application-lang="${lang}" data-application-source="apply" novalidate>
              <div>
                <label for="name" class="mb-2 block text-sm font-medium">${escapeHtml(copy.name)}</label>
                <input id="name" name="name" type="text" required class="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal" placeholder="${escapeHtml(copy.namePlaceholder)}" />
              </div>
              <div>
                <label for="email" class="mb-2 block text-sm font-medium">${escapeHtml(copy.email)}</label>
                <input id="email" name="email" type="email" required class="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal" placeholder="${escapeHtml(copy.emailPlaceholder)}" />
              </div>
              <div class="grid gap-5 sm:grid-cols-2">
                <div>
                  <label for="category" class="mb-2 block text-sm font-medium">${escapeHtml(copy.category)}</label>
                  <select id="category" name="category" required class="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none focus:border-teal">
                    ${renderCategoryOptions(lang)}
                  </select>
                </div>
                <div>
                  <label for="location" class="mb-2 block text-sm font-medium">${escapeHtml(copy.location)}</label>
                  <input id="location" name="location" type="text" class="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal" placeholder="${escapeHtml(copy.locationPlaceholder)}" />
                </div>
              </div>
              <div>
                <label for="website" class="mb-2 block text-sm font-medium">${escapeHtml(copy.website)}</label>
                <input id="website" name="website" type="url" class="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal" placeholder="${escapeHtml(copy.websitePlaceholder)}" />
              </div>
              <div>
                <label for="description" class="mb-2 block text-sm font-medium">${escapeHtml(copy.descriptionLabel)}</label>
                <textarea id="description" name="description" rows="6" required class="w-full rounded-2xl border border-charcoal/15 bg-ivory px-4 py-3 outline-none placeholder:text-charcoal/35 focus:border-teal" placeholder="${escapeHtml(copy.descriptionPlaceholder)}"></textarea>
              </div>
              <p data-application-feedback class="hidden rounded-2xl border border-clay/15 bg-mist px-4 py-3 text-sm text-charcoal/75"></p>
              <button type="submit" class="rounded-2xl bg-clay px-6 py-4 text-sm font-semibold text-white shadow-soft hover:bg-clay/90">${escapeHtml(copy.submit)}</button>
            </form>
          </section>
        </div>
      </section>
    </main>`;

  return renderLayout({
    lang,
    currentKey: "apply",
    title: copy.title,
    description: copy.description,
    ptPath: "/pt/apply.html",
    enPath: "/en/apply.html",
    switchHref: `/${otherLang}/apply.html`,
    body,
  });
}

function renderProfileTemplatePage(lang) {
  const copy = SITE_COPY[lang].profileTemplate;
  return renderLayout({
    lang,
    currentKey: "profile-template",
    title: copy.title,
    description: copy.description,
    ptPath: "/pt/profile-template.html",
    enPath: "/en/profile-template.html",
    switchHref: `/${lang === "pt" ? "en" : "pt"}/profile-template.html`,
    body: `<main id="profile-root"></main>`,
    scripts: `NexaDirectory.renderProfileTemplate({ lang: "${lang}", containerId: "profile-root" });`,
  });
}

function renderCategoryPage(lang, slug) {
  const copy = SITE_COPY[lang].category;
  const meta = CATEGORY_META[slug][lang];
  const otherLang = lang === "pt" ? "en" : "pt";
  const body = `
    <main>
      <section class="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div class="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div class="max-w-3xl">
            <p class="text-sm font-semibold uppercase tracking-[0.24em] text-teal">${escapeHtml(copy.eyebrow)}</p>
            <h1 class="mt-3 font-display text-4xl font-bold leading-tight sm:text-5xl">${escapeHtml(meta.title)}</h1>
            <p class="mt-6 text-lg leading-8 text-charcoal/75">${escapeHtml(meta.pageDescription)}</p>
          </div>
          <div class="rounded-3xl bg-white p-8 shadow-soft">
            <p class="text-sm font-semibold uppercase tracking-[0.24em] text-teal">${escapeHtml(copy.noteEyebrow)}</p>
            <p class="mt-4 font-display text-2xl italic leading-tight text-charcoal/70">${escapeHtml(meta.note)}</p>
            <a href="/${lang}/professionals.html" class="mt-6 inline-flex text-sm font-semibold text-teal">${escapeHtml(copy.browseAll)}</a>
          </div>
        </div>
        <div id="category-grid" data-category-slug="${slug}" class="mt-12 grid gap-6 lg:grid-cols-2 xl:grid-cols-3"></div>
      </section>
    </main>`;

  return renderLayout({
    lang,
    currentKey: "categories",
    title: copy.metaTitle(meta.title),
    description: copy.metaDescription(meta.title),
    ptPath: `/pt/category-${slug}.html`,
    enPath: `/en/category-${slug}.html`,
    switchHref: `/${otherLang}/category-${slug}.html`,
    body,
    scripts: `NexaDirectory.renderCategoryDirectory("category-grid", "${slug}", { lang: "${lang}" });`,
  });
}

function writeFile(relativePath, contents) {
  const destination = path.join(projectRoot, relativePath);
  ensureDir(path.dirname(destination));
  fs.writeFileSync(destination, contents);
}

const bilingualProfiles = rawProfiles.map(buildProfile);
fs.writeFileSync(dataPath, JSON.stringify(bilingualProfiles, null, 2));
fs.writeFileSync(csvPath, `${toCsv(bilingualProfiles)}\n`);

for (const lang of ["pt", "en"]) {
  ensureDir(path.join(projectRoot, lang));
}

writeFile(
  "index.html",
  `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=/pt/index.html" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Nexa</title>
    <link rel="canonical" href="/pt/index.html" />
  </head>
  <body>
    <p>Redirecionando para <a href="/pt/index.html">/pt/index.html</a>...</p>
  </body>
</html>`
);

writeFile("pt/index.html", renderHomePage("pt"));
writeFile("en/index.html", renderHomePage("en"));
writeFile("pt/browse-categories.html", renderBrowseCategoriesPage("pt"));
writeFile("en/browse-categories.html", renderBrowseCategoriesPage("en"));
writeFile("pt/professionals.html", renderProfessionalsPage("pt"));
writeFile("en/professionals.html", renderProfessionalsPage("en"));
writeFile("pt/apply.html", renderApplyPage("pt"));
writeFile("en/apply.html", renderApplyPage("en"));
writeFile("pt/profile-template.html", renderProfileTemplatePage("pt"));
writeFile("en/profile-template.html", renderProfileTemplatePage("en"));
writeFile(`pt/${LEGAL_PAGES.guidelines.pt.slug}.html`, renderLegalPage("pt", "guidelines"));
writeFile(`en/${LEGAL_PAGES.guidelines.en.slug}.html`, renderLegalPage("en", "guidelines"));
writeFile(`pt/${LEGAL_PAGES.privacy.pt.slug}.html`, renderLegalPage("pt", "privacy"));
writeFile(`en/${LEGAL_PAGES.privacy.en.slug}.html`, renderLegalPage("en", "privacy"));
writeFile(`pt/${LEGAL_PAGES.usage.pt.slug}.html`, renderLegalPage("pt", "usage"));
writeFile(`en/${LEGAL_PAGES.usage.en.slug}.html`, renderLegalPage("en", "usage"));

for (const slug of CATEGORY_ORDER) {
  writeFile(`pt/category-${slug}.html`, renderCategoryPage("pt", slug));
  writeFile(`en/category-${slug}.html`, renderCategoryPage("en", slug));
}
