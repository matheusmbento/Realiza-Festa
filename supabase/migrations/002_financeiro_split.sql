-- Adicionar novas colunas na tabela eventos
ALTER TABLE eventos
ADD COLUMN valor_decoracao NUMERIC(10,2) DEFAULT 0,
ADD COLUMN valor_brinquedos NUMERIC(10,2) DEFAULT 0,
ADD COLUMN valor_frete NUMERIC(10,2) DEFAULT 0;

-- Para eventos antigos, vamos assumir que o valor total era tudo decoração
UPDATE eventos
SET valor_decoracao = valor_total
WHERE valor_decoracao = 0 AND valor_brinquedos = 0 AND valor_frete = 0;
