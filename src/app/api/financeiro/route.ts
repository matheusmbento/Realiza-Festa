import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabase()
  const { searchParams } = new URL(req.url)
  const inicio = searchParams.get('inicio')
  const fim    = searchParams.get('fim')
  const tipo   = searchParams.get('tipo')

  let query = supabase
    .from('lancamentos')
    .select('*, evento:eventos(id, nome)')
    .is('deleted_at', null)
    .order('data', { ascending: false })

  if (inicio) query = query.gte('data', inicio)
  if (fim)    query = query.lte('data', fim)
  if (tipo)   query = query.eq('tipo', tipo)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const body = await req.json()

  const { data, error } = await supabase
    .from('lancamentos')
    .insert(body)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
