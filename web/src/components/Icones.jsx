// Ícones do app, desenhados em SVG. Herdam a cor do texto (currentColor).

function Svg({ tamanho = 24, caixa = '0 0 24 24', children, ...props }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox={caixa}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

const cheio = { fill: 'currentColor', stroke: 'none' }

/* ---------- navegação ---------- */

export const IconeCasa = (p) => (
  <Svg {...p}>
    <path
      {...cheio}
      d="M12.700 2.900a1.050 1.050 0 0 0-1.400 0l-9 8.100A1 1 0 0 0 3 12.750h1.250V19.500A1.500 1.500 0 0 0 5.750 21h3a.750.750 0 0 0 .750-.750v-4.500a.750.750 0 0 1 .750-.750h3.500a.750.750 0 0 1 .750.750v4.500a.750.750 0 0 0 .750.750h3a1.500 1.500 0 0 0 1.500-1.500v-6.750H21a1 1 0 0 0 .700-1.750l-9-8.100Z"
    />
  </Svg>
)

export const IconeGrade = (p) => (
  <Svg {...p}>
    <rect {...cheio} x="3" y="3" width="8" height="8" rx="2" />
    <rect {...cheio} x="13" y="3" width="8" height="8" rx="2" />
    <rect {...cheio} x="3" y="13" width="8" height="8" rx="2" />
    <rect {...cheio} x="13" y="13" width="8" height="8" rx="2" />
  </Svg>
)

export const IconeLista = (p) => (
  <Svg {...p}>
    <rect {...cheio} x="3" y="2.500" width="18" height="19" rx="3" />
    <g stroke="#fff" strokeWidth="1.700">
      <path d="M6.500 8l1.300 1.300L10 7M12.500 8.200h5M6.800 12.500h.4M12.500 12.500h5M6.800 16.700h.4M12.500 16.700h5" />
    </g>
  </Svg>
)

/* ---------- ações gerais ---------- */

export const IconeMais = (p) => (
  <Svg strokeWidth="2.800" {...p}>
    <path d="M12 4.500v15M4.500 12h15" />
  </Svg>
)

export const IconeKebab = (p) => (
  <Svg {...p}>
    <circle {...cheio} cx="12" cy="5" r="2.200" />
    <circle {...cheio} cx="12" cy="12" r="2.200" />
    <circle {...cheio} cx="12" cy="19" r="2.200" />
  </Svg>
)

export const IconeVoltar = (p) => (
  <Svg strokeWidth="2.800" {...p}>
    <path d="M20 12H4.500M11 5l-7 7 7 7" />
  </Svg>
)

export const IconeFechar = (p) => (
  <Svg strokeWidth="2.800" {...p}>
    <path d="M6.500 6.500l11 11M17.500 6.500l-11 11" />
  </Svg>
)

export const IconeLupa = (p) => (
  <Svg strokeWidth="2.800" {...p}>
    <circle cx="10.500" cy="10.500" r="6" />
    <path d="M15.200 15.200L20.500 20.500" />
  </Svg>
)

export const IconeFunil = (p) => (
  <Svg {...p}>
    <path {...cheio} d="M3.200 4h17.600a.7.7 0 0 1 .5 1.150L14.500 12.800v6.100a.7.7 0 0 1-.4.6l-3.600 1.800a.7.7 0 0 1-1-.6v-7.900L2.700 5.150A.7.7 0 0 1 3.200 4Z" />
  </Svg>
)

export const IconeFunilCortado = (p) => (
  <Svg {...p}>
    <path {...cheio} d="M8.300 4h12.500a.7.7 0 0 1 .5 1.150l-5.900 6.650L8.300 4ZM9.500 12.800l-3.200-3.600 8.200 8.300v1.400a.7.7 0 0 1-.4.6l-3.600 1.800a.7.7 0 0 1-1-.6v-7.900Z" />
    <path strokeWidth="2.200" d="M3 3.500l17.500 17.500" />
  </Svg>
)

export const IconeFiltros = (p) => (
  <Svg {...p}>
    <path {...cheio} d="M8.500 4h13.200a.6.6 0 0 1 .45 1L17 10.800v6.500a.6.6 0 0 1-.33.54l-2.800 1.400a.6.6 0 0 1-.87-.54v-7.900L8.050 5a.6.6 0 0 1 .45-1Z" />
    <path {...cheio} d="M2.300 6.500h4.300l4.900 5.500v6.200l-1.630.82a.6.6 0 0 1-.87-.54V13L1.850 7.500a.6.6 0 0 1 .45-1Z" />
  </Svg>
)

export const IconeEditar = (p) => (
  <Svg strokeWidth="2.400" {...p}>
    <path d="M11 4.500H6.500a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V13" />
    <path {...cheio} d="M17.300 2.900a1.700 1.700 0 0 1 2.400 0l1.400 1.400a1.700 1.700 0 0 1 0 2.400l-8 8a1 1 0 0 1-.45.260l-3.300.850a.5.5 0 0 1-.610-.610l.850-3.300a1 1 0 0 1 .260-.450l7.450-8.550Z" />
  </Svg>
)

export const IconeOlho = (p) => (
  <Svg {...p}>
    <path {...cheio} d="M12 5C6.800 5 3 9 1.700 11.400a1.250 1.250 0 0 0 0 1.200C3 15 6.800 19 12 19s9-4 10.300-6.400a1.250 1.250 0 0 0 0-1.200C21 9 17.200 5 12 5Z" />
    <circle cx="12" cy="12" r="3.600" stroke="var(--cor-verde-turquesa)" strokeWidth="2.200" />
  </Svg>
)

export const IconeOlhoOculto = (p) => (
  <Svg {...p}>
    <path strokeWidth="2.200" d="M9.500 6.300A9.600 9.600 0 0 1 12 6c5 0 8.300 3.800 9.500 6-.5.900-1.300 2-2.400 3M15.500 17.300A9.300 9.300 0 0 1 12 18c-5 0-8.300-3.800-9.500-6 .7-1.200 1.900-2.800 3.600-4" />
    <path strokeWidth="2.200" d="M10 10a2.900 2.900 0 0 0 4 4" />
    <path strokeWidth="2.400" d="M3.500 3.500l17 17" />
  </Svg>
)

export const IconeCadeado = (p) => (
  <Svg strokeWidth="2.200" {...p}>
    <rect x="4.500" y="10.500" width="15" height="10.500" rx="2.500" />
    <path d="M8 10.500V7.500a4 4 0 0 1 8 0v3M12 14.500v2.500" />
  </Svg>
)

export const IconeCopiar = (p) => (
  <Svg strokeWidth="2.200" {...p}>
    <rect x="9" y="8" width="11" height="13" rx="2" />
    <path d="M15 8V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
  </Svg>
)

export const IconeLixeira = (p) => (
  <Svg strokeWidth="2.200" {...p}>
    <path d="M3.500 6.500h17M9 6.500V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2.500M6 6.500l.9 12.600a2 2 0 0 0 2 1.900h6.200a2 2 0 0 0 2-1.900L18 6.500M10 11l4 4M14 11l-4 4" />
  </Svg>
)

export const IconeExportar = (p) => (
  <Svg strokeWidth="2.400" {...p}>
    <path d="M10 4.500H4.500v15h15V14M13.500 4.500h6v6M19.500 4.500L10.500 13.500" />
  </Svg>
)

export const IconePreview = (p) => (
  <Svg strokeWidth="2.200" {...p}>
    <rect x="3" y="4" width="18" height="16" rx="1.500" />
    <path {...cheio} d="M12 8.500c-2.800 0-4.800 2-5.500 3.500.7 1.500 2.700 3.500 5.500 3.500s4.800-2 5.500-3.500c-.7-1.500-2.700-3.500-5.500-3.500Zm0 5.200a1.700 1.700 0 1 1 0-3.400 1.700 1.700 0 0 1 0 3.400Z" />
  </Svg>
)

export const IconePlanejar = (p) => (
  <Svg strokeWidth="2.200" {...p}>
    <rect x="3.500" y="5" width="17" height="16" rx="2" />
    <path d="M8 3v4M16 3v4M3.500 10h17M12 12.700v5.600M9.200 15.500h5.600" />
  </Svg>
)

/* ---------- lançamentos ---------- */

export const IconeSetaCima = (p) => (
  <Svg strokeWidth="1.600" stroke="var(--cor-verde)" {...p}>
    <path d="M12 21V3.500M6 9.500l6-6 6 6" />
  </Svg>
)

export const IconeSetaBaixo = (p) => (
  <Svg strokeWidth="1.600" stroke="var(--cor-vermelho)" {...p}>
    <path d="M12 3v17.500M6 14.500l6 6 6-6" />
  </Svg>
)

export const IconeSetaAmbos = (p) => (
  <Svg strokeWidth="1.600" stroke="var(--cor-roxo)" {...p}>
    <path d="M3 8.500h17.500M16 4l4.500 4.500L16 13M21 15.500H3.500M8 11l-4.500 4.500L8 20" />
  </Svg>
)

// três divisas laranja, usadas no botão de abrir um item da listagem
export const IconeDivisas = (p) => (
  <Svg strokeWidth="3" stroke="var(--cor-laranja)" {...p}>
    <path opacity=".45" d="M3 5l6 7-6 7" />
    <path opacity=".7" d="M9 5l6 7-6 7" />
    <path d="M15 5l6 7-6 7" />
  </Svg>
)

/* ---------- receita, despesa e transferência (moeda + setas) ---------- */

function Moeda() {
  return (
    <>
      <circle cx="13" cy="14" r="11" />
      <path
        strokeWidth="1.900"
        d="M16.300 10.900c-.6-1.200-1.800-1.900-3.300-1.900-1.900 0-3.200 1-3.200 2.500 0 1.600 1.300 2.300 3.300 2.600 2 .4 3.300 1.100 3.300 2.800 0 1.500-1.400 2.600-3.300 2.600-1.600 0-2.800-.7-3.500-1.900M13 7.200v13.600"
      />
    </>
  )
}

const moeda = { caixa: '0 0 38 28', strokeWidth: '2.200' }

export const IconeReceita = (p) => (
  <Svg {...moeda} {...p}>
    <Moeda />
    <path d="M32 23V6M28 10l4-4.500 4 4.500" />
  </Svg>
)

export const IconeDespesa = (p) => (
  <Svg {...moeda} {...p}>
    <Moeda />
    <path d="M32 5v17M28 18l4 4.500 4-4.500" />
  </Svg>
)

export const IconeTransferencia = (p) => (
  <Svg {...moeda} {...p}>
    <Moeda />
    <path d="M27.500 10h8.500M33 7l3 3-3 3M36 18h-8.500M30.500 15l-3 3 3 3" />
  </Svg>
)
