'use client';

import { useState } from 'react';
import { Download, FileArchive, LoaderCircle } from 'lucide-react';

export function BackupExport() {
  const [loading, setLoading] = useState<'csv' | 'json' | null>(null);
  const [message, setMessage] = useState('');

  async function download(format: 'csv' | 'json') {
    setLoading(format);
    setMessage('');

    try {
      const response = await fetch(`/api/backup?format=${format}`, { method: 'GET' });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Não foi possível gerar o arquivo.');
      }

      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') ?? '';
      const match = disposition.match(/filename="?([^"]+)"?/i);
      const filename = match?.[1] ?? `tia-sol-backup.${format}`;

      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);

      setMessage(format === 'json' ? 'Backup completo gerado com sucesso.' : 'Exportação gerada com sucesso.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível gerar o arquivo.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-soft)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
          <FileArchive size={19} />
        </span>
        <div>
          <h2 className="text-base font-semibold text-[var(--foreground)]">Exportação e backup</h2>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Exporte os dados da Tia Sol para guardar uma cópia local ou abrir os dados em uma planilha.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => download('csv')}
          disabled={loading !== null}
          className="button-secondary justify-center"
        >
          {loading === 'csv' ? <LoaderCircle size={17} className="animate-spin" /> : <Download size={17} />}
          Exportar dados (CSV)
        </button>

        <button
          type="button"
          onClick={() => download('json')}
          disabled={loading !== null}
          className="button-primary justify-center"
        >
          {loading === 'json' ? <LoaderCircle size={17} className="animate-spin" /> : <FileArchive size={17} />}
          Backup completo (JSON)
        </button>
      </div>

      {message && (
        <p role="status" className="mt-3 text-sm text-[var(--success)]">
          {message}
        </p>
      )}
    </section>
  );
}
