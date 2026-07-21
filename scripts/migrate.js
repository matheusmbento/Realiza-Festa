const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) acc[match[1].trim()] = match[2].trim();
  return acc;
}, {});
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabase
    .from('eventos')
    .update({ status: 'confirmado' })
    .in('status', ['orcamento', 'sinal_recebido', 'preparacao', 'montagem'])
    .select();
  
  if (error) console.error('Error updating:', error);
  else console.log('Updated events:', data?.length);
}

run();
