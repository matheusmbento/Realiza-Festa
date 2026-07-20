import { createAdminSupabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const supabase = createAdminSupabase()
  const { email, senha, nome, papel } = await req.json()

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email, password: senha, email_confirm: true,
  })
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 })

  const { error: perfError } = await supabase.from('perfis').insert({
    id: authData.user.id, nome, papel: papel ?? 'operacional',
  })
  if (perfError) return NextResponse.json({ error: perfError.message }, { status: 500 })

  return NextResponse.json({ ok: true, id: authData.user.id }, { status: 201 })
}
