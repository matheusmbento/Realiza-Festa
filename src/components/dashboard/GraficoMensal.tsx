'use client'

interface DadosMes {
  label: string
  receita: number
  custos: number
  lucro: number
}

interface Props {
  dados: DadosMes[]
}

export default function GraficoMensal({ dados }: Props) {
  if (!dados || dados.length === 0) return null

  const maxValor = Math.max(...dados.flatMap(d => [d.receita, d.custos, Math.abs(d.lucro)]), 1)

  // Dimensões do gráfico
  const W = 320
  const H = 180
  const padL = 50
  const padR = 15
  const padT = 15
  const padB = 30
  const areaW = W - padL - padR
  const areaH = H - padT - padB
  const yZero = padT + areaH

  function y(val: number) {
    return yZero - (Math.max(0, val) / maxValor) * areaH
  }

  function h(val: number) {
    return (Math.max(0, val) / maxValor) * areaH
  }

  // Linhas de grade (4 níveis)
  const grades = [0, 0.25, 0.5, 0.75, 1].map(p => ({
    y: padT + areaH * (1 - p),
    label: formatarCurto(maxValor * p),
  }))

  function formatarCurto(v: number): string {
    if (v >= 1000) return `${(v / 1000).toFixed(1).replace('.0', '')}k`
    return v.toFixed(0)
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: '#1A1A24', border: '1px solid #2A2A38' }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: '#E8E8F0' }}>
          Receita vs Custos
        </h3>
        <span className="text-xs" style={{ color: '#8888AA' }}>
          {'\u00DA'}ltimos {dados.length} meses
        </span>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#4ADE80' }} />
          <span className="text-[10px]" style={{ color: '#8888AA' }}>Receita</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#F87171' }} />
          <span className="text-[10px]" style={{ color: '#8888AA' }}>Custos</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#7C3AED' }} />
          <span className="text-[10px]" style={{ color: '#8888AA' }}>Lucro</span>
        </div>
      </div>

      {/* Gráfico SVG */}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }}>
        {/* Grid horizontal */}
        {grades.map((g, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={g.y} y2={g.y}
                  stroke="#2A2A38" strokeWidth={0.5} strokeDasharray={i > 0 ? '4 4' : undefined} />
            <text x={padL - 6} y={g.y + 3} textAnchor="end"
                  fill="#8888AA" fontSize={9} fontFamily="system-ui">
              {g.label}
            </text>
          </g>
        ))}

        {/* Barras */}
        {dados.map((d, i) => {
          const groupWidth = areaW / dados.length
          const cx = padL + groupWidth * i + groupWidth / 2
          const barW = 8
          const gap = 2

          return (
            <g key={`bar-${i}`}>
              {/* Receita */}
              <rect x={cx - barW * 1.5 - gap} y={y(d.receita)} width={barW} height={h(d.receita)} fill="#4ADE80" rx={2} />
              {/* Custos */}
              <rect x={cx - barW * 0.5} y={y(d.custos)} width={barW} height={h(d.custos)} fill="#F87171" rx={2} />
              {/* Lucro */}
              <rect x={cx + barW * 0.5 + gap} y={y(d.lucro)} width={barW} height={h(d.lucro)} fill="#7C3AED" rx={2} />

              {/* Label do mês */}
              <text x={cx} y={H - 5} textAnchor="middle" fill="#8888AA" fontSize={10} fontFamily="system-ui">
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Resumo do mês mais recente */}
      {dados.length > 0 && (() => {
        const ultimo = dados[dados.length - 1]
        return (
          <div className="flex items-center justify-around mt-3 pt-3 border-t" style={{ borderColor: '#2A2A38' }}>
            <div className="text-center">
              <p className="text-[10px] font-medium" style={{ color: '#8888AA' }}>Receita</p>
              <p className="text-xs font-bold" style={{ color: '#4ADE80' }}>R$ {formatarCurto(ultimo.receita)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-medium" style={{ color: '#8888AA' }}>Custos</p>
              <p className="text-xs font-bold" style={{ color: '#F87171' }}>R$ {formatarCurto(ultimo.custos)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-medium" style={{ color: '#8888AA' }}>Lucro</p>
              <p className="text-xs font-bold" style={{ color: '#7C3AED' }}>R$ {formatarCurto(ultimo.lucro)}</p>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
