-- ============================================================
-- REALIZA FESTA — Schema Inicial
-- Execute no Supabase: SQL Editor > New Query > Cole e Run
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PERFIS DE USUÁRIO
-- ============================================================
CREATE TABLE perfis (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  telefone    TEXT,
  papel       TEXT NOT NULL DEFAULT 'operacional' CHECK (papel IN ('admin', 'operacional')),
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CATEGORIAS DE ESTOQUE
-- ============================================================
CREATE TABLE categorias_estoque (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome      TEXT NOT NULL,
  cor       TEXT NOT NULL DEFAULT '#FF6B9D',
  icone     TEXT NOT NULL DEFAULT 'package',
  ordem     INT DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias padrão
INSERT INTO categorias_estoque (nome, cor, icone, ordem) VALUES
  ('Painéis',        '#FF6B9D', 'layout-template', 1),
  ('Mesas e Pedestais', '#FFB400', 'circle-dot',   2),
  ('Tapetes',        '#7C3AED', 'square',          3),
  ('Decoração',      '#4ADE80', 'sparkles',        4),
  ('Iluminação',     '#FFB400', 'zap',             5),
  ('Bexigas',        '#FF6B9D', 'circle',          6),
  ('Infláveis',      '#7C3AED', 'wind',            7),
  ('Brinquedos',     '#4ADE80', 'gamepad-2',       8),
  ('Tecidos',        '#F87171', 'layers',          9),
  ('Outros',         '#8888AA', 'box',            10);

-- ============================================================
-- ESTOQUE
-- ============================================================
CREATE TABLE itens_estoque (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id  UUID REFERENCES categorias_estoque(id),
  nome          TEXT NOT NULL,
  descricao     TEXT,
  quantidade    INT NOT NULL DEFAULT 1,
  foto_url      TEXT,
  estado        TEXT DEFAULT 'disponivel' CHECK (estado IN ('disponivel','manutencao','baixado')),
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CLIENTES
-- ============================================================
CREATE TABLE clientes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome        TEXT NOT NULL,
  telefone    TEXT,
  email       TEXT,
  endereco    TEXT,
  cidade      TEXT,
  observacoes TEXT,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EVENTOS
-- ============================================================
CREATE TABLE eventos (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id          UUID REFERENCES clientes(id),
  nome                TEXT NOT NULL,
  tipo_evento         TEXT DEFAULT 'aniversario' CHECK (tipo_evento IN (
                        'aniversario','cha_revelacao','cha_fralda',
                        'casamento','formatura','corporativo','outro')),
  data_evento         DATE NOT NULL,
  hora_inicio         TIME,
  hora_montagem       TIME,
  local_nome          TEXT,
  local_endereco      TEXT,
  tema                TEXT,
  cores               TEXT[],
  tipo_entrega        TEXT DEFAULT 'leva_monta' CHECK (tipo_entrega IN ('leva_monta','leva_sem_monta','busca_cliente')),
  
  -- Status integrado ao financeiro
  status              TEXT DEFAULT 'orcamento' CHECK (status IN (
                        'orcamento','confirmado','sinal_recebido',
                        'preparacao','montagem','concluido','cancelado')),
  
  -- Financeiro integrado
  valor_total         NUMERIC(10,2) DEFAULT 0,
  valor_sinal         NUMERIC(10,2) DEFAULT 0,
  sinal_recebido      BOOLEAN DEFAULT FALSE,
  data_sinal          DATE,
  pagamento_final     BOOLEAN DEFAULT FALSE,
  data_pagamento_final DATE,
  forma_pagamento     TEXT DEFAULT 'pix' CHECK (forma_pagamento IN ('pix','dinheiro','cartao','transferencia')),
  
  observacoes         TEXT,
  fotos_inspiracao    TEXT[],
  criado_em           TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ALOCAÇÕES DE ITENS POR EVENTO
-- ============================================================
CREATE TABLE alocacoes_evento (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento_id       UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  item_id         UUID NOT NULL REFERENCES itens_estoque(id),
  quantidade      INT NOT NULL DEFAULT 1,
  confirmado      BOOLEAN DEFAULT FALSE,
  observacao      TEXT,
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CHECKLIST DO EVENTO
-- ============================================================
CREATE TABLE checklist_evento (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evento_id   UUID NOT NULL REFERENCES eventos(id) ON DELETE CASCADE,
  descricao   TEXT NOT NULL,
  concluido   BOOLEAN DEFAULT FALSE,
  prazo       TIMESTAMPTZ,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FINANCEIRO — LANÇAMENTOS
-- ============================================================
CREATE TABLE lancamentos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo        TEXT NOT NULL CHECK (tipo IN ('entrada','saida')),
  valor       NUMERIC(10,2) NOT NULL,
  descricao   TEXT NOT NULL,
  categoria   TEXT DEFAULT 'outros' CHECK (categoria IN (
                'evento_sinal','evento_final','material','frete',
                'marketing','manutencao','outros')),
  evento_id   UUID REFERENCES eventos(id),
  data        DATE NOT NULL DEFAULT CURRENT_DATE,
  comprovante_url TEXT,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CRM — LEADS / OPORTUNIDADES (antecipação de demanda)
-- ============================================================
CREATE TABLE leads (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id      UUID REFERENCES clientes(id),
  evento_origem_id UUID REFERENCES eventos(id),
  tipo_sugerido   TEXT CHECK (tipo_sugerido IN (
                    'aniversario','cha_revelacao','cha_fralda',
                    'casamento','formatura','corporativo','outro')),
  data_estimada   DATE,
  descricao       TEXT,
  status          TEXT DEFAULT 'aberto' CHECK (status IN ('aberto','contatado','convertido','ignorado')),
  criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS — atualizar updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.atualizado_em = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_eventos_updated
  BEFORE UPDATE ON eventos
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trg_estoque_updated
  BEFORE UPDATE ON itens_estoque
  FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

-- ============================================================
-- TRIGGER — lançamento automático quando sinal/final são registrados
-- ============================================================
CREATE OR REPLACE FUNCTION lancar_pagamento_evento()
RETURNS TRIGGER AS $$
BEGIN
  -- Sinal recebido pela primeira vez
  IF NEW.sinal_recebido = TRUE AND OLD.sinal_recebido = FALSE THEN
    INSERT INTO lancamentos (tipo, valor, descricao, categoria, evento_id, data)
    VALUES (
      'entrada',
      NEW.valor_sinal,
      'Sinal recebido — ' || NEW.nome,
      'evento_sinal',
      NEW.id,
      COALESCE(NEW.data_sinal, CURRENT_DATE)
    );
  END IF;
  
  -- Pagamento final recebido pela primeira vez
  IF NEW.pagamento_final = TRUE AND OLD.pagamento_final = FALSE THEN
    INSERT INTO lancamentos (tipo, valor, descricao, categoria, evento_id, data)
    VALUES (
      'entrada',
      NEW.valor_total - NEW.valor_sinal,
      'Pagamento final — ' || NEW.nome,
      'evento_final',
      NEW.id,
      COALESCE(NEW.data_pagamento_final, CURRENT_DATE)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lancamento_pagamento
  AFTER UPDATE ON eventos
  FOR EACH ROW EXECUTE FUNCTION lancar_pagamento_evento();

-- ============================================================
-- TRIGGER — criar lead automático de aniversário (1 ano depois)
-- ============================================================
CREATE OR REPLACE FUNCTION criar_lead_aniversario()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando evento de aniversário é concluído, criar lead para o próximo ano
  IF NEW.status = 'concluido' AND OLD.status != 'concluido'
     AND NEW.tipo_evento = 'aniversario' THEN
    INSERT INTO leads (cliente_id, evento_origem_id, tipo_sugerido, data_estimada, descricao)
    VALUES (
      NEW.cliente_id,
      NEW.id,
      'aniversario',
      NEW.data_evento + INTERVAL '1 year',
      'Aniversário do ano que vem — cliente da festa ' || NEW.nome
    );
  END IF;
  
  -- Chá revelação concluído → lead para festa do bebê (~8 meses)
  IF NEW.status = 'concluido' AND OLD.status != 'concluido'
     AND NEW.tipo_evento = 'cha_revelacao' THEN
    INSERT INTO leads (cliente_id, evento_origem_id, tipo_sugerido, data_estimada, descricao)
    VALUES (
      NEW.cliente_id,
      NEW.id,
      'cha_fralda',
      NEW.data_evento + INTERVAL '3 months',
      'Possível chá de fraldas — cliente do chá revelação ' || NEW.nome
    );
  END IF;
  
  -- Chá de fraldas → lead para aniversário de 1 ano do bebê
  IF NEW.status = 'concluido' AND OLD.status != 'concluido'
     AND NEW.tipo_evento = 'cha_fralda' THEN
    INSERT INTO leads (cliente_id, evento_origem_id, tipo_sugerido, data_estimada, descricao)
    VALUES (
      NEW.cliente_id,
      NEW.id,
      'aniversario',
      NEW.data_evento + INTERVAL '10 months',
      '1º aniversário do bebê — cliente do chá de fraldas ' || NEW.nome
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_lead_aniversario
  AFTER UPDATE ON eventos
  FOR EACH ROW EXECUTE FUNCTION criar_lead_aniversario();

-- ============================================================
-- RLS — Row Level Security (todos logados veem tudo)
-- ============================================================
ALTER TABLE perfis              ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_estoque  ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_estoque       ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE alocacoes_evento    ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_evento    ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads               ENABLE ROW LEVEL SECURITY;

-- Políticas: usuário autenticado tem acesso total
DO $$ 
DECLARE
  tabelas TEXT[] := ARRAY[
    'perfis','categorias_estoque','itens_estoque','clientes',
    'eventos','alocacoes_evento','checklist_evento','lancamentos','leads'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tabelas LOOP
    EXECUTE format('CREATE POLICY "acesso_autenticado_%s" ON %I FOR ALL TO authenticated USING (TRUE) WITH CHECK (TRUE)', t, t);
  END LOOP;
END $$;

-- ============================================================
-- ÍNDICES para performance
-- ============================================================
CREATE INDEX idx_eventos_data        ON eventos(data_evento);
CREATE INDEX idx_eventos_status      ON eventos(status);
CREATE INDEX idx_eventos_cliente     ON eventos(cliente_id);
CREATE INDEX idx_alocacoes_evento    ON alocacoes_evento(evento_id);
CREATE INDEX idx_lancamentos_data    ON lancamentos(data);
CREATE INDEX idx_lancamentos_evento  ON lancamentos(evento_id);
CREATE INDEX idx_leads_data          ON leads(data_estimada);
CREATE INDEX idx_leads_status        ON leads(status);
