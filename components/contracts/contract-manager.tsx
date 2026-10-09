'use client';

import { useMemo, useState } from 'react';
import { FileSignature, Pencil, Plus, Trash2, X, CheckCircle2, Copy, Eye, FileDown, MessageCircle } from 'lucide-react';
import type { Company, Client, Package } from '@/types/database';
import type { EventRecord } from '@/types/event';
import type { ContractRecord } from '@/types/contract';
import { contractSchema, type ContractInput } from '@/validators/contract';
import { createContract, deleteContract, updateContract } from '@/services/contracts';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';

type Props = {
  initialContracts: ContractRecord[];
  events: EventRecord[];
  clients: Client[];
  packages: Package[];
  company: Company | null;
};

const emptyForm: ContractInput = {
  event_id: null, client_id: null, package_id: null, status: 'rascunho',
  contractor_name: '', contractor_document: '', contractor_rg: '', contractor_address: '',
  contractor_phone: '', contractor_email: '', children_estimate: 0,
  event_date: '', start_time: '', end_time: '',
  event_location: '', event_location_type: '', team_size: 1, included_activities: [],
  included_equipment: [], total_amount: 0, deposit_amount: 0, deposit_date: '',
  balance_amount: 0, balance_due_date: '', payment_method: 'PIX', pix_key: '',
  additional_payment_terms: '', displacement_amount: 0, catering_required: false,
  image_authorized: false, additional_observations: '', contract_details: '',
};

const statusLabels = { rascunho: 'Rascunho', gerado: 'Gerado', enviado: 'Enviado', assinado: 'Assinado', cancelado: 'Cancelado' };

function cleanContractText(text: string) {
  return text
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\bN\?\\b/g, 'Nº')
    .replace(/(CLÁUSULA\\s+\\d+)\?/g, '$1ª')
    .replace(/(CLÁUSULA\\s+\\d+)º/g, '$1ª');
}

function encodePdfText(text: string) {
  const map: Record<string, number> = {
    '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84, '…': 0x85, '†': 0x86, '‡': 0x87,
    'ˆ': 0x88, '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c, 'Ž': 0x8e, '‘': 0x91,
    '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97, '˜': 0x98,
    '™': 0x99, 'š': 0x9a, '›': 0x9b, 'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
    'À': 0xc0, 'Á': 0xc1, 'Â': 0xc2, 'Ã': 0xc3, 'Ä': 0xc4, 'Å': 0xc5, 'Æ': 0xc6,
    'Ç': 0xc7, 'È': 0xc8, 'É': 0xc9, 'Ê': 0xca, 'Ë': 0xcb, 'Ì': 0xcc, 'Í': 0xcd,
    'Î': 0xce, 'Ï': 0xcf, 'Ð': 0xd0, 'Ñ': 0xd1, 'Ò': 0xd2, 'Ó': 0xd3, 'Ô': 0xd4,
    'Õ': 0xd5, 'Ö': 0xd6, 'Ø': 0xd8, 'Ù': 0xd9, 'Ú': 0xda, 'Û': 0xdb, 'Ü': 0xdc,
    'Ý': 0xdd, 'à': 0xe0, 'á': 0xe1, 'â': 0xe2, 'ã': 0xe3, 'ä': 0xe4, 'å': 0xe5,
    'æ': 0xe6, 'ç': 0xe7, 'è': 0xe8, 'é': 0xe9, 'ê': 0xea, 'ë': 0xeb, 'ì': 0xec,
    'í': 0xed, 'î': 0xee, 'ï': 0xef, 'ð': 0xf0, 'ñ': 0xf1, 'ò': 0xf2, 'ó': 0xf3,
    'ô': 0xf4, 'õ': 0xf5, 'ö': 0xf6, 'ø': 0xf8, 'ù': 0xf9, 'ú': 0xfa, 'û': 0xfb,
    'ü': 0xfc, 'ý': 0xfd, 'þ': 0xfe, 'ÿ': 0xff
  };
  return Array.from(text).map((char) => {
    const code = char.charCodeAt(0);
    const byte = code <= 0x7f ? code : map[char] ?? 0x3f;
    if (byte === 0x28 || byte === 0x29 || byte === 0x5c) return '\\\\' + byte.toString(8).padStart(3, '0');
    if (byte < 0x20 || byte > 0x7e) return '\\\\' + byte.toString(8).padStart(3, '0');
    return char;
  }).join('');
}

function createContractPdfBlob(text: string) {
  const normalized = cleanContractText(text).replace(/\r\n/g, '\n');
  const rawLines = normalized.split('\n');

  const isTitle = (line: string) => line.trim() === 'CONTRATO DE PRESTAÇÃO DE SERVIÇO DE RECREAÇÃO';
  const isHeading = (line: string) => {
    const value = line.trim();
    return value === 'IDENTIFICAÇÃO DAS PARTES CONTRATANTES'
      || /^CLÁUSULA \d+ª\s*[-–]/.test(value)
      || /^\d+\. (CONTRATANTE|CONTRATADA)$/.test(value);
  };

  const splitLabel = (line: string) => {
    const value = line.trim();
    const match = value.match(/^(•\s+[^:]+:|\d+\.\s+[^:]+:|SERVIÇO PRESTADO:|RECREAÇÃO INFANTIL ABRANGENDO:)(.*)$/);
    if (!match) return null;
    return { label: match[1], rest: match[2] };
  };

  const wrapLine = (line: string, maxWidth: number, fontSize = 9.5, bold = false) => {
    const trimmed = line.trim();
    if (!trimmed) return [''];
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      const fallbackChars = Math.max(20, Math.floor(maxWidth / (fontSize * 0.5)));
      const words = trimmed.split(/\s+/);
      const result: string[] = [];
      let current = '';
      for (const word of words) {
        const candidate = current ? current + ' ' + word : word;
        if (candidate.length > fallbackChars && current) {
          result.push(current);
          current = word;
        } else {
          current = candidate;
        }
      }
      if (current) result.push(current);
      return result;
    }

    context.font = (bold ? 'bold ' : '') + fontSize + 'px Helvetica, Arial, sans-serif';
    const words = trimmed.split(/\s+/);
    const result: string[] = [];
    let current = '';

    for (const word of words) {
      if (context.measureText(word).width > maxWidth) {
        if (current) {
          result.push(current);
          current = '';
        }
        let chunk = '';
        for (const char of word) {
          const candidate = chunk + char;
          if (context.measureText(candidate).width > maxWidth && chunk) {
            result.push(chunk);
            chunk = char;
          } else {
            chunk = candidate;
          }
        }
        if (chunk) current = chunk;
        continue;
      }

      const candidate = current ? current + ' ' + word : word;
      if (context.measureText(candidate).width > maxWidth && current) {
        result.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }

    if (current) result.push(current);
    return result;
  };

  const pdfTextWidth = (value: string, fontSize: number, bold = false) => {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return value.length * fontSize * 0.5;
    context.font = `${bold ? 'bold ' : ''}${fontSize}px Helvetica, Arial, sans-serif`;
    return context.measureText(value).width;
  };

  const styledLines: Array<{
    text: string;
    kind: 'title' | 'heading' | 'body' | 'label';
    label?: string;
    rest?: string;
  }> = [];

  rawLines.forEach((line) => {
    const value = line.trim();
    if (isTitle(value)) {
      styledLines.push({ text: value, kind: 'title' });
      return;
    }
    if (isHeading(value)) {
      styledLines.push({ text: value, kind: 'heading' });
      return;
    }

    const labeled = splitLabel(value);
    if (labeled) {
      const labelFontSize = 9.5;
      const pageTextWidth = 495;
      const labelWidth = pdfTextWidth(labeled.label, labelFontSize, true);
      const restWidth = Math.max(120, pageTextWidth - labelWidth - 2);
      const restLines = wrapLine(labeled.rest.trim(), restWidth, 9.5, false);

      if (!restLines.length || !labeled.rest.trim()) {
        styledLines.push({ text: value, kind: 'label', label: labeled.label, rest: '' });
        return;
      }
      styledLines.push({ text: value, kind: 'label', label: labeled.label, rest: restLines[0] });
      restLines.slice(1).forEach((item) => styledLines.push({ text: item, kind: 'body' }));
      return;
    }

    const wrapped = wrapLine(line, 495, 9.5, false);
    wrapped.forEach((item) => styledLines.push({ text: item, kind: 'body' }));
  });

  const pages: typeof styledLines[] = [];
  const linesPerPage = 45;
  for (let i = 0; i < styledLines.length; i += linesPerPage) {
    pages.push(styledLines.slice(i, i + linesPerPage));
  }
  if (!pages.length) pages.push([{ text: '', kind: 'body' }]);

  const objects: string[] = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [] /Count 0 >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ];

  const winAnsi: Record<string, number> = {
    'À':192,'Á':193,'Â':194,'Ã':195,'Ä':196,'Å':197,'Ç':199,'È':200,'É':201,'Ê':202,'Ë':203,
    'Ì':204,'Í':205,'Î':206,'Ï':207,'Ñ':209,'Ò':210,'Ó':211,'Ô':212,'Õ':213,'Ö':214,
    'Ù':217,'Ú':218,'Û':219,'Ü':220,'Ý':221,'à':224,'á':225,'â':226,'ã':227,'ä':228,
    'å':229,'ç':231,'è':232,'é':233,'ê':234,'ë':235,'ì':236,'í':237,'î':238,'ï':239,
    'ñ':241,'ò':242,'ó':243,'ô':244,'õ':245,'ö':246,'ù':249,'ú':250,'û':251,'ü':252,
    'ý':253,'€':128,'‚':130,'„':132,'…':133,'†':134,'‡':135,'‰':137,'Š':138,'‹':139,
    'Œ':140,'Ž':142,'‘':145,'’':146,'“':147,'”':148,'•':149,'–':150,'—':151,'™':153,
    'š':154,'›':155,'œ':156,'ž':158,'Ÿ':159,'ª':170,'º':186
  };

  const toBytes = (value: string) => {
    const bytes: number[] = [];
    for (const char of value) {
      const code = char.charCodeAt(0);
      bytes.push(code <= 127 ? code : (winAnsi[char] ?? 63));
    }
    return new Uint8Array(bytes);
  };

  const escapePdf = (value: string) => {
    let result = '';
    for (const byte of toBytes(value)) {
      if (byte === 40 || byte === 41 || byte === 92) result += String.fromCharCode(92) + byte.toString(8).padStart(3, '0');
      else if (byte < 32 || byte > 126) result += String.fromCharCode(92) + byte.toString(8).padStart(3, '0');
      else result += String.fromCharCode(byte);
    }
    return result;
  };

  const pageIds: number[] = [];
  pages.forEach((pageLines) => {
    const commands = ['BT'];
    let y = 790;

    pageLines.forEach((line) => {
      const isTitleLine = line.kind === 'title';
      const isHeadingLine = line.kind === 'heading';
      const isLabelLine = line.kind === 'label';
      const fontSize = isTitleLine ? 15 : isHeadingLine ? 11 : 9.5;
      const leading = isTitleLine ? 20 : isHeadingLine ? 16 : 13;

      commands.push(`1 0 0 1 50 ${y} Tm`);

      if (isTitleLine || isHeadingLine) {
        commands.push(`/F2 ${fontSize} Tf`);
        commands.push('(' + escapePdf(line.text) + ') Tj');
      } else if (isLabelLine && line.label !== undefined) {
        commands.push(`/F2 ${fontSize} Tf`);
        commands.push('(' + escapePdf(line.label) + ') Tj');

        const labelWidth = pdfTextWidth(line.label, fontSize, true);
        commands.push(`${labelWidth.toFixed(2)} 0 Td`);
        commands.push(`/F1 ${fontSize} Tf`);
        if (line.rest) commands.push('(' + escapePdf(' ' + line.rest) + ') Tj');
      } else {
        commands.push(`/F1 ${fontSize} Tf`);
        commands.push('(' + escapePdf(line.text) + ') Tj');
      }

      y -= leading;
    });

    commands.push('ET');

    const content = commands.join('\n');
    const contentId = objects.length + 1;
    objects.push('<< /Length ' + toBytes(content).length + ' >>\nstream\n' + content + '\nendstream');
    const pageId = objects.length + 1;
    objects.push(
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ' +
      '/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> ' +
      '/Contents ' + contentId + ' 0 R >>'
    );
    pageIds.push(pageId);
  });

  objects[1] = '<< /Type /Pages /Kids [' + pageIds.map((id) => id + ' 0 R').join(' ') + '] /Count ' + pageIds.length + ' >>';

  const chunks: Uint8Array[] = [];
  const header = toBytes('%PDF-1.4\n%\\xE2\\xE3\\xCF\\xD3\n');
  chunks.push(header);
  let offset = header.length;
  const offsets: number[] = [0];

  const push = (value: string) => {
    const bytes = toBytes(value);
    chunks.push(bytes);
    offset += bytes.length;
  };

  objects.forEach((object, index) => {
    offsets.push(offset);
    push((index + 1) + ' 0 obj\n' + object + '\nendobj\n');
  });

  const xrefOffset = offset;
  push('xref\n0 ' + (objects.length + 1) + '\n0000000000 65535 f \n');
  for (let i = 1; i < offsets.length; i++) {
    push(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
  }
  push('trailer\n<< /Size ' + (objects.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xrefOffset + '\n%%EOF\n');

  return new Blob(
    chunks.map((chunk) => new Uint8Array(chunk).slice().buffer),
    { type: 'application/pdf' }
  );
}
function downloadContractPdf(contract: ContractRecord) {
  const blob = createContractPdfBlob(contract.generated_text || '');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `contrato-${String(contract.contract_number).padStart(3, '0')}-${contract.contract_year}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}

async function whatsappContract(contract: ContractRecord) {
  const blob = createContractPdfBlob(contract.generated_text || '');
  const file = new File([blob], `contrato-${String(contract.contract_number).padStart(3, '0')}-${contract.contract_year}.pdf`, { type: 'application/pdf' });
  const message = `Olá, ${contract.contractor_name}! Segue o contrato de prestação de serviço da Tia Sol para conferência e assinatura.`;
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share({ files: [file], text: message, title: 'Contrato Tia Sol' });
      return;
    }
  } catch {
    // O compartilhamento pode ser cancelado pelo usuário.
    return;
  }
  const phone = (contract.contractor_phone || '').replace(/\\D/g, '');
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message + ' O PDF foi baixado para anexar à conversa.')}`;
  downloadContractPdf(contract);
  window.open(url, '_blank', 'noopener,noreferrer');
}

function money(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function dateLabel(value?: string | null) {
  if (!value) return 'não informado';
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value + 'T12:00:00'));
}

function companyName(_company: Company | null) {
  return 'TIA SOL & CIA';
}

function isContractHeading(line: string) {
  const value = line.trim();
  return value === 'CONTRATO DE PRESTAÇÃO DE SERVIÇO DE RECREAÇÃO'
    || value === 'IDENTIFICAÇÃO DAS PARTES CONTRATANTES'
    || /^CLÁUSULA\s+\d+ª\s*[–-]\s*/.test(value)
    || /^\\d+\\. (CONTRATANTE|CONTRATADA)$/.test(value);
}

function ContractPreview({ text }: { text: string }) {
  return (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white p-6 text-[14px] leading-7 text-slate-700 shadow-sm">
      {cleanContractText(text).split('\n').map((line, index) => {
        const value = line.trim();
        if (!value) return <div key={index} className="h-3" />;
        if (isContractHeading(value)) {
          return <div key={index} className="mt-5 border-b-2 border-slate-200 pb-2 text-[14px] font-extrabold uppercase tracking-wide text-slate-950">{value}</div>;
        }
        if (/^• /.test(value)) {
          const content = value.slice(2);
          const separator = content.indexOf(':');
          if (separator >= 0) {
            const label = content.slice(0, separator);
            const rest = content.slice(separator + 1);
            return <div key={index} className="pl-1"><strong className="font-bold text-slate-950">{label}:</strong>{rest ? ` ${rest.trim()}` : ''}</div>;
          }
          return <div key={index} className="pl-1">{content}</div>;
        }
        if (/^\d+\. /.test(value)) {
          const separator = value.indexOf(':');
          if (separator >= 0) {
            const label = value.slice(0, separator + 1);
            const rest = value.slice(separator + 1);
            return <div key={index} className="pl-2"><strong className="font-bold text-slate-950">{label}</strong>{rest ? ` ${rest.trim()}` : ''}</div>;
          }
          return <div key={index} className="pl-2">{value}</div>;
        }
        if (/^(SERVIÇO PRESTADO|RECREAÇÃO INFANTIL ABRANGENDO):/.test(value)) {
          const separator = value.indexOf(':');
          const label = value.slice(0, separator + 1);
          const rest = value.slice(separator + 1);
          return <div key={index} className="mt-2 pl-1"><strong className="font-bold text-slate-950">{label}</strong>{rest ? ` ${rest.trim()}` : ''}</div>;
        }
        return <p key={index}>{value}</p>;
      })}
    </div>
  );
}
function buildContractText(form: ContractInput, number: string, company: Company | null, packageName?: string | null) {
  const name = 'TIA SOL & CIA';
  const responsible = 'LARISSA GARCIA RIBEIRO DE ALMEIDA';
  const cnpj = '57.195.397/0001-31';
  const companyAddress = 'AV. NOSSA SENHORA DA PIEDADE, 167 — AARÃO REIS';
  const companyCityState = '';
  const activities = form.included_activities.length
    ? form.included_activities
        .flatMap((item) => cleanContractText(item).split('\n'))
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item, index) => `${index + 1}. ${item}`)
        .join('\n')
    : '1. Conforme atividades do pacote contratado.';
  const total = Number(form.total_amount) || 0;
  const date = dateLabel(form.event_date);
  const time = form.start_time && form.end_time
    ? `às ${form.start_time}, com encerramento às ${form.end_time} (${Math.max(0, (Number(form.end_time.split(':')[0]) * 60 + Number(form.end_time.split(':')[1] || 0)) - (Number(form.start_time.split(':')[0]) * 60 + Number(form.start_time.split(':')[1] || 0))) / 60}h de duração)`
    : `às ${form.start_time || 'horário não informado'}`;
  const today = new Intl.DateTimeFormat('pt-BR').format(new Date());

  return `CONTRATO DE PRESTAÇÃO DE SERVIÇO DE RECREAÇÃO

IDENTIFICAÇÃO DAS PARTES CONTRATANTES

1. CONTRATANTE
• NOME: ${form.contractor_name || 'não informado'}
• DOCUMENTOS: CPF/CNPJ Nº ${form.contractor_document || 'não informado'}
• RG: ${form.contractor_rg || 'não informado'}
• ENDEREÇO: ${form.contractor_address || 'não informado'}
• TELEFONE: ${form.contractor_phone || 'não informado'}
• E-MAIL: ${form.contractor_email || 'não informado'}

2. CONTRATADA
• NOME: ${name} (${responsible})
• ENDEREÇO: ${companyAddress}${companyCityState ? ` - ${companyCityState}` : ''}
• CNPJ: ${cnpj}

AS PARTES TÊM ENTRE SI JUSTO E CONTRATADO A PRESTAÇÃO DE SERVIÇOS DE RECREAÇÃO INFANTIL ABAIXO DESCRITA, COM SUAS CLÁUSULAS E CONDIÇÕES A SEGUIR.

CLÁUSULA 1ª - DO OBJETO

POR MEIO DESTE CONTRATO, A CONTRATADA SE COMPROMETE A PRESTAR À CONTRATANTE OS SEGUINTES SERVIÇOS:

SERVIÇO PRESTADO: ${packageName || 'RECREAÇÃO INFANTIL'}
RECREAÇÃO INFANTIL ABRANGENDO:
${activities}

CLÁUSULA 2ª - DA FESTA

• DATA E LOCAL: A FESTA OCORRERÁ NO DIA ${date} ${time}, NO ENDEREÇO: ${form.event_location || 'não informado'}.

• HORÁRIO DA RECREAÇÃO: A RECREAÇÃO TERÁ INÍCIO ÀS ${form.start_time || 'não informado'} E ENCERRARÁ ÀS ${form.end_time || 'não informado'}.

1. EM CASO DE ATRASO POR PARTE DO CONTRATANTE, A CONTRATADA RESERVA-SE O DIREITO DE ENCERRAR AS ATIVIDADES NO HORÁRIO PREVISTO.

2. AMPLIAÇÃO DE HORÁRIO: QUALQUER AMPLIAÇÃO DO HORÁRIO DEVERÁ SER ACORDADA COM A CONTRATADA, SUJEITA A TAXA EXTRA.

3. NÚMERO DE CRIANÇAS: ATÉ ${form.children_estimate || 'não informado'} CRIANÇAS PARTICIPARÃO.

CLÁUSULA 3ª - DAS OBRIGAÇÕES DO CONTRATANTE

1. DISPONIBILIDADE: O CONTRATANTE FORNECERÁ TODOS OS MEIOS NECESSÁRIOS PARA A EXECUÇÃO DOS SERVIÇOS, COMO ENERGIA ELÉTRICA, ILUMINAÇÃO E LOCAL ADEQUADO.

3. PAGAMENTO: O PAGAMENTO SERÁ EFETUADO CONFORME A CLÁUSULA 5ª.

5. ALIMENTAÇÃO: A CONTRATANTE COMPROMETE-SE A FORNECER ALIMENTAÇÃO ADEQUADA PARA OS FUNCIONÁRIOS DA CONTRATADA QUE ESTIVEREM DESEMPENHANDO SUAS FUNÇÕES DURANTE A REALIZAÇÃO DO EVENTO.

CLÁUSULA 4ª - DAS OBRIGAÇÕES DA CONTRATADA

1. INFORMAÇÕES: A CONTRATADA FORNECERÁ UMA CÓPIA DO CONTRATO COM TODAS AS ESPECIFICIDADES DO SERVIÇO.

2. EXECUÇÃO: A EQUIPE CONTRATADA EXECUTARÁ TODAS AS ATIVIDADES PROPOSTAS, RESSARCINDO O VALOR CORRESPONDENTE AO TEMPO DE ATIVIDADES NÃO EXECUTADAS, SALVO POR SOLICITAÇÃO EXPRESSA DO CONTRATANTE.

3. PONTUALIDADE: EM CASO DE ATRASO, A CONTRATADA COMPENSARÁ O TEMPO AO FINAL DA RECREAÇÃO.

4. PROFISSIONAIS: A CONTRATADA COMPROMETE-SE A FORNECER OS PROFISSIONAIS QUALIFICADOS E MATERIAIS NECESSÁRIOS PARA A EXECUÇÃO DOS SERVIÇOS.

CLÁUSULA 5ª – DA RETRIBUIÇÃO

EM RETRIBUIÇÃO PELOS SERVIÇOS PRESTADOS, A CONTRATADA RECEBERÁ UMA QUANTIA TOTAL DE ${money(total)}, ESPECIFICADOS:

1. PACOTE ${(packageName || 'CONTRATADO').replace(/^PACOTE\s+/i, '').toUpperCase()}: ${money(Math.max(0, total - Number(form.displacement_amount || 0)))}${form.additional_payment_terms ? `\n   ${form.additional_payment_terms}` : ''}
2. TAXA DE DESLOCAMENTO: ${money(Number(form.displacement_amount || 0))}

O VALOR TOTAL DO SERVIÇO CONTRATADO DEVERÁ ESTAR INTEGRALMENTE QUITADO ATÉ A DATA DE REALIZAÇÃO DO EVENTO, PODENDO O PAGAMENTO SER EFETUADO EM DUAS ETAPAS: ENTRADA E SALDO RESTANTE, RESPEITANDO-SE O PRAZO ESTABELECIDO NESTA CLÁUSULA.\n\nCLÁUSULA 6ª - DA RESCISÃO IMOTIVADA

1. DESISTÊNCIA: DESISTÊNCIA POR PARTE DO CONTRATANTE RESULTARÁ NA PERDA DO SINAL.

2. DESISTÊNCIA DA CONTRATADA: EM CASO DE DESISTÊNCIA DA CONTRATADA, O SINAL SERÁ RESSARCIDO EM DOBRO.

CLÁUSULA 7ª - DO USO DE IMAGEM

1. AUTORIZAÇÃO: O CONTRATANTE ${form.image_authorized ? 'AUTORIZA' : 'NÃO AUTORIZA'} A CONTRATADA A UTILIZAR IMAGENS E VÍDEOS DAS CRIANÇAS E DEMAIS CONVIDADOS DURANTE A FESTA, PARA FINS DE DIVULGAÇÃO E PROMOÇÃO DOS SERVIÇOS PRESTADOS, EM MÍDIAS IMPRESSAS E DIGITAIS.

2. DIREITOS DE USO: O CONTRATANTE ${form.image_authorized ? 'CONCEDE' : 'NÃO CONCEDE'} À CONTRATADA O DIREITO DE UTILIZAR AS IMAGENS, SEM NECESSIDADE DE COMPENSAÇÃO OU AUTORIZAÇÃO ADICIONAL, EM REDES SOCIAIS, WEBSITES E OUTROS MATERIAIS PROMOCIONAIS.

3. EXCEÇÃO: CASO ALGUM RESPONSÁVEL NÃO DESEJE QUE A IMAGEM DE SUA CRIANÇA SEJA UTILIZADA, DEVE NOTIFICAR A CONTRATADA POR ESCRITO ANTES DO INÍCIO DO EVENTO, PARA QUE MEDIDAS ADEQUADAS SEJAM TOMADAS.

CLÁUSULA 8ª - DO FORO

FICA DESDE JÁ ELEITO O FORO DA COMARCA DE ${company?.city || 'BELO HORIZONTE'} PARA SEREM RESOLVIDAS EVENTUAIS PENDÊNCIAS DECORRENTES DESTE CONTRATO.

JUSTO E ACORDADO O PRESENTE DOCUMENTO, CONTRATANTE E CONTRATADA CONCORDAM VIA CONTRATO ONLINE.

${name.toUpperCase()} — RESPONSÁVEL: ${responsible}

${form.contractor_name || 'CONTRATANTE'}

Documento gerado em ${today}.
`;
}
export function ContractManager({ initialContracts, events, clients, packages, company }: Props) {
  const [contracts, setContracts] = useState(initialContracts);
  const [editing, setEditing] = useState<ContractRecord | null>(null);
  const [form, setForm] = useState<ContractInput>(emptyForm);
  const [number, setNumber] = useState('001/' + new Date().getFullYear());
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const selectedPackage = useMemo(() => packages.find((item) => item.id === form.package_id), [packages, form.package_id]);

  function patch(values: Partial<ContractInput>) {
    setForm((current) => ({ ...current, ...values }));
  }

  function selectEvent(eventId: string) {
    const event = events.find((item) => item.id === eventId);
    if (!event) {
      patch({ event_id: null });
      return;
    }
    const client = clients.find((item) => item.id === event.client_id);
    const pack = packages.find((item) => item.id === event.package_id);
    patch({
      event_id: event.id,
      client_id: event.client_id,
      package_id: event.package_id,
      contractor_name: client?.name || '',
      contractor_document: client?.document || '',
      contractor_address: [client?.address, client?.city, client?.state].filter(Boolean).join(', '),
      contractor_phone: client?.whatsapp || client?.phone || '',
      contractor_email: client?.email || '',
      event_date: event.event_date,
      start_time: event.start_time.slice(0, 5),
      end_time: event.end_time.slice(0, 5),
      event_location: event.location || '',
      total_amount: event.total_amount || pack?.price || 0,
      displacement_amount: 0,
      balance_amount: Math.max(0, event.total_amount - event.received_amount),
      included_activities: pack?.activities || [],
    });
  }

  function selectPackage(packageId: string) {
    const pack = packages.find((item) => item.id === packageId);
    if (!pack) return;
    patch({
      package_id: pack.id,
      total_amount: pack.price > 0 ? pack.price + Number(form.displacement_amount || 0) : form.total_amount,
      included_activities: [...pack.activities],
      additional_payment_terms: pack.notes || '',
    });
  }

  function openCreate() {
    setEditing(null);
    setNumber('001/' + new Date().getFullYear());
    setForm({ ...emptyForm });
    setFeedback('');
    setPreview(false);
    setOpen(true);
  }

  function openEdit(contract: ContractRecord) {
    setEditing(contract);
    setNumber(String(contract.contract_number).padStart(3, '0') + '/' + contract.contract_year);
    setForm({
      event_id: contract.event_id, client_id: contract.client_id, package_id: contract.package_id, status: contract.status,
      contractor_name: contract.contractor_name, contractor_document: contract.contractor_document || '',
      contractor_rg: contract.contractor_rg || '', contractor_address: contract.contractor_address || '',
      contractor_phone: contract.contractor_phone || '', contractor_email: contract.contractor_email || '',
      children_estimate: contract.children_estimate || 0, event_date: contract.event_date || '',
      start_time: contract.start_time?.slice(0, 5) || '', end_time: contract.end_time?.slice(0, 5) || '',
      event_location: contract.event_location || '', event_location_type: contract.event_location_type || '',
      team_size: contract.team_size, included_activities: contract.included_activities || [],
      included_equipment: contract.included_equipment || [], total_amount: contract.total_amount,
      deposit_amount: contract.deposit_amount, displacement_amount: contract.displacement_amount || 0, deposit_date: contract.deposit_date || '',
      balance_amount: contract.balance_amount, balance_due_date: contract.balance_due_date || '',
      payment_method: contract.payment_method || 'PIX', pix_key: contract.pix_key || company?.pix_key || '',
      additional_payment_terms: contract.additional_payment_terms || '',
      catering_required: contract.catering_required, image_authorized: contract.image_authorized,
      additional_observations: contract.additional_observations || '', contract_details: contract.contract_details || '',
    });
    setFeedback('');
    setPreview(false);
    setOpen(true);
  }

  async function save() {
    const parsed = contractSchema.safeParse(form);
    if (!parsed.success) {
      setFeedback(parsed.error.issues[0]?.message || 'Revise os dados do contrato.');
      return;
    }
    setSaving(true);
    setFeedback('');
    try {
      const generated = buildContractText(parsed.data, number, company, packages.find((item) => item.id === parsed.data.package_id)?.name);
      const supabase = createSupabaseClient();
      if (editing) {
        const updated = await updateContract(supabase, editing.id, parsed.data, generated);
        setContracts((current) => current.map((item) => item.id === updated.id ? updated : item));
      } else {
        const created = await createContract(supabase, parsed.data, generated);
        setContracts((current) => [created, ...current]);
        setNumber(String(created.contract_number).padStart(3, '0') + '/' + created.contract_year);
      }
      setFeedback(editing ? 'Contrato atualizado.' : 'Contrato salvo.');
      setTimeout(() => setOpen(false), 500);
    } catch (error) {
      console.error('Erro ao salvar contrato:', error);
      const detail = error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Erro inesperado ao salvar.';
      setFeedback(`Não foi possível salvar o contrato: ${detail}`);
    } finally {
      setSaving(false);
    }
  }

  function openView(contract: ContractRecord) {
    setEditing(contract);
    setNumber(String(contract.contract_number).padStart(3, '0') + '/' + contract.contract_year);
    setForm({
      event_id: contract.event_id, client_id: contract.client_id, package_id: contract.package_id, status: contract.status,
      contractor_name: contract.contractor_name, contractor_document: contract.contractor_document || '',
      contractor_rg: contract.contractor_rg || '', contractor_address: contract.contractor_address || '',
      contractor_phone: contract.contractor_phone || '', contractor_email: contract.contractor_email || '',
      children_estimate: contract.children_estimate || 0, event_date: contract.event_date || '',
      start_time: contract.start_time?.slice(0, 5) || '', end_time: contract.end_time?.slice(0, 5) || '',
      event_location: contract.event_location || '', event_location_type: contract.event_location_type || '',
      team_size: contract.team_size, included_activities: contract.included_activities || [],
      included_equipment: contract.included_equipment || [], total_amount: contract.total_amount,
      deposit_amount: contract.deposit_amount, displacement_amount: contract.displacement_amount || 0, deposit_date: contract.deposit_date || '',
      balance_amount: contract.balance_amount, balance_due_date: contract.balance_due_date || '',
      payment_method: contract.payment_method || 'PIX', pix_key: contract.pix_key || company?.pix_key || '',
      additional_payment_terms: contract.additional_payment_terms || '',
      catering_required: contract.catering_required, image_authorized: contract.image_authorized,
      additional_observations: contract.additional_observations || '', contract_details: contract.contract_details || '',
    });
    setFeedback('');
    setPreview(true);
    setOpen(true);
  }

  async function remove(contract: ContractRecord) {
    if (!window.confirm(`Excluir o contrato ${String(contract.contract_number).padStart(3, '0')}/${contract.contract_year}?`)) return;
    try {
      await deleteContract(createSupabaseClient(), contract.id);
      setContracts((current) => current.filter((item) => item.id !== contract.id));
    } catch {
      setFeedback('Não foi possível excluir o contrato.');
    }
  }

  function addLine(field: 'included_activities' | 'included_equipment') {
    const value = window.prompt(field === 'included_activities' ? 'Nova atividade incluída:' : 'Novo equipamento/material incluído:');
    if (value?.trim()) patch({ [field]: [...form[field], value.trim()] });
  }

  function removeLine(field: 'included_activities' | 'included_equipment', index: number) {
    patch({ [field]: form[field].filter((_, itemIndex) => itemIndex !== index) });
  }

  const input = 'input mt-1';
  const select = 'input mt-1';
  const textarea = 'input mt-1 min-h-24 resize-y';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-pink-600">Documentos</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[var(--foreground)]">Contratos</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">Monte o contrato a partir do evento e do pacote, revise os campos e gere o texto completo para assinatura.</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700"><Plus size={18} /> Novo contrato</button>
      </div>

      <div className="rounded-2xl border border-pink-100 bg-pink-50 p-4 text-sm text-pink-900">
        <strong>Facilidade:</strong> selecione um evento para puxar cliente, data, horário e valor. Depois escolha ou troque o pacote para preencher automaticamente as atividades inclusas.
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-sm">
        {contracts.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-pink-50 text-pink-600"><FileSignature size={22} /></div>
            <h2 className="mt-4 text-lg font-semibold">Nenhum contrato cadastrado</h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">Crie o primeiro contrato usando um evento ou preenchendo os dados manualmente.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {contracts.map((contract) => (
              <div key={contract.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold">Contrato {String(contract.contract_number).padStart(3, '0')}/{contract.contract_year}</h2>
                    <span className="rounded-full bg-pink-50 px-2.5 py-1 text-[11px] font-semibold text-pink-700">{statusLabels[contract.status]}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{contract.contractor_name} · {dateLabel(contract.event_date)} · {money(contract.total_amount)}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{contract.package?.name || 'Sem pacote'}{contract.event_location ? ' · ' + contract.event_location : ''}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openView(contract)} title="Visualizar" className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--background)]"><Eye size={17} /></button>
                  <button onClick={() => downloadContractPdf(contract)} title="Gerar PDF" className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--background)]"><FileDown size={17} /></button>
                  <button onClick={() => whatsappContract(contract)} title="Enviar pelo WhatsApp" className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-green-50 hover:text-green-600"><MessageCircle size={17} /></button>
                  <button onClick={() => openEdit(contract)} title="Editar" className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--background)]"><Pencil size={17} /></button>
                  <button onClick={() => remove(contract)} title="Excluir" className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-red-50 hover:text-red-600"><Trash2 size={17} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-5">
          <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-6xl sm:rounded-3xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-pink-600">Contrato {number}</p><h2 className="mt-1 text-xl font-semibold text-slate-900">{editing ? 'Editar contrato' : 'Novo contrato'}</h2><p className="text-sm text-slate-500">Preencha os dados e revise a prévia antes de salvar.</p></div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19} /></button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
              <div className="space-y-5">
                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">1. Vincular ao evento e pacote</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label><span className="text-sm font-medium">Evento</span><select value={form.event_id || ''} onChange={(e) => selectEvent(e.target.value)} className={select}><option value="">Preenchimento manual</option>{events.filter((e) => e.status !== 'cancelado').map((e) => <option key={e.id} value={e.id}>{e.title} · {dateLabel(e.event_date)}</option>)}</select></label>
                    <label><span className="text-sm font-medium">Pacote</span><select value={form.package_id || ''} onChange={(e) => selectPackage(e.target.value)} className={select}><option value="">Selecione um pacote</option>{packages.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name}{p.price > 0 ? ` · ${money(p.price)}` : ''}</option>)}</select></label>
                  </div>
                  {selectedPackage && <div className="mt-3 rounded-xl bg-pink-50 p-3 text-sm text-pink-900"><strong>{selectedPackage.name}</strong> · {selectedPackage.duration}h{selectedPackage.price > 0 ? ` · ${money(selectedPackage.price)}` : ' · Valor a definir'}<p className="mt-1 text-xs">Ao selecionar este pacote, as atividades abaixo são preenchidas automaticamente.</p></div>}
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">2. Dados do contratante</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2"><span className="text-sm font-medium">Nome completo *</span><input value={form.contractor_name} onChange={(e) => patch({ contractor_name: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">CPF/CNPJ</span><input value={form.contractor_document || ''} onChange={(e) => patch({ contractor_document: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">RG</span><input value={form.contractor_rg || ''} onChange={(e) => patch({ contractor_rg: e.target.value })} className={input} /></label>
                    <label className="sm:col-span-2"><span className="text-sm font-medium">Endereço residencial</span><input value={form.contractor_address || ''} onChange={(e) => patch({ contractor_address: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">Telefone/WhatsApp</span><input value={form.contractor_phone || ''} onChange={(e) => patch({ contractor_phone: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">E-mail</span><input type="email" value={form.contractor_email || ''} onChange={(e) => patch({ contractor_email: e.target.value })} className={input} /></label>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">3. Dados da festa</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label><span className="text-sm font-medium">Estimativa de crianças</span><input type="number" min="0" value={form.children_estimate || 0} onChange={(e) => patch({ children_estimate: Number(e.target.value) })} className={input} /></label>
                    <label><span className="text-sm font-medium">Data</span><input type="date" value={form.event_date || ''} onChange={(e) => patch({ event_date: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">Início</span><input type="time" value={form.start_time || ''} onChange={(e) => patch({ start_time: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">Término</span><input type="time" value={form.end_time || ''} onChange={(e) => patch({ end_time: e.target.value })} className={input} /></label>
                    <label className="sm:col-span-2"><span className="text-sm font-medium">Local do evento</span><input value={form.event_location || ''} onChange={(e) => patch({ event_location: e.target.value })} className={input} /></label>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between"><div><h3 className="font-semibold text-slate-900">4. Equipe, atividades e materiais</h3><p className="text-xs text-slate-500">O pacote preenche as atividades automaticamente, mas você pode ajustar.</p></div><input type="number" min="1" value={form.team_size} onChange={(e) => patch({ team_size: Number(e.target.value) })} className="input w-24" aria-label="Quantidade de recreadores" /></div>
                  <div className="mt-4 grid gap-5 md:grid-cols-2">
                    <div><div className="flex items-center justify-between"><span className="text-sm font-medium">Atividades inclusas</span><button type="button" onClick={() => addLine('included_activities')} className="text-xs font-semibold text-pink-600">+ adicionar</button></div><div className="mt-2 space-y-2">{form.included_activities.map((item, index) => <div key={index} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="flex-1">• {item}</span><button type="button" onClick={() => removeLine('included_activities', index)} className="text-slate-400 hover:text-red-500"><X size={14} /></button></div>)}</div></div>
                    <div><div className="flex items-center justify-between"><span className="text-sm font-medium">Equipamentos/materiais</span><button type="button" onClick={() => addLine('included_equipment')} className="text-xs font-semibold text-pink-600">+ adicionar</button></div><div className="mt-2 space-y-2">{form.included_equipment.map((item, index) => <div key={index} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm"><span className="flex-1">• {item}</span><button type="button" onClick={() => removeLine('included_equipment', index)} className="text-slate-400 hover:text-red-500"><X size={14} /></button></div>)}</div></div>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">5. Valores e pagamento</h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label><span className="text-sm font-medium">Valor do pacote</span><input type="number" step="0.01" value={Math.max(0, Number(form.total_amount) - Number(form.displacement_amount || 0))} onChange={(e) => patch({ total_amount: Number(e.target.value) + Number(form.displacement_amount || 0) })} className={input} /></label>
                    <label><span className="text-sm font-semibold text-pink-700">Valor de deslocamento (R$)</span><input type="number" step="0.01" min="0" value={form.displacement_amount} onChange={(e) => { const displacement = Number(e.target.value); patch({ displacement_amount: displacement, total_amount: Math.max(0, Number(form.total_amount) - Number(form.displacement_amount || 0)) + displacement }); }} className={input} /></label>
                    <label><span className="text-sm font-medium">Sinal / reserva</span><input type="number" step="0.01" value={form.deposit_amount} onChange={(e) => patch({ deposit_amount: Number(e.target.value), balance_amount: Math.max(0, Number(form.total_amount) - Number(e.target.value)) })} className={input} /></label>
                    <label><span className="text-sm font-medium">Data do sinal</span><input type="date" value={form.deposit_date || ''} onChange={(e) => patch({ deposit_date: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">Vencimento do saldo</span><input type="date" value={form.balance_due_date || ''} onChange={(e) => patch({ balance_due_date: e.target.value })} className={input} /></label>
                    <label><span className="text-sm font-medium">Saldo restante</span><input type="number" step="0.01" value={form.balance_amount} onChange={(e) => patch({ balance_amount: Number(e.target.value) })} className={input} /></label>
                    <label><span className="text-sm font-medium">Forma de pagamento</span><input value={form.payment_method || ''} onChange={(e) => patch({ payment_method: e.target.value })} className={input} /></label>
                    <label className="sm:col-span-2"><span className="text-sm font-medium">Chave PIX</span><input value={form.pix_key || company?.pix_key || ''} onChange={(e) => patch({ pix_key: e.target.value })} className={input} /></label>
                    <label className="sm:col-span-2"><span className="text-sm font-medium">Condições adicionais de pagamento</span><textarea value={form.additional_payment_terms || ''} onChange={(e) => patch({ additional_payment_terms: e.target.value })} className={textarea} /></label>
                  </div>
                </section>

                <section className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="font-semibold text-slate-900">6. Condições e observações</h3>
                  <div className="mt-4 space-y-4">
                    <label className="block"><span className="text-sm font-medium">Condições específicas do contrato</span><textarea value={form.contract_details || ''} onChange={(e) => patch({ contract_details: e.target.value })} placeholder="Ex.: regras específicas de cancelamento, remarcação ou contratação..." className={textarea} /></label>
                    <label className="block"><span className="text-sm font-medium">Observações adicionais</span><textarea value={form.additional_observations || ''} onChange={(e) => patch({ additional_observations: e.target.value })} placeholder="Tudo que foi combinado e precisa aparecer no contrato..." className={textarea + ' min-h-32'} /></label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm"><input type="checkbox" checked={form.catering_required} onChange={(e) => patch({ catering_required: e.target.checked })} /> Alimentação da equipe</label>
                      <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm"><input type="checkbox" checked={form.image_authorized} onChange={(e) => patch({ image_authorized: e.target.checked })} /> Autoriza uso de imagem</label>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="lg:sticky lg:top-0 lg:self-start">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between"><div><h3 className="font-semibold text-slate-900">Prévia do contrato</h3><p className="text-xs text-slate-500">O documento será gerado com estes dados.</p></div><button type="button" onClick={() => setPreview(!preview)} className="rounded-lg bg-white p-2 text-slate-600 shadow-sm"><Eye size={17} /></button></div>
                  <div className={preview ? 'mt-4 max-h-[65vh]' : 'mt-4 max-h-72'}>
                    <ContractPreview text={buildContractText(form, number, company, selectedPackage?.name)} />
                  </div>
                </div>
              </aside>
            </div>

            {feedback && <div className="mt-5 rounded-xl bg-pink-50 px-4 py-3 text-sm font-medium text-pink-800">{feedback}</div>}
            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
              <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Cancelar</button>
              <button type="button" onClick={() => navigator.clipboard?.writeText(buildContractText(form, number, company, selectedPackage?.name))} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"><Copy size={16} /> Copiar texto</button>
              <button type="button" disabled={saving} onClick={() => { void save(); }} className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{saving ? 'Salvando...' : <><CheckCircle2 size={17} /> Salvar contrato</>}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
