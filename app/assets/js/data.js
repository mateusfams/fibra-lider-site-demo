(function () {
  "use strict";

  const STORAGE_KEY = "fibra-lider-studio-state-v13";
  const LEGACY_STORAGE_KEYS = ["fibra-lider-studio-state-v12", "fibra-lider-studio-state-v11", "fibra-lider-studio-state-v10", "fibra-lider-studio-state-v9", "fibra-lider-studio-state-v8", "fibra-lider-studio-state-v7"];
  const EVENTS_KEY = "fibra-lider-studio-events-v2";
  const SESSION_KEY = "fibra-lider-studio-session-v2";

  function plan(id, categoryId, title, speed, price, featured, badge, note, features) {
    return { id, categoryId, title, speed, price, period: "mes", featured, active: true, badge, note, features };
  }

  const defaultState = {
    meta: {
      version: "1.10.1-mvp",
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
      status: "published",
    },
    brand: {
      slug: "fibra-lider",
      name: "Fibra Lider",
      legalName: "FIBRA LIDER TELECOM LTDA",
      cnpj: "40.044.840/0001-70",
      tagline: "Internet fibra optica",
      logo: "./assets/img/fibra-lider-logo.png",
      logoDark: "./assets/img/fibra-lider-logo-dark.png",
      icon: "./assets/img/fibra-lider-icon.png",
      phone: "(19) 2042-2062",
      whatsapp: "551920422062",
      whatsappSecondary: "5519984598406",
      email: "contato@fibralider.net.br",
      instagram: "https://www.instagram.com/fibralideroficial/",
      facebook: "https://www.facebook.com/profile.php?id=100085343718942",
      address: "Av. Soma, 869 - Parque Manoel de Vasconcelos, Sumare - SP",
      siteUrl: "https://fibralider.net.br/",
      clientAreaUrl: "https://sgp.fibralider.net.br/accounts/central/login",
      coverageSummary: "Sumare, Hortolandia, Nova Odessa, Campinas e regiao",
    },
    theme: {
      primary: "#0874e7",
      primaryDark: "#063f83",
      accent: "#29d884",
      ink: "#0a1628",
      muted: "#64748b",
      surface: "#f4f7fb",
      panel: "#ffffff",
      radius: "16",
      font: "Inter",
      density: "comfortable",
      buttonStyle: "soft",
      cardStyle: "bordered",
      shadow: "soft",
      sectionReveal: true,
      mapAccent: "#0874e7",
      defaultMode: "light",
      visitorThemeToggle: true,
      motion: "comfortable",
    },
    navigation: [
      { id: "nav-plans", label: "Planos", href: "#planos", visible: true },
      { id: "nav-benefits", label: "Por que a Fibra Lider", href: "#beneficios", visible: true },
      { id: "nav-coverage", label: "Cobertura", href: "#cobertura", visible: true },
      { id: "nav-business", label: "Para empresas", href: "#empresas", visible: true },
      { id: "nav-support", label: "Atendimento", href: "#atendimento", visible: true },
    ],
    banners: [
      {
        id: "hero-familia",
        name: "Familia conectada",
        eyebrow: "Fibra optica em Sumare e regiao",
        title: "Internet que acompanha o ritmo da sua casa.",
        subtitle: "Fibra de verdade, Wi-Fi em comodato e atendimento regional para trabalhar, jogar e assistir sem interrupcoes.",
        image: "./assets/img/hero-family-fiber.jpg",
        mobileImage: "./assets/img/hero-family-fiber.jpg",
        primaryLabel: "Conhecer planos",
        primaryLink: "#planos",
        secondaryLabel: "Consultar cobertura",
        secondaryLink: "#cobertura",
        badge: "Instalacao agil",
        position: "center",
        overlay: 64,
        active: true,
      },
      {
        id: "hero-600",
        name: "Oferta 600 Mega",
        eyebrow: "O plano preferido das familias",
        title: "600 Mega para conectar tudo por R$ 99,90.",
        subtitle: "Velocidade para varios dispositivos, streaming, estudos e jogos, com suporte proximo quando voce precisar.",
        image: "./assets/img/banner-streaming-family.jpg",
        mobileImage: "./assets/img/banner-streaming-family.jpg",
        primaryLabel: "Quero 600 Mega",
        primaryLink: "#planos",
        secondaryLabel: "Falar no WhatsApp",
        secondaryLink: "whatsapp",
        badge: "Mais contratado",
        position: "right",
        overlay: 70,
        active: true,
      },
      {
        id: "hero-empresas",
        name: "Fibra Lider Empresas",
        eyebrow: "Conectividade para negocios",
        title: "Sua empresa conectada para crescer sem pausas.",
        subtitle: "Links dedicados, projetos sob medida e atendimento tecnico regional para operacoes que dependem de estabilidade.",
        image: "./assets/img/banner-business-fiber.jpg",
        mobileImage: "./assets/img/banner-business-fiber.jpg",
        primaryLabel: "Solicitar proposta",
        primaryLink: "whatsapp",
        secondaryLabel: "Conhecer solucoes",
        secondaryLink: "#empresas",
        badge: "Atendimento consultivo",
        position: "right",
        overlay: 66,
        active: true,
      },
    ],
    slider: { autoplay: true, interval: 6500, showArrows: true, showDots: true, pauseOnHover: true },
    content: {
      trustLabel: "Conexao regional, suporte de verdade",
      plansEyebrow: "Planos residenciais",
      plansTitle: "Escolha sua velocidade. O resto e com a gente.",
      plansText: "Compare os planos mais contratados e fale direto com a equipe comercial pelo WhatsApp.",
      benefitsEyebrow: "Feita para a vida real",
      benefitsTitle: "Mais estabilidade em cada momento do seu dia.",
      benefitsText: "Da primeira reuniao da manha ao ultimo episodio da noite, sua casa continua conectada.",
      appsEyebrow: "Conteudo para todos",
      appsTitle: "Internet e entretenimento em um so plano.",
      appsText: "Filmes, series, musica, esportes, leitura e seguranca digital para completar sua experiencia.",
      businessEyebrow: "Fibra Lider Empresas",
      businessTitle: "Conectividade para sua empresa nao parar.",
      businessText: "Link dedicado para empresas e eventos, projetos sob medida e atendimento tecnico regional.",
      businessSignal: "Conexao preparada para seu negocio",
      coverageEyebrow: "Onde atendemos",
      coverageTitle: "Consulte a disponibilidade no seu endereco.",
      coverageText: "Nossa rede esta em expansao na Regiao Metropolitana de Campinas.",
      testimonialEyebrow: "Quem usa, recomenda",
      testimonialTitle: "Uma internet proxima de quem conecta.",
      faqEyebrow: "Duvidas frequentes",
      faqTitle: "Respostas rapidas antes de contratar.",
      supportEyebrow: "Central Fibra Lider",
      supportTitle: "Resolva tudo pelo canal certo.",
      supportText: "Atendimento comercial, area do cliente e suporte em canais diretos.",
      faqText: "Encontre respostas sobre instalacao, cobertura, equipamentos e contratacao.",
      businessFeatures: "Link dedicado e projetos sob medida\nAtendimento tecnico regional\nConectividade para empresas e eventos",
      coverageMapLabel: "Rede Fibra Lider",
      finalEyebrow: "Internet regional de verdade",
      finalTitle: "Pronto para navegar sem limites?",
      finalText: "Consulte a cobertura e encontre o melhor plano para sua casa ou empresa.",
    },
    categories: [
      { id: "internet", name: "Internet", description: "Internet fibra optica residencial" },
      { id: "max", name: "Internet + MAX", description: "Fibra com filmes e series" },
      { id: "sky", name: "Internet + SKY+", description: "Fibra, TV e streaming" },
      { id: "sky-paramount", name: "SKY Light + Paramount", description: "Entretenimento completo" },
      { id: "telefone", name: "Internet + Telefone", description: "Fibra com telefonia fixa" },
      { id: "completo", name: "Pacote completo", description: "Internet e varios servicos" },
    ],
    plans: [
      plan("internet-300", "internet", "Fibra Essencial", "300 MEGA", 89.9, false, "", "Contrato anual com equipamento em comodato.", ["100% fibra optica", "Wi-Fi em comodato", "Suporte regional", "Instalacao consultiva"]),
      plan("internet-600", "internet", "Fibra Familia", "600 MEGA", 99.9, true, "Mais contratado", "O melhor equilibrio para casas conectadas.", ["Streaming em alta qualidade", "Jogos com baixa latencia", "Varios dispositivos", "Atendimento local"]),
      plan("internet-800", "internet", "Fibra Performance", "800 MEGA", 129.9, false, "Alta performance", "Mais velocidade para rotinas intensas.", ["Downloads mais rapidos", "Casa toda conectada", "100% fibra optica", "Wi-Fi em comodato"]),
      plan("max-300", "max", "Fibra + MAX", "300 MEGA", 119.9, false, "", "Internet e entretenimento em um pacote.", ["MAX incluso", "Wi-Fi em comodato", "Fibra optica", "Suporte especializado"]),
      plan("max-600", "max", "Fibra + MAX", "600 MEGA", 129.9, true, "Custo-beneficio", "Velocidade e entretenimento para a familia.", ["MAX incluso", "Streaming sem travar", "Jogos online", "Atendimento local"]),
      plan("max-800", "max", "Fibra + MAX", "800 MEGA", 149.9, false, "", "Experiencia premium para todos os dispositivos.", ["MAX incluso", "Alta performance", "Varios dispositivos", "100% fibra"]),
      plan("sky-300", "sky", "Fibra + SKY+", "300 MEGA", 169.9, false, "", "Internet e conteudo para toda a casa.", ["SKY+ incluso", "Wi-Fi em comodato", "Streaming", "Suporte local"]),
      plan("sky-600", "sky", "Fibra + SKY+", "600 MEGA", 179.9, true, "Recomendado", "Um pacote completo para familias.", ["SKY+ incluso", "Jogos e streaming", "100% fibra", "Atendimento especializado"]),
      plan("sky-800", "sky", "Fibra + SKY+", "800 MEGA", 199.9, false, "", "Mais velocidade com pacote SKY+.", ["SKY+ incluso", "Alta velocidade", "Multidispositivos", "Suporte local"]),
      plan("sp-600", "sky-paramount", "SKY Light + Paramount", "600 MEGA", 109.9, false, "", "Fibra, canais e filmes em um pacote.", ["SKY Light", "Paramount+", "Fibra optica", "Atendimento local"]),
      plan("sp-800", "sky-paramount", "SKY Light + Paramount", "800 MEGA", 129.9, true, "Oferta", "Combo de alta velocidade e entretenimento.", ["SKY Light", "Paramount+", "Alta velocidade", "Wi-Fi em comodato"]),
      plan("sp-1000", "sky-paramount", "SKY Light + Paramount", "1000 MEGA", 179.9, false, "1 Giga", "O plano premium da Fibra Lider.", ["1 GIGA", "SKY Light", "Paramount+", "100% fibra"]),
      plan("tel-300", "telefone", "Fibra + Telefone", "300 MEGA", 129.9, false, "", "Internet com linha telefonica fixa.", ["Ligacoes ilimitadas", "Todo o Brasil", "Wi-Fi em comodato", "Suporte local"]),
      plan("tel-600", "telefone", "Fibra + Telefone", "600 MEGA", 139.9, true, "Popular", "Para casa e pequenos negocios.", ["Ligacoes ilimitadas", "600 Mega", "100% fibra", "Atendimento especializado"]),
      plan("tel-800", "telefone", "Fibra + Telefone", "800 MEGA", 147.9, false, "", "Velocidade alta com telefone fixo.", ["Ligacoes ilimitadas", "800 Mega", "Wi-Fi em comodato", "Suporte local"]),
      plan("complete-300", "completo", "Pacote Completo", "300 MEGA", 199.7, false, "", "Internet e servicos para toda a familia.", ["Internet fibra", "Entretenimento", "Apps parceiros", "Suporte local"]),
      plan("complete-600", "completo", "Pacote Completo", "600 MEGA", 209.7, true, "Tudo incluso", "O pacote mais completo da Fibra Lider.", ["Internet fibra", "SKY+ e MAX", "Apps parceiros", "Atendimento especializado"]),
      plan("complete-800", "completo", "Pacote Completo", "800 MEGA", 239.7, false, "", "Performance e entretenimento sem limites.", ["Internet fibra", "SKY+ e MAX", "Apps parceiros", "Wi-Fi em comodato"]),
    ],
    benefits: [
      { id: "benefit-fiber", icon: "cable", title: "100% fibra optica", text: "Tecnologia do inicio ao fim da rede para entregar mais estabilidade." },
      { id: "benefit-wifi", icon: "wifi", title: "Wi-Fi para a casa toda", text: "Equipamento em comodato e orientacao para a melhor experiencia." },
      { id: "benefit-support", icon: "headphones", title: "Suporte da regiao", text: "Uma equipe proxima, pronta para entender e resolver." },
      { id: "benefit-speed", icon: "gauge", title: "Velocidade de verdade", text: "Planos para estudar, trabalhar, jogar e assistir ao mesmo tempo." },
    ],
    apps: [
      { id: "max", name: "MAX", category: "Filmes e series", logo: "" }, { id: "sky", name: "SKY+", category: "TV e streaming", logo: "" },
      { id: "paramount", name: "Paramount+", category: "Filmes e series", logo: "" }, { id: "deezer", name: "Deezer", category: "Musica", logo: "" },
      { id: "playkids", name: "PlayKids", category: "Infantil", logo: "" }, { id: "kaspersky", name: "Kaspersky", category: "Seguranca", logo: "" },
      { id: "nba", name: "NBA", category: "Esportes", logo: "" }, { id: "ubook", name: "Ubook", category: "Audiobooks", logo: "" },
    ],
    regions: [
      { id: "sumare", name: "Sumare", type: "city", cep: "13170-001", stateCode: "SP", address: "Sumare - SP", status: "Cobertura ativa", interest: 94, leads: 86, lat: -22.8217964, lng: -47.2671050, radiusKm: 7, color: "#0874e7", active: true },
      { id: "hortolandia", name: "Hortolandia", type: "city", cep: "13184-190", stateCode: "SP", address: "Hortolandia - SP", status: "Cobertura ativa", interest: 78, leads: 64, lat: -22.8620175, lng: -47.2164219, radiusKm: 6, color: "#0da86f", active: true },
      { id: "nova-odessa", name: "Nova Odessa", type: "city", cep: "13380-009", stateCode: "SP", address: "Nova Odessa - SP", status: "Expansao monitorada", interest: 62, leads: 41, lat: -22.7805746, lng: -47.2993805, radiusKm: 5, color: "#497de7", active: true },
      { id: "campinas", name: "Campinas", type: "city", cep: "13010-111", stateCode: "SP", address: "Campinas - SP", status: "Consulta de viabilidade", interest: 49, leads: 32, lat: -22.9056391, lng: -47.0595640, radiusKm: 5, color: "#e39a16", active: true },
      { id: "paulinia", name: "Paulinia", type: "city", cep: "13140-001", stateCode: "SP", address: "Paulinia - SP", status: "Expansao futura", interest: 34, leads: 18, lat: -22.7630391, lng: -47.1532213, radiusKm: 4, color: "#db7b20", active: true },
    ],
    coverageSettings: {
      areaSourceMode: "auto",
      mapStyle: "brand",
      routeProvider: "google",
      geocodingProvider: "nominatim",
      googleMapsEnabled: false,
      googleMapsBrowserKey: "",
      googleMapId: "",
      cepLookup: true,
      precisePolygonCheck: true,
      showInterest: true,
      showLabels: true,
      showImportedLabels: true,
      autoIdentifyImportedAreas: true,
      defaultRadiusKm: 5,
      defaultState: "SP",
      centerLat: -22.835,
      centerLng: -47.19,
      importedAreaOpacity: 0.3,
      maxImportMb: 5,
    },
    coverageFiles: [],
    mediaSettings: {
      format: "image/webp",
      quality: 82,
      maxWidth: 1920,
      maxFileMb: 8,
    },
    builderSettings: {
      autosave: true,
      canvasZoom: 100,
      showSectionLabels: true,
      previewTheme: "light",
    },
    mediaLibrary: [
      { id: "media-hero-family", name: "Familia conectada", url: "./assets/img/hero-family-fiber.jpg", type: "image/jpeg", width: 1774, height: 887, bytes: 224939, originalBytes: 224939, usage: "Banner", createdAt: "2026-09-21" },
      { id: "media-streaming", name: "Streaming em familia", url: "./assets/img/banner-streaming-family.jpg", type: "image/jpeg", width: 1672, height: 941, bytes: 227341, originalBytes: 227341, usage: "Banner", createdAt: "2026-09-21" },
      { id: "media-business", name: "Fibra para empresas", url: "./assets/img/banner-business-fiber.jpg", type: "image/jpeg", width: 1672, height: 941, bytes: 180411, originalBytes: 180411, usage: "Banner", createdAt: "2026-09-21" },
      { id: "media-logo", name: "Logo Fibra Lider", url: "./assets/img/fibra-lider-logo.png", type: "image/png", width: 800, height: 250, bytes: 25041, originalBytes: 25041, usage: "Marca", createdAt: "2026-09-21" },
    ],
    testimonials: [
      { id: "review-1", name: "Mariana S.", city: "Sumare", rating: 5, text: "Atendimento rapido e internet estavel mesmo com a casa toda conectada." },
      { id: "review-2", name: "Carlos A.", city: "Hortolandia", rating: 5, text: "A instalacao foi bem orientada e o plano de 600 Mega atende muito bem." },
      { id: "review-3", name: "Fernanda M.", city: "Nova Odessa", rating: 5, text: "Consegui falar direto com a equipe e resolver tudo pelo WhatsApp." },
    ],
    faq: [
      { id: "faq-1", question: "Os equipamentos estao inclusos?", answer: "Os planos podem incluir equipamento Wi-Fi em comodato conforme as condicoes comerciais e a viabilidade do endereco." },
      { id: "faq-2", question: "Como consultar cobertura?", answer: "Informe sua cidade e bairro na consulta do site. A equipe comercial confirma a disponibilidade exata pelo WhatsApp." },
      { id: "faq-3", question: "Como contratar um plano?", answer: "Escolha o plano e clique em contratar. O WhatsApp abre com velocidade, valor e categoria preenchidos para agilizar o atendimento." },
      { id: "faq-4", question: "Posso trocar de plano depois?", answer: "Sim. A equipe pode verificar as opcoes de upgrade e os combos disponiveis para o seu endereco." },
      { id: "faq-5", question: "A Fibra Lider atende empresas?", answer: "Sim. Ha projetos de link dedicado para empresas e eventos, com avaliacao tecnica e proposta personalizada." },
    ],
    supportCards: [
      { id: "support-whatsapp", icon: "message-circle", title: "Atendimento pelo WhatsApp", text: "Contratacao, duvidas e orientacao comercial.", label: "Iniciar conversa", type: "whatsapp", url: "", active: true },
      { id: "support-client", icon: "user-round", title: "Area do cliente", text: "Acesse faturas, servicos e dados do seu contrato.", label: "Entrar na central", type: "external", url: "https://sgp.fibralider.net.br/accounts/central/login", active: true },
      { id: "support-speed", icon: "gauge", title: "Teste de velocidade", text: "Verifique o desempenho atual da sua conexao.", label: "Fazer teste", type: "external", url: "https://www.speedtest.net/", active: true },
      { id: "support-contract", icon: "file-text", title: "Contratos e documentos", text: "Consulte os documentos publicos da Fibra Lider.", label: "Abrir documentos", type: "internal", url: "./pagina.html?slug=contrato-de-adesao", active: true },
    ],
    coupons: [
      { id: "coupon-lider10", code: "LIDER10", title: "Primeiro mes mais leve", discount: "10% no primeiro mes", discountType: "percentage", discountValue: 10, durationType: "first_month", durationMonths: 1, applicationMode: "both", description: "Desconto no primeiro mes para os planos Fibra Familia e Performance.", planIds: ["internet-600", "internet-800"], startsAt: "2026-09-01", expiresAt: "2026-12-31", usageLimit: 100, used: 27, active: true },
      { id: "coupon-trimestre20", code: "TRIMESTRE20", title: "Trimestre conectado", discount: "20% nos 3 primeiros meses", discountType: "percentage", discountValue: 20, durationType: "months", durationMonths: 3, applicationMode: "code", description: "Condicao promocional para novos assinantes dos combos selecionados.", planIds: ["max-600", "sky-600", "complete-600"], startsAt: "2026-09-01", expiresAt: "2026-11-30", usageLimit: 80, used: 14, active: true },
      { id: "coupon-vitalicio15", code: "FIBRA15", title: "Fidelidade premiada", discount: "15% de desconto vitalicio", discountType: "percentage", discountValue: 15, durationType: "lifetime", durationMonths: 0, applicationMode: "code", description: "Mensalidade promocional enquanto o plano elegivel permanecer ativo.", planIds: ["internet-300"], startsAt: "2026-09-01", expiresAt: "2026-10-31", usageLimit: 40, used: 9, active: true },
    ],
    popupCampaigns: [
      { id: "popup-lider10", name: "Cupom de boas-vindas", type: "coupon", title: "Uma vantagem para comecar bem.", description: "Use o cupom LIDER10 e consulte as condicoes de adesao com nossa equipe.", eyebrow: "Oferta por tempo limitado", image: "./assets/img/hero-family-fiber.jpg", couponId: "coupon-lider10", ctaLabel: "Quero aproveitar", ctaLink: "#planos", trigger: "delay", delaySeconds: 8, scrollPercent: 45, frequency: "session", startsAt: "2026-09-01", expiresAt: "2026-12-31", active: true },
    ],
    whatsapp: {
      floatingMessage: "Ola {brand}, vim pelo site e preciso de atendimento.",
      coverageTemplate: "Ola {brand}! Quero consultar cobertura.\n\nCEP: {cep}\nCidade: {city}\nBairro: {neighborhood}",
      planTemplate: "Oi, sou {name} e visitei o site da {brand}. Tenho interesse neste plano:\n\nPlano: {plan}\nVelocidade: {speed}\nValor anunciado: {price}\nOferta: {offer}\nMeu WhatsApp: {leadWhatsapp}\n\nPode me passar mais informacoes?",
      businessTemplate: "Ola {brand}, quero saber mais sobre link dedicado para minha empresa ou evento.",
    },
    leadSettings: {
      captureEnabled: true,
      requireWhatsapp: true,
      consentText: "Autorizo o contato da empresa sobre este plano e ofertas relacionadas.",
      retentionDays: 180,
      successTitle: "Tudo certo. Vamos continuar no WhatsApp.",
    },
    leads: [
      { id: "lead-demo-1", name: "Lead demonstracao 01", whatsapp: "5519000000001", planId: "internet-600", couponId: "coupon-lider10", source: "Site", sourceDetail: "Card de plano", campaignId: "popup-lider10", utmSource: "instagram", utmMedium: "social", utmCampaign: "setembro-fibra", pagePath: "/", region: "Sumare", status: "new", consentAt: "2026-09-22T12:10:00.000Z", createdAt: "2026-09-22T12:10:00.000Z", lastContactAt: "" },
      { id: "lead-demo-2", name: "Lead demonstracao 02", whatsapp: "5519000000002", planId: "max-600", couponId: "coupon-trimestre20", source: "Google Ads", sourceDetail: "Pesquisa paga", campaignId: "", utmSource: "google", utmMedium: "cpc", utmCampaign: "internet-600", pagePath: "/", region: "Hortolandia", status: "proposal", consentAt: "2026-09-21T17:45:00.000Z", createdAt: "2026-09-21T17:45:00.000Z", lastContactAt: "2026-09-21T18:05:00.000Z" },
    ],
    whatsappTemplates: [
      { id: "wa-template-plan", name: "Primeiro contato", type: "plan", message: "Ola {name}! Aqui e da {brand}. Recebemos seu interesse no plano {plan} de {speed}, por {price}. Posso confirmar a cobertura e tirar suas duvidas?", active: true },
      { id: "wa-template-followup", name: "Retorno do atendimento", type: "followup", message: "Ola {name}! Tudo bem? Estou retomando seu atendimento sobre o plano {plan}. Ainda posso ajudar com a oferta {offer}?", active: true },
      { id: "wa-template-coverage", name: "Confirmacao de cobertura", type: "coverage", message: "Ola {name}! Identificamos seu interesse na regiao de {region}. Para confirmar a viabilidade do plano {plan}, pode me enviar o CEP e o numero do endereco?", active: true },
      { id: "wa-template-proposal", name: "Envio de proposta", type: "proposal", message: "Ola {name}! Preparei as condicoes do plano {plan}: {price} por mes. Oferta atual: {offer}. Posso seguir com a verificacao para instalacao?", active: true },
      { id: "wa-template-recovery", name: "Recuperacao de interesse", type: "recovery", message: "Ola {name}! Aqui e da {brand}. Surgiu uma nova condicao para o plano {plan}. Quer que eu confira se ela esta disponivel para sua regiao?", active: true }
    ],
    whatsappCampaigns: [
      { id: "wa-campaign-600", name: "Interesse em 600 Mega", type: "followup", templateId: "wa-template-followup", message: "Ola {name}! Aqui e da {brand}. Vimos seu interesse no plano {plan}. Posso confirmar a cobertura e as condicoes da oferta {offer}?", planIds: ["internet-600", "max-600", "sky-600", "complete-600"], stages: ["new", "qualified", "proposal"], sources: [], region: "", status: "active", contactsSent: 1, createdAt: "2026-09-22" },
    ],
    seo: {
      title: "Fibra Lider | Internet Fibra Optica em Sumare e Regiao",
      description: "Planos de internet 100% fibra optica em Sumare e regiao. Consulte cobertura e contrate a Fibra Lider pelo WhatsApp.",
      keywords: "internet fibra optica Sumare, provedor de internet Sumare, Fibra Lider, internet Hortolandia, internet residencial",
      canonicalUrl: "https://fibralider.net.br/",
      ogTitle: "Fibra Lider | Internet fibra optica perto de voce",
      ogDescription: "Planos de internet 100% fibra optica com atendimento regional.",
      ogImage: "./assets/img/hero-family-fiber.jpg",
      serviceArea: "Sumare, Hortolandia, Nova Odessa, Campinas e Regiao Metropolitana de Campinas",
      localBusinessType: "InternetServiceProvider",
      addressLocality: "Sumare",
      addressRegion: "SP",
      postalCode: "13170-000",
      openingHours: "Mo-Fr 08:00-18:00, Sa 08:00-12:00",
      faqSchema: true,
      offerCatalogSchema: true,
      sitemapEnabled: true,
      cityPagesEnabled: false,
      googleSiteVerification: "",
      indexSite: true,
    },
    integrations: {
      consentBanner: true, ga4Enabled: false, ga4Id: "", googleAdsEnabled: false, googleAdsId: "",
      googleAdsLabel: "", metaPixelEnabled: false, metaPixelId: "", gtmEnabled: false, gtmId: "",
      whatsappMode: "manual", whatsappApiEnabled: false, whatsappPhoneId: "", webhookUrl: "",
    },
    footer: {
      description: "Internet fibra optica com atendimento regional para residencias e empresas.",
      copyright: "Fibra Lider Telecom Ltda. Todos os direitos reservados.",
      columns: [
        { id: "footer-company", title: "Fibra Lider", links: [{ label: "Por que escolher", href: "#beneficios" }, { label: "Cobertura", href: "#cobertura" }, { label: "Para empresas", href: "#empresas" }] },
        { id: "footer-plans", title: "Planos", links: [{ label: "Internet", href: "#planos" }, { label: "Internet + MAX", href: "#planos" }, { label: "Internet + SKY+", href: "#planos" }] },
        { id: "footer-support", title: "Atendimento", links: [{ label: "Area do cliente", href: "https://sgp.fibralider.net.br/accounts/central/login" }, { label: "Teste de velocidade", href: "https://www.speedtest.net/" }, { label: "Contrato de adesao", href: "./pagina.html?slug=contrato-de-adesao" }] },
      ],
    },
    pages: [
      {
        id: "page-contrato",
        slug: "contrato-de-adesao",
        title: "Contrato de adesao",
        description: "Consulte as informacoes contratuais dos servicos de internet da Fibra Lider.",
        status: "published",
        updatedAt: "2026-09-21",
        blocks: [
          { id: "contract-hero", type: "hero", eyebrow: "Documentos Fibra Lider", title: "Contrato de prestacao de servico", text: "Informacoes claras para voce conhecer seus direitos, deveres e as condicoes dos servicos contratados.", visible: true },
          { id: "contract-intro", type: "text", title: "Contrato de Comunicacao Multimidia", text: "A Fibra Lider disponibiliza o contrato de prestacao de Servico de Comunicacao Multimidia (SCM) para consulta publica. O documento integral apresenta as condicoes de adesao, prestacao do servico, equipamentos, atendimento, suspensao e cancelamento.", visible: true },
          { id: "contract-notice", type: "callout", title: "Versao juridica integral", text: "Para preservar a integridade do documento vigente, consulte a publicacao oficial da Fibra Lider. Em caso de duvida, fale com nossa equipe antes da contratacao.", visible: true },
          { id: "contract-document", type: "document", title: "Contrato de prestacao de servico de comunicacao multimidia", text: "Documento vigente publicado pela Fibra Lider, com as clausulas e os dados regulatorios completos.", label: "Consultar contrato integral", url: "https://fibralider.net.br/contrato-de-adesao/", visible: true },
          { id: "contract-cta", type: "cta", title: "Precisa de ajuda para entender uma condicao?", text: "Nossa equipe esta disponivel para orientar voce antes da contratacao.", label: "Falar no WhatsApp", url: "whatsapp", visible: true }
        ]
      }
    ],
    pageBlocks: [
      { id: "hero", label: "Banner principal", type: "hero", visible: true, locked: true, tone: "dark" },
      { id: "proof", label: "Barra de confianca", type: "proof", visible: true, locked: false, tone: "light" },
      { id: "plans", label: "Planos", type: "plans", visible: true, locked: true, tone: "light" },
      { id: "benefits", label: "Beneficios", type: "benefits", visible: true, locked: false, tone: "soft" },
      { id: "apps", label: "Apps e entretenimento", type: "apps", visible: true, locked: false, tone: "dark" },
      { id: "business", label: "Solucoes para empresas", type: "business", visible: true, locked: false, tone: "light" },
      { id: "coverage", label: "Cobertura", type: "coverage", visible: true, locked: false, tone: "soft" },
      { id: "testimonials", label: "Depoimentos", type: "testimonials", visible: true, locked: false, tone: "light" },
      { id: "faq", label: "Perguntas frequentes", type: "faq", visible: true, locked: false, tone: "light" },
      { id: "support", label: "Central de atendimento", type: "support", visible: true, locked: false, tone: "dark" },
      { id: "final", label: "Chamada final", type: "final", visible: true, locked: true, tone: "brand" },
    ],
    auditLog: [
      { id: "audit-seed-publish", action: "publish", resource: "site", label: "Site publicado", detail: "Configuracao inicial da demonstracao", actor: "Administrador", createdAt: "2026-09-22T18:30:00.000Z" },
      { id: "audit-seed-coverage", action: "import", resource: "coverage", label: "Cobertura Clicknet carregada", detail: "53 geometrias normalizadas do arquivo KMZ", actor: "Administrador", createdAt: "2026-09-22T18:10:00.000Z" },
      { id: "audit-seed-campaign", action: "update", resource: "campaign", label: "Campanha de boas-vindas atualizada", detail: "Cupom LIDER10 associado ao popup", actor: "Administrador", createdAt: "2026-09-22T17:40:00.000Z" }
    ],
    dashboardTargets: { monthlyVisitors: 4200, monthlyLeads: 260, conversionRate: 7.4, whatsappResponse: "3 min" },
  };

  function bundledKmlElements(root, name) {
    return Array.from(root.getElementsByTagNameNS ? root.getElementsByTagNameNS("*", name) : root.getElementsByTagName(name));
  }

  function bundledKmlName(root, name) {
    const node = Array.from(root.children || []).find(function (child) { return child.localName === name || child.nodeName === name; });
    return node ? String(node.textContent || "").trim().slice(0, 160) : "";
  }

  function bundledCoordinates(value, budget) {
    const points = String(value || "").trim().split(/\s+/).map(function (entry) {
      const parts = entry.split(","); const lng = Number(parts[0]); const lat = Number(parts[1]);
      return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
    }).filter(Boolean);
    const remaining = Math.max(0, budget.max - budget.used);
    if (!points.length || !remaining) return [];
    const step = Math.max(1, Math.ceil(points.length / remaining));
    const sampled = points.filter(function (_, index) { return index % step === 0; }).slice(0, remaining);
    if (points.length > 1 && sampled.length > 1) sampled[sampled.length - 1] = points[points.length - 1];
    budget.used += sampled.length;
    return sampled;
  }

  const CLICKNET_GEOGRAPHY = [
    [[1, 4, 36, 45, 46, 48], "Centro", "Hortolandia", "Rua Antonia Mancini Pinelli", "13184-213"],
    [[2], "Jardim Amanda", "Hortolandia", "Rua Marechal Floriano Peixoto", "13188-242"],
    [[3, 21], "Jardim Florenca", "Sumare", "Rodovia Virginia Viel Campo Dall'Orto", "13177-440"],
    [[5, 34], "Jardim Rosolem", "Hortolandia", "Rua Jose Pereira de Lira", "13185-139"],
    [[6, 7], "Jardim Santana", "Hortolandia", "Rua Joaquim Martarolli", "13186-620"],
    [[8], "Resende", "Monte Mor", "Rua Antonio L. Bandini", "13197-362"],
    [[9, 10], "Ouro Verde", "Campinas", "", "13056-300"],
    [[11], "Jardim Nova Hortolandia", "Hortolandia", "Rua Mariza de Souza Fernandes", "13183-640"],
    [[12, 52], "Vila Padre Anchieta", "Campinas", "Rodovia Anhanguera", "13068-605"],
    [[13], "Jardim Irmaos Sigrist", "Campinas", "", "13054-709"],
    [[14, 15, 38], "Jardim Villagio Ghiraldelli", "Hortolandia", "Residencial Santa Barbara", "13186-501"],
    [[16], "Jardim Campineiro", "Campinas", "Rua Marconi Guglielmo", "13082-225"],
    [[17], "Jardim Mirassol", "Campinas", "", "13069-096"],
    [[18, 19, 30], "Campo Grande", "Campinas", "", "13059-128"],
    [[20, 22], "Chacaras Santa Antonieta", "Sumare", "Rua Ariovaldo Luiz Mazon", "13175-490"],
    [[23], "Matao", "Sumare", "Rua Benedito Matheus", "13180-290"],
    [[24, 26], "Pimentas", "Monte Mor", "", "13190-307"],
    [[25], "Avenida Janio Quadros", "Monte Mor", "Avenida Janio Quadros", "13190-307"],
    [[27, 28, 29, 49, 50, 51], "Real Parque", "Sumare", "Rua Nadir Esquarize", "13175-695"],
    [[31], "San Martin", "Campinas", "Estrada Municipal Jose Sedano", "13069-335"],
    [[32, 39, 40, 41, 42], "Jardim Santa Candida", "Hortolandia", "Rua Antonio Fernandes Leite", "13185-280"],
    [[33], "Jardim Rosolem", "Hortolandia", "Rua Sao Joao Del Rey", "13185-157"],
    [[35], "Jardim Nova Europa", "Hortolandia", "Avenida Wanderley Paes Soares", "13184-862"],
    [[37], "Adventista Campineiro", "Hortolandia", "", "13187-176"],
    [[43], "Jardim Villagio Ghiraldelli", "Hortolandia", "Rua Therezinha Navarro da Silva", "13186-330"],
    [[44, 53], "Parque Sao Jorge", "Campinas", "", "13064-812"],
    [[47], "Chacaras Recreio da Alvorada", "Hortolandia", "", "13183-723"]
  ];

  function identifyBundledFeatures(features) {
    const byIndex = new Map();
    CLICKNET_GEOGRAPHY.forEach(function (entry) { entry[0].forEach(function (index) { byIndex.set(index, entry); }); });
    return features.map(function (feature, index) {
      feature = { ...feature, featureIndex: Number(feature.featureIndex || index + 1) };
      const match = byIndex.get(feature.featureIndex);
      if (!match) return feature;
      const geography = { neighborhood: match[1], city: match[2], road: match[3], postcode: match[4], provider: "seed-reviewed" };
      return { ...feature, technicalName: feature.name, publicName: (match[1] || match[3]) + ", " + match[2], geography: geography };
    });
  }

  function parseBundledKml(kmlText) {
    const text = String(kmlText || "").replace(/^\uFEFF/, "").trim();
    if (text.length > 8 * 1024 * 1024 || /<!DOCTYPE|<!ENTITY/i.test(text)) throw new Error("KML de cobertura invalido.");
    const documentNode = new DOMParser().parseFromString(text, "application/xml");
    if (bundledKmlElements(documentNode, "parsererror").length) throw new Error("XML de cobertura invalido.");
    const budget = { used: 0, max: 20000 }; const features = [];
    bundledKmlElements(documentNode, "Placemark").slice(0, 100).forEach(function (placemark, index) {
      const name = bundledKmlName(placemark, "name") || "Area " + (index + 1);
      bundledKmlElements(placemark, "Polygon").forEach(function (polygon) {
        const outer = bundledKmlElements(polygon, "outerBoundaryIs")[0] || polygon;
        const node = bundledKmlElements(outer, "coordinates")[0]; const coordinates = bundledCoordinates(node ? node.textContent : "", budget);
        if (coordinates.length >= 3) features.push({ type: "polygon", name, featureIndex: index + 1, coordinates });
      });
      bundledKmlElements(placemark, "LineString").forEach(function (line) {
        const node = bundledKmlElements(line, "coordinates")[0]; const coordinates = bundledCoordinates(node ? node.textContent : "", budget);
        if (coordinates.length >= 2) features.push({ type: "line", name, featureIndex: index + 1, coordinates });
      });
      bundledKmlElements(placemark, "Point").forEach(function (point) {
        const node = bundledKmlElements(point, "coordinates")[0]; const coordinates = bundledCoordinates(node ? node.textContent : "", budget);
        if (coordinates[0]) features.push({ type: "point", name, featureIndex: index + 1, coordinates: coordinates[0] });
      });
    });
    if (!features.length) throw new Error("O KMZ nao contem geometrias validas.");
    return { features: identifyBundledFeatures(features.slice(0, 160)), coordinateCount: budget.used };
  }

  async function loadBundledCoverage(state) {
    if (!state || state.brand.slug !== "fibra-lider") return state;
    const existing = state.coverageFiles.find(function (file) { return file.id === "coverage-clicknet-base"; });
    if (existing) {
      if (!(existing.features || []).every(function (feature) { return feature.publicName; })) {
        existing.features = identifyBundledFeatures(existing.features || []);
        existing.geocodingStatus = "complete";
        existing.geocodedAt = new Date().toISOString();
        existing.geocodingRequests = 0;
        return saveRuntimeState(state);
      }
      return state;
    }
    if (!window.JSZip) return state;
    try {
      const response = await fetch("./AREA%20DE%20ATENDIMENTO%20Clicknet.kmz");
      if (!response.ok) throw new Error("Arquivo KMZ nao encontrado.");
      const buffer = await response.arrayBuffer();
      if (buffer.byteLength > Math.max(1, Number(state.coverageSettings.maxImportMb || 5)) * 1024 * 1024) throw new Error("Arquivo KMZ acima do limite.");
      const zip = await window.JSZip.loadAsync(buffer, { checkCRC32: true });
      const entries = Object.values(zip.files).filter(function (entry) { return !entry.dir && /\.kml$/i.test(entry.name); });
      const root = entries.find(function (entry) { return /(^|\/)doc\.kml$/i.test(entry.name); }) || entries[0];
      if (!root) throw new Error("KML principal nao encontrado.");
      const parsed = parseBundledKml(await root.async("string"));
      state.coverageFiles.unshift({ id: "coverage-clicknet-base", name: "Area de atendimento Clicknet", fileName: "AREA DE ATENDIMENTO Clicknet.kmz", format: "KMZ", bytes: buffer.byteLength, importedAt: new Date().toISOString(), color: state.theme.mapAccent, active: true, coordinateCount: parsed.coordinateCount, features: parsed.features, source: "bundled", geocodingStatus: "complete", geocodedAt: new Date().toISOString(), geocodingRequests: 0 });
      return saveRuntimeState(state);
    } catch (error) {
      console.warn("Nao foi possivel carregar a cobertura KMZ inicial.", error);
      return state;
    }
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function loadJson(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : clone(fallback); }
    catch (error) { console.warn("Nao foi possivel ler os dados locais.", error); return clone(fallback); }
  }
  function saveJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function getState() {
    let stored;
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      const legacyKey = LEGACY_STORAGE_KEYS.find(function (key) { return localStorage.getItem(key); });
      stored = current ? JSON.parse(current) : legacyKey ? JSON.parse(localStorage.getItem(legacyKey)) : clone(defaultState);
    } catch (error) {
      console.warn("Nao foi possivel migrar os dados locais.", error);
      stored = clone(defaultState);
    }
    const next = { ...clone(defaultState), ...stored };
    ["meta", "brand", "theme", "slider", "content", "whatsapp", "leadSettings", "seo", "integrations", "footer", "dashboardTargets", "coverageSettings", "mediaSettings", "builderSettings"].forEach(function (key) {
      next[key] = { ...clone(defaultState[key]), ...(stored[key] || {}) };
    });
    ["navigation", "banners", "categories", "plans", "benefits", "apps", "regions", "coverageFiles", "testimonials", "faq", "supportCards", "coupons", "popupCampaigns", "leads", "whatsappTemplates", "whatsappCampaigns", "pageBlocks", "pages", "mediaLibrary", "auditLog"].forEach(function (key) {
      next[key] = Array.isArray(stored[key]) ? stored[key] : clone(defaultState[key]);
    });
    next.regions = next.regions.map(function (region, index) {
      return { type: "city", cep: "", cepStart: "", cepEnd: "", cepPrefixes: [], neighborhoods: [], stateCode: "SP", address: region.name + " - SP", radiusKm: next.coverageSettings.defaultRadiusKm, priority: 10, color: index === 0 ? next.theme.mapAccent : region.color || next.theme.primary, ...region };
    });
    next.pageBlocks = next.pageBlocks.map(function (block) {
      return { spacing: "normal", container: "normal", alignment: "left", anchor: "", backgroundImage: "", backgroundPosition: "center", hideMobile: false, hideDesktop: false, content: {}, ...block, content: { ...(block.content || {}) } };
    });
    next.coupons = next.coupons.map(function (coupon) {
      const inferredValue = Number(coupon.discountValue || String(coupon.discount || "").match(/\d+(?:[.,]\d+)?/)?.[0].replace(",", ".") || 0);
      const applicationMode = coupon.applicationMode || (coupon.autoApply ? "both" : "code");
      return { discountType: "percentage", discountValue: inferredValue, durationType: "first_month", durationMonths: 1, applicationMode, planIds: [], ...coupon, applicationMode };
    });
    next.leads = next.leads.map(function (lead) {
      return { source: "Site", sourceDetail: "Card de plano", campaignId: "", utmSource: "", utmMedium: "", utmCampaign: "", pagePath: "/", region: "", status: "new", consentAt: lead.createdAt || "", lastContactAt: "", ...lead, status: lead.status === "contacted" ? "qualified" : lead.status === "closed" ? "won" : lead.status };
    });
    next.whatsappTemplates = next.whatsappTemplates.map(function (template) {
      return { type: "followup", active: true, ...template };
    });
    next.whatsappCampaigns = next.whatsappCampaigns.map(function (campaign) {
      return { type: "followup", templateId: "", planIds: [], stages: [], sources: [], region: "", contactsSent: 0, ...campaign };
    });
    next.auditLog = next.auditLog.slice(0, 120).map(function (entry) {
      const createdAt = Number.isNaN(new Date(entry.createdAt).getTime()) ? new Date().toISOString() : entry.createdAt;
      return { id: entry.id || uid("audit"), action: String(entry.action || "update").slice(0, 32), resource: String(entry.resource || "site").slice(0, 48), label: String(entry.label || "Alteracao administrativa").slice(0, 140), detail: String(entry.detail || "").slice(0, 240), actor: String(entry.actor || "Administrador").slice(0, 80), createdAt };
    });
    defaultState.coupons.forEach(function (coupon) { if (!next.coupons.some(function (item) { return item.id === coupon.id; })) next.coupons.push(clone(coupon)); });
    if (!String(next.whatsapp.planTemplate || "").includes("{name}")) next.whatsapp.planTemplate = defaultState.whatsapp.planTemplate;
    next.meta.version = defaultState.meta.version;
    return next;
  }
  function saveState(state, publish) {
    const next = clone(state);
    next.meta = { ...(next.meta || {}), updatedAt: new Date().toISOString(), publishedAt: publish ? new Date().toISOString() : next.meta.publishedAt, status: publish ? "published" : "draft" };
    saveJson(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent("fl:state", { detail: next }));
    return next;
  }
  function saveRuntimeState(state) {
    const next = clone(state);
    saveJson(STORAGE_KEY, next);
    window.dispatchEvent(new CustomEvent("fl:state", { detail: next }));
    return next;
  }
  function recordAudit(state, action, resource, label, detail) {
    state.auditLog = Array.isArray(state.auditLog) ? state.auditLog : [];
    const entry = { id: uid("audit"), action: String(action || "update"), resource: String(resource || "site"), label: String(label || "Alteracao administrativa").slice(0, 140), detail: String(detail || "").slice(0, 240), actor: "Administrador", createdAt: new Date().toISOString() };
    state.auditLog.unshift(entry);
    state.auditLog = state.auditLog.slice(0, 120);
    return entry;
  }
  function resetState() { localStorage.removeItem(STORAGE_KEY); return getState(); }
  function getEvents() { return loadJson(EVENTS_KEY, []); }
  function saveEvents(events) { saveJson(EVENTS_KEY, events.slice(-3000)); }
  function trackEvent(type, payload) {
    const events = getEvents();
    const event = { id: "evt_" + Date.now() + "_" + Math.random().toString(16).slice(2), type, payload: payload || {}, path: location.pathname, ts: new Date().toISOString(), viewport: { width: innerWidth, height: innerHeight } };
    events.push(event); saveEvents(events); return event;
  }
  function seedEventsIfEmpty() {
    const current = getEvents(); if (current.length) return current;
    const regions = ["Sumare", "Hortolandia", "Nova Odessa", "Campinas", "Paulinia"];
    const sources = ["Google Organico", "Instagram", "Acesso direto", "Google Ads", "Facebook"];
    const plans = ["internet-600", "internet-300", "internet-800", "max-600", "sp-800"];
    const seeded = [];
    for (let day = 27; day >= 0; day -= 1) {
      const date = new Date(); date.setDate(date.getDate() - day);
      const volume = 8 + ((day * 7) % 11);
      for (let index = 0; index < volume; index += 1) {
        const region = regions[(day + index) % regions.length];
        const type = index % 9 === 0 ? "whatsapp_click" : index % 6 === 0 ? "plan_click" : index % 5 === 0 ? "coverage_search" : "page_view";
        const stamp = new Date(date); stamp.setHours(8 + (index % 12), (index * 13) % 60, 0, 0);
        seeded.push({ id: "seed_" + day + "_" + index, type, payload: { region, source: sources[(day * 2 + index) % sources.length], planId: plans[(day + index * 2) % plans.length], found: region !== "Paulinia" }, path: "/", ts: stamp.toISOString(), viewport: { width: index % 3 === 0 ? 390 : 1440, height: index % 3 === 0 ? 844 : 900 } });
      }
    }
    saveEvents(seeded); return seeded;
  }
  function formatCurrency(value) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0)); }
  function categoryName(state, categoryId) { const item = state.categories.find(function (category) { return category.id === categoryId; }); return item ? item.name : "Plano"; }
  function interpolate(template, values) { return String(template || "").replace(/\{(\w+)\}/g, function (_, key) { return values[key] == null ? "" : String(values[key]); }); }
  function couponIsActive(coupon, date) {
    const today = date || new Date().toISOString().slice(0, 10);
    const hasCapacity = !Number(coupon && coupon.usageLimit) || Number(coupon.used || 0) < Number(coupon.usageLimit);
    return Boolean(coupon && coupon.active && hasCapacity && (!coupon.startsAt || coupon.startsAt <= today) && (!coupon.expiresAt || coupon.expiresAt >= today));
  }
  function couponAppliesToPlan(coupon, plan) {
    return couponIsActive(coupon) && (!coupon.planIds || !coupon.planIds.length || coupon.planIds.includes(plan.id));
  }
  function couponPrice(plan, coupon) {
    const price = Number(plan.price || 0);
    if (!coupon) return price;
    if (coupon.discountType === "fixed") return Math.max(0, price - Number(coupon.discountValue || 0));
    return Math.max(0, price * (1 - Math.min(100, Number(coupon.discountValue || 0)) / 100));
  }
  function couponLabel(coupon) {
    if (!coupon) return "Sem oferta";
    const value = coupon.discountType === "fixed" ? formatCurrency(coupon.discountValue) : Number(coupon.discountValue || 0).toLocaleString("pt-BR") + "%";
    if (coupon.durationType === "lifetime") return value + " de desconto vitalicio";
    if (coupon.durationType === "months") return value + " nos " + Number(coupon.durationMonths || 1) + " primeiros meses";
    return value + " no primeiro mes";
  }
  function activeCouponForPlan(state, plan, automaticOnly) {
    const eligible = state.coupons.filter(function (coupon) { return (!automaticOnly || coupon.autoApply) && couponAppliesToPlan(coupon, plan); });
    return eligible.sort(function (a, b) { return couponPrice(plan, a) - couponPrice(plan, b); })[0] || null;
  }
  function couponAvailableForChannel(coupon, channel) {
    const mode = coupon && (coupon.applicationMode || (coupon.autoApply ? "both" : "code"));
    return couponIsActive(coupon) && (mode === "both" || mode === channel);
  }
  function couponByCode(state, code, channel) {
    const normalized = String(code || "").trim().toUpperCase();
    return state.coupons.find(function (coupon) { return String(coupon.code || "").toUpperCase() === normalized && couponAvailableForChannel(coupon, channel || "code"); }) || null;
  }
  function selectedCouponForPlan(state, plan, couponId, channel) {
    const coupon = state.coupons.find(function (item) { return item.id === couponId; });
    return coupon && couponAvailableForChannel(coupon, channel || "code") && couponAppliesToPlan(coupon, plan) ? coupon : null;
  }
  function planMessage(state, item, details) {
    const context = details || {};
    const coupon = context.coupon || null;
    return interpolate(state.whatsapp.planTemplate, { brand: state.brand.name, name: context.name || "visitante do site", leadWhatsapp: context.whatsapp || "nao informado", plan: item.title, speed: item.speed, price: formatCurrency(coupon ? couponPrice(item, coupon) : item.price), category: categoryName(state, item.categoryId), offer: coupon ? couponLabel(coupon) : "sem cupom aplicado", region: context.region || "" });
  }
  function safeUrl(value, fallback) {
    const input = String(value || "").trim();
    const safeFallback = fallback == null ? "#" : fallback;
    if (!input) return safeFallback;
    if (input.charAt(0) === "#" || input.startsWith("./") || input.startsWith("/")) return input;
    try { return ["http:", "https:", "mailto:", "tel:"].includes(new URL(input).protocol) ? input : safeFallback; }
    catch (error) { return safeFallback; }
  }
  function safeImageUrl(value, fallback) {
    const input = String(value || "").trim();
    const safeFallback = fallback == null ? "" : fallback;
    if (/^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(input)) return input;
    if (input.startsWith("./") || input.startsWith("/")) return input;
    try { return ["http:", "https:"].includes(new URL(input).protocol) ? input : safeFallback; }
    catch (error) { return safeFallback; }
  }
  function whatsappLink(phone, message) { return "https://wa.me/" + String(phone || "").replace(/\D/g, "") + "?text=" + encodeURIComponent(message || ""); }
  function uid(prefix) { return (prefix || "item") + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  window.FL = { STORAGE_KEY, EVENTS_KEY, SESSION_KEY, defaultState, clone, getState, saveState, saveRuntimeState, recordAudit, loadBundledCoverage, resetState, getEvents, saveEvents, trackEvent, seedEventsIfEmpty, formatCurrency, categoryName, interpolate, couponIsActive, couponAppliesToPlan, couponPrice, couponLabel, activeCouponForPlan, couponAvailableForChannel, couponByCode, selectedCouponForPlan, planMessage, safeUrl, safeImageUrl, whatsappLink, uid };
})();
