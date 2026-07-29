// Gerador de NPCs aleatórios rápidos para uso durante a sessão

export const RACAS = [
  "Humano", "Elfo", "Meio-Elfo", "Anão", "Halfling", "Gnomo",
  "Meio-Orc", "Tiefling", "Draconato", "Kalashtar", "Goliath", "Tabaxi",
];

export const CLASSES = [
  "Bárbaro", "Bardo", "Bruxo", "Clérigo", "Druida", "Feiticeiro",
  "Guerreiro", "Ladino", "Mago", "Monge", "Paladino", "Patrulheiro",
];

export const FUNCOES = [
  "Guarda", "Cidadão", "Cultista", "Mercador", "Criança", "Nobre",
  "Criminoso", "Religioso", "Artesão", "Estudioso", "Taverneiro",
  "Camponês", "Mercenário",
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

// Ocupações agrupadas por função — usadas como filtro rápido no gerador.
const FUNCAO_OCUPACOES = {
  Guarda: ["Guarda da cidade", "Guarda da muralha", "Capitão(ã) da guarda", "Soldado(a) da milícia local", "Vigia noturno(a)"],
  Cidadão: ["Morador(a) comum do bairro", "Dono(a) de uma pequena casa", "Aposentado(a) de uma guilda", "Pai/mãe de família", "Recém-chegado(a) à cidade"],
  Cultista: ["Membro recém-convertido de um culto", "Iniciado(a) que já duvida da fé", "Zelador(a) de um santuário secreto", "Mensageiro(a) de uma seita obscura", "Fanático(a) disposto(a) a tudo pela causa"],
  Mercador: ["Mercador(a) itinerante", "Dono(a) de uma pequena loja", "Vendedor(a) de rua", "Comerciante de especiarias", "Negociante de informações"],
  Criança: ["Órfã(o) que vive nas ruas", "Filho(a) de um comerciante local", "Aprendiz mirim de um artesão", "Criança curiosa demais para o próprio bem", "Vendedor(a) mirim de jornais ou flores"],
  Nobre: ["Nobre menor endividado(a)", "Herdeiro(a) de uma casa em declínio", "Diplomata da corte", "Filho(a) mimado(a) de família rica", "Nobre caído(a) em desgraça"],
  Criminoso: ["Ladrão(oa) de rua", "Contrabandista", "Batedor(a) de carteiras", "Membro de uma gangue local", "Falsificador(a) de documentos"],
  Religioso: ["Sacerdote(isa)", "Acólito(a) de um templo", "Peregrino(a) devoto(a)", "Curandeiro(a) de um santuário", "Exorcista itinerante"],
  Artesão: ["Ferreiro(a)", "Carpinteiro(a)", "Alfaiate", "Joalheiro(a)", "Curtidor(a) de couro"],
  Estudioso: ["Erudito(a)", "Escriba", "Bibliotecário(a)", "Alquimista", "Cartógrafo(a)"],
  Taverneiro: ["Taverneiro(a)", "Garçom/Garçonete", "Cervejeiro(a) local", "Cozinheiro(a) de estalagem", "Dono(a) de uma pousada"],
  "Camponês": ["Fazendeiro(a)", "Pastor(a) de ovelhas", "Pescador(a)", "Lenhador(a)", "Colhedor(a) sazonal"],
  Mercenário: ["Caçador(a) de recompensas", "Mercenário(a) sem contrato atual", "Ex-soldado(a) de fortuna", "Guarda-costas de aluguel", "Duelista itinerante"],
};

const TODAS_OCUPACOES = Object.values(FUNCAO_OCUPACOES).flat();

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

// Crianças precisam de traços/motivações/ganchos próprios — os pools acima
// (dívidas de jogo, vingança, contrabando) não fazem sentido para elas.
const CRIANCA_TRACOS = [
  "Faz perguntas sem parar sobre tudo que vê.",
  "Finge ser um herói famoso enquanto brinca pelas ruas.",
  "Esconde um bichinho de estimação que não deveria ter.",
  "Troca figurinhas, botões ou pedrinhas como se fossem tesouros.",
  "Conta segredos alheios sem perceber que são segredos.",
  "Tem um amigo imaginário que 'sabe de tudo'.",
  "Corre atrás de qualquer animal que vê pela rua.",
  "Fala demais quando está nervoso(a).",
];

const CRIANCA_MOTIVACOES = [
  "Quer provar que não é pequeno(a) demais para ajudar.",
  "Está procurando o bichinho de estimação que fugiu.",
  "Quer impressionar um herói ou aventureiro que admira.",
  "Foi desafiado(a) por outras crianças a fazer algo perigoso.",
  "Guarda um segredo que prometeu não contar a ninguém.",
  "Só quer voltar para casa antes que alguém perceba que sumiu.",
];

const CRIANCA_GANCHOS = [
  "Viu algo estranho que os adultos não acreditam.",
  "Pede ajuda para resgatar um bichinho preso em algum lugar.",
  "Oferece mostrar um atalho secreto que só as crianças conhecem.",
  "Confunde os aventureiros com os heróis de uma história que ouviu.",
  "Está perdido(a) e não sabe voltar para casa.",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// filtros opcionais: { raca, classe, funcao } — qualquer um ausente/"" = aleatório
export function generateRandomNpc(filtros = {}) {
  const { raca, classe, funcao } = filtros;
  const genero = Math.random() < 0.5 ? "masc" : "fem";
  const nome = `${pick(NOMES[genero])} ${pick(SOBRENOMES)}`;

  const poolOcupacoes = funcao ? FUNCAO_OCUPACOES[funcao] : TODAS_OCUPACOES;
  const ehCrianca = funcao === "Criança";

  return {
    nome,
    raca: raca || pick(RACAS),
    classe: classe || "",
    funcao: funcao || "",
    ocupacao: pick(poolOcupacoes || TODAS_OCUPACOES),
    traco: pick(ehCrianca ? CRIANCA_TRACOS : TRACOS_PERSONALIDADE),
    motivacao: pick(ehCrianca ? CRIANCA_MOTIVACOES : MOTIVACOES),
    gancho: pick(ehCrianca ? CRIANCA_GANCHOS : GANCHOS),
  };
}
