import { createServerSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Checklist
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const body = await req.json()

  const { data, error } = await supabase
    .from('checklist_evento')
    .insert(body)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabase()
  const { id, ...body } = await req.json()

  const { data, error } = await supabase
    .from('checklist_evento')
    .update(body)
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabase()
  const { id } = await req.json()

  const { error } = await supabase
    .from('checklist_evento')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
