// Gerador de NPCs aleatórios rápidos para uso durante a sessão

const RACAS = [
  "Humano", "Elfo", "Meio-Elfo", "Anão", "Halfling", "Gnomo",
  "Meio-Orc", "Tiefling", "Draconato", "Kalashtar", "Goliath", "Tabaxi",
];

const NOMES = {
  masc: [
    "Aldric", "Bram", "Corvin", "Daven", "Edric", "Fenwick", "Garrick",
    "Halvard", "Ivo", "Joren", "Kael", "Lorcan", "Milo", "Norwin",
    "Oswin", "Piers", "Quillon", "Rurik", "Soren", "Thaddeus",
  ],
  fem: [
    "Aveline", "Briar", "Cassia", "Deidra", "Elowen", "Farrah", "Greta",
    "Hazel", "Iris", "Jessamine", "Kyra", "Lysandra", "Maren", "Nadia",
    "Orla", "Perrin", "Quinn", "Rosalind", "Sable", "Thessaly",
  ],
};

const SOBRENOMES = [
  "Pedraverde", "do Vale Sombrio", "Marnegra", "Solferro", "Ventania",
  "Corvoduro", "Águadoce", "das Terras Altas", "Cinzafogo", "Luaprata",
  "Trovejante", "do Bosque Antigo", "Ferreiro", "Caçasombra", "Brandão",
];

const OCUPACOES = [
  "Taverneiro(a)", "Ferreiro(a)", "Guarda da cidade", "Mercador(a) itinerante",
  "Curandeiro(a)", "Ladrão(oa) de rua", "Sacerdote(isa)", "Bardo(a) viajante",
  "Caçador(a) de recompensas", "Fazendeiro(a)", "Erudito(a)", "Marinheiro(a)",
  "Escriba", "Contrabandista", "Nobre menor", "Mendigo(a)", "Alquimista",
  "Domador(a) de animais", "Coveiro(a)", "Espião(ã)",
];

const TRACOS_PERSONALIDADE = [
  "Fala sempre em voz baixa, como se contasse um segredo.",
  "Ri da própria piada antes de terminar de contá-la.",
  "Nunca olha diretamente nos olhos de quem conversa.",
  "Coleciona objetos pequenos e inúteis de quem encontra.",
  "É extremamente pontual e se irrita com atrasos.",
  "Trata estranhos com uma calorosidade suspeita.",
  "Tem um tique nervoso de tamborilar os dedos.",
  "Fala de si na terceira pessoa quando está nervoso(a).",
  "É brutalmente honesto(a), mesmo quando não deveria.",
  "Desconfia de qualquer coisa que pareça boa demais.",
  "Sempre tenta vender algo, mesmo em momentos inadequados.",
  "Cita provérbios antigos para qualquer situação.",
  "Tem medo irracional de um animal comum (gatos, pombos, etc.).",
  "Fala alto demais, mesmo em lugares silenciosos.",
  "Está sempre mastigando ou comendo algo.",
];

const MOTIVACOES = [
  "Busca vingança contra quem destruiu sua família.",
  "Quer pagar uma dívida de jogo antes que descubram.",
  "Deseja provar seu valor à própria família.",
  "Esconde uma identidade ou passado criminoso.",
  "Procura um ente querido desaparecido.",
  "Quer comprar a liberdade de alguém escravizado.",
  "Está tentando reunir dinheiro para fugir da cidade.",
  "Serve secretamente a uma organização ou culto.",
  "Busca conhecimento proibido a qualquer custo.",
  "Quer apenas ser deixado em paz e viver em silêncio.",
  "Sonha em abrir seu próprio negócio.",
  "Protege um segredo que pode abalar a comunidade local.",
];

const GANCHOS = [
  "Pede ajuda para recuperar um item roubado.",
  "Oferece informação valiosa em troca de um favor.",
  "Está sendo extorquido(a) por alguém poderoso.",
  "Sabe de um atalho perigoso, mas útil.",
  "Reconhece um dos aventureiros de algum lugar.",
  "Tem um mapa ou pista que interessa ao grupo.",
  "Foi testemunha de um crime recente.",
  "Precisa de escolta até o próximo povoado.",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRandomNpc() {
  const genero = Math.random() < 0.5 ? "masc" : "fem";
  const nome = `${pick(NOMES[genero])} ${pick(SOBRENOMES)}`;
  return {
    nome,
    raca: pick(RACAS),
    ocupacao: pick(OCUPACOES),
    traco: pick(TRACOS_PERSONALIDADE),
    motivacao: pick(MOTIVACOES),
    gancho: pick(GANCHOS),
  };
}
