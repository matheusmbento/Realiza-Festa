'use client'

import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'

export function SplashScreen() {
  const [show, setShow] = useState(false)
  const [fade, setFade] = useState(false)

  useEffect(() => {
    // Verifica se a splash já rodou nesta sessão (evita rodar em toda navegação)
    const hasShown = sessionStorage.getItem('splashShown')
    if (!hasShown) {
      setShow(true)
      sessionStorage.setItem('splashShown', 'true')

      // Dispara confetes Premium (nas cores do tema)
      const duration = 1500
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FF6B9D', '#FFB400', '#7C3AED']
        })
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FF6B9D', '#FFB400', '#7C3AED']
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      
      // Inicia a chuva após 200ms
      setTimeout(() => requestAnimationFrame(frame), 200)

      // Inicia o fade-out após 1.8 segundos
      setTimeout(() => setFade(true), 1800)

      // Remove do DOM após 2.3 segundos
      setTimeout(() => setShow(false), 2300)
    }
  }, [])

  if (!show) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ background: '#0F0F14' }}
    >
      <div className="relative w-40 h-40 flex items-center justify-center animate-float">
        {/* Fundo LED */}
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-60 animate-pulse"
          style={{ background: 'radial-gradient(circle, #FF6B9D, transparent 70%)' }}
        />
        {/* Logo */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Realiza Festa"
          className="relative z-10 w-32 h-32 object-contain filter drop-shadow-[0_0_15px_rgba(255,107,157,0.5)]"
        />
      </div>
      <h1
        className="font-display font-bold text-3xl mt-4 opacity-90 tracking-wider"
        style={{
          background: 'linear-gradient(90deg, #FF6B9D, #FFB400)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Realiza Festa
      </h1>
    </div>
  )
}
