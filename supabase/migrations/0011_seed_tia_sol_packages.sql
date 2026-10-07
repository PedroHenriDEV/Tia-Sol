-- Catálogo inicial da Tia Sol.
-- O valor fica 0 até ser definido no cadastro; a interface exibe "Valor a definir".
-- Inserção idempotente para não duplicar os pacotes se a migration for executada novamente.

insert into public.packages (
  company_id,
  name,
  description,
  price,
  duration,
  activities,
  notes,
  active
)
select
  c.id,
  p.name,
  p.description,
  0,
  3,
  p.activities::jsonb,
  p.notes,
  true
from public.companies c
cross join (
  values
    (
      'Pacote Mercúrio',
      'A decolagem perfeita para a diversão começar!',
      '["Pintura facial/corporal ou tatuagens temporárias","Escultura de balões","Brincadeiras","Momento do picnic com alimentos fornecidos na festa (opcional)","Parabéns animado (dentro do horário da recreação)"]',
      null
    ),
    (
      'Pacote Estrela',
      'Para crianças que brilham com alegria!',
      '["Pintura facial/corporal ou tatuagens temporárias","Oficina de stressball","Brincadeiras","Caça ao tesouro","Momento do picnic com alimentos fornecidos na festa (opcional)","Parabéns animado (dentro do horário da recreação)"]',
      null
    ),
    (
      'Pacote Astro',
      'Perfeito para pequenos astros!',
      '["Pintura facial/corporal ou tatuagens temporárias","Oficina de pintura no gesso","Brincadeiras","Caça ao tesouro","Momento do picnic com alimentos fornecidos na festa (opcional)","Parabéns animado (dentro do horário da recreação)"]',
      null
    ),
    (
      'Pacote Galáxia',
      'Diversão de outro planeta!',
      '["Pintura facial/corporal ou tatuagens temporárias","Oficina de chaveiros personalizados ou pulseiras","Brincadeiras","Caça ao tesouro","Momento do picnic com alimentos fornecidos na festa (opcional)","Parabéns animado (dentro do horário da recreação)"]',
      null
    ),
    (
      'Pacote Universo',
      'Um super pacote para super crianças!',
      '["Pintura facial/corporal ou tatuagens temporárias","Oficina de slime","Brincadeiras","Caça ao tesouro","Momento do picnic com alimentos fornecidos na festa (opcional)","Parabéns animado (dentro do horário da recreação)"]',
      null
    ),
    (
      'Pacote Personalizado',
      'Você escolhe, a gente realiza!',
      '[]',
      'Cada evento é único. Escolha as atividades, defina o tempo do evento e monte a programação ideal com a ajuda da Tia Sol.'
    )
) as p(name, description, activities, notes)
where not exists (
  select 1
  from public.packages existing
  where existing.company_id = c.id
    and existing.name = p.name
);