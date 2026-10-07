import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const TABLES = [
  'clients',
  'packages',
  'events',
  'financial_transactions',
  'materials',
  'material_movements',
  'contracts',
] as const;

async function getBackupData() {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error('Usuário não autenticado.');
  }

  const { data: membership, error: membershipError } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', authData.user.id)
    .eq('active', true)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership?.company_id) throw new Error('Empresa não encontrada para este usuário.');

  const companyId = membership.company_id as string;

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();

  if (companyError) throw companyError;

  const entries = await Promise.all(
    TABLES.map(async (table) => {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return [table, data ?? []] as const;
    }),
  );

  return {
    schema_version: 1,
    exported_at: new Date().toISOString(),
    company,
    data: Object.fromEntries(entries),
  };
}

function csvCell(value: unknown) {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(backup: Awaited<ReturnType<typeof getBackupData>>) {
  const rows = [['tipo', 'id', 'data_criacao', 'dados_json']];

  for (const [table, records] of Object.entries(backup.data)) {
    for (const record of records as Record<string, unknown>[]) {
      rows.push([
        table,
        String(record.id ?? ''),
        String(record.created_at ?? ''),
        JSON.stringify(record),
      ]);
    }
  }

  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(';')).join('\r\n');
}

export async function GET(request: Request) {
  try {
    const backup = await getBackupData();
    const format = new URL(request.url).searchParams.get('format') === 'csv' ? 'csv' : 'json';

    if (format === 'csv') {
      const body = toCsv(backup);
      return new NextResponse(body, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="tia-sol-exportacao.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json(backup, {
      headers: {
        'Content-Disposition': `attachment; filename="tia-sol-backup-${new Date().toISOString().slice(0, 10)}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Não foi possível gerar o backup.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
