'use client';

import { useState } from 'react';

const PRESTADORA = {
  nome: 'TIA SOL & CIA (LARISSA GARCIA RIBEIRO DE ALMEIDA)',
  responsavel: 'LARISSA GARCIA RIBEIRO DE ALMEIDA',
  cnpj: '57.195.397/0001-31',
  endereco: 'AV. NOSSA SENHORA DA PIEDADE, 167 - AARÃO REIS',
};

type Dados = {
  contratante: string; cpf: string; rg: string; enderecoContratante: string;
  pacote: string; servicos: string; data: string; horaEvento: string; local: string;
  inicio: string; fim: string; criancas: string; valorPacote: string; deslocamento: string;
  valorTotal: string; pagamento: string; dataPagamento: string;
};

const INICIAL: Dados = {
  contratante: '', cpf: '', rg: '', enderecoContratante: '', pacote: 'PACOTE ASTRO',
  servicos: 'BRINCADEIRAS; TATUAGENS TEMPORÁRIAS; OFICINA DE PINTURA DE GESSO; CAÇA AO TESOURO; BOLHAS DE SABÃO; MOMENTO DO PICNIC COM ALIMENTOS FORNECIDOS NA FESTA; BRINDE: PARABÉNS ANIMADO (DENTRO DO HORÁRIO DA RECREAÇÃO) + PULSEIRAS DE IDENTIFICAÇÃO.',
  data: '', horaEvento: '', local: '', inicio: '', fim: '', criancas: '40',
  valorPacote: '', deslocamento: '', valorTotal: '', pagamento: '', dataPagamento: '',
};

function Field({ label, value, onChange, placeholder = '' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <label className="field"><span>{label}</span><input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} /></label>;
}

export default function NovoContratoPage() {
  const [d, setD] = useState<Dados>(INICIAL);
  const set = (key: keyof Dados) => (value: string) => setD(old => ({ ...old, [key]: value }));
  const duracao = d.inicio && d.fim ? `${d.inicio} às ${d.fim}` : '[HORÁRIO DE INÍCIO E TÉRMINO]';
  const itens = d.servicos.split(';').map(x => x.trim()).filter(Boolean);
  return (
    <main className="wrap">
      <div className="toolbar">
        <div><p className="eyebrow">TIA SOL & CIA · DOCUMENTOS</p><h1>Novo contrato de recreação</h1><p>Os dados da Tia Sol já estão salvos no modelo. Preencha os campos do cliente e do evento, confira e imprima/salve em PDF.</p></div>
        <button type="button" onClick={() => window.print()}>Imprimir / Salvar PDF</button>
      </div>
      <section className="form-card">
        <h2>1. Contratante</h2><div className="fields">
          <Field label="Nome completo" value={d.contratante} onChange={set('contratante')} />
          <Field label="CPF" value={d.cpf} onChange={set('cpf')} />
          <Field label="RG" value={d.rg} onChange={set('rg')} />
          <Field label="Endereço" value={d.enderecoContratante} onChange={set('enderecoContratante')} />
        </div>
        <h2>2. Dados do evento</h2><div className="fields">
          <Field label="Pacote / serviço" value={d.pacote} onChange={set('pacote')} />
          <Field label="Data (ex.: 16/08/2026)" value={d.data} onChange={set('data')} />
          <Field label="Horário de início da festa" value={d.horaEvento} onChange={set('horaEvento')} />
          <Field label="Local e endereço completo" value={d.local} onChange={set('local')} />
          <Field label="Início da recreação" value={d.inicio} onChange={set('inicio')} />
          <Field label="Término da recreação" value={d.fim} onChange={set('fim')} />
          <Field label="Número máximo de crianças" value={d.criancas} onChange={set('criancas')} />
        </div>
        <h2>3. Valores e pagamento</h2><div className="fields">
          <Field label="Valor do pacote (R$)" value={d.valorPacote} onChange={set('valorPacote')} />
          <Field label="Taxa de deslocamento (R$)" value={d.deslocamento} onChange={set('deslocamento')} />
          <Field label="Valor total (R$)" value={d.valorTotal} onChange={set('valorTotal')} />
          <Field label="Condição de pagamento" value={d.pagamento} onChange={set('pagamento')} placeholder="Ex.: entrada + saldo" />
          <Field label="Data do pagamento" value={d.dataPagamento} onChange={set('dataPagamento')} />
        </div>
        <label className="field full"><span>Atividades incluídas (separe cada atividade com ponto e vírgula)</span><textarea value={d.servicos} onChange={e => set('servicos')(e.target.value)} rows={4} /></label>
        <p className="hint">O texto das cláusulas é mantido conforme o modelo enviado. Antes de assinar, confira os dados e os valores preenchidos.</p>
      </section>

      <article className="contract">
        <section className="paper">
          <h2 className="doc-title">CONTRATO DE PRESTAÇÃO DE SERVIÇO DE<br />RECREAÇÃO</h2>
          <h3>IDENTIFICAÇÃO DAS PARTES CONTRATANTES</h3>
          <h4>1. CONTRATANTE</h4>
          <p>• NOME: {d.contratante || '[NOME DO CONTRATANTE]'}<br />• DOCUMENTOS: CPF Nº {d.cpf || '[CPF]'}<br />• RG: {d.rg || '[RG]'}<br />• ENDEREÇO: {d.enderecoContratante || '[ENDEREÇO DO CONTRATANTE]'}</p>
          <h4>2. CONTRATADA</h4>
          <p>• NOME: {PRESTADORA.nome}<br />• ENDEREÇO: {PRESTADORA.endereco}<br />• CNPJ: {PRESTADORA.cnpj}</p>
          <p>AS PARTES TÊM ENTRE SI JUSTO E CONTRATADO A PRESTAÇÃO DE SERVIÇOS DE RECREAÇÃO INFANTIL ABAIXO DESCRITA, COM SUAS CLÁUSULAS E CONDIÇÕES A SEGUIR.</p>
          <h3>CLÁUSULA 1ª - DO OBJETO</h3>
          <p>POR MEIO DESTE CONTRATO, A CONTRATADA SE COMPROMETE A PRESTAR À CONTRATANTE OS SEGUINTES SERVIÇOS:</p>
          <p>SERVIÇO PRESTADO: {d.pacote || '[PACOTE]'}, RECREAÇÃO INFANTIL ABRANGENDO:</p>
          <ol>{itens.map((item, i) => <li key={i}>{item}</li>)}</ol>
          <h3>CLÁUSULA 2ª - DA FESTA</h3>
          <p>• DATA E LOCAL: A FESTA OCORRERÁ NO DIA {d.data || '[DATA DO EVENTO]'}<br />• ÀS {d.horaEvento || '[HORÁRIO]'}, NO ENDEREÇO: {d.local || '[LOCAL E ENDEREÇO]'}<br />• HORÁRIO DA RECREAÇÃO: A RECREAÇÃO TERÁ INÍCIO ÀS {d.inicio || '[INÍCIO]'} E ENCERRARÁ ÀS {d.fim || '[TÉRMINO]'} ({duracao}).</p>
          <ol><li>EM CASO DE ATRASO POR PARTE DO CONTRATANTE, A CONTRATADA RESERVA-SE O DIREITO DE ENCERRAR AS ATIVIDADES NO HORÁRIO PREVISTO.</li><li>AMPLIAÇÃO DE HORÁRIO: QUALQUER AMPLIAÇÃO DO HORÁRIO DEVERÁ SER ACORDADA PREVIAMENTE COM A CONTRATADA, SUJEITA A TAXA EXTRA.</li><li>NÚMERO DE CRIANÇAS: ATÉ {d.criancas || '[NÚMERO]'} CRIANÇAS PARTICIPARÃO, DEVENDO SER INFORMADO À CONTRATADA COM 10 DIAS DE ANTECEDÊNCIA.</li></ol>
        </section>
        <section className="paper">
          <h3>CLÁUSULA 3ª - DAS OBRIGAÇÕES DO CONTRATANTE</h3>
          <ol><li>DISPONIBILIDADE: O CONTRATANTE FORNECERÁ TODOS OS MEIOS NECESSÁRIOS PARA A EXECUÇÃO DOS SERVIÇOS, COMO ENERGIA ELÉTRICA, ILUMINAÇÃO E LOCAL ADEQUADO.</li><li>COMUNICAÇÃO: EM EVENTOS EM CONDOMÍNIO, O CONTRATANTE INFORMARÁ ANTECIPADAMENTE À SEGURANÇA E PORTARIA SOBRE A CHEGADA DOS FUNCIONÁRIOS DA CONTRATADA.</li><li>PAGAMENTO: O PAGAMENTO SERÁ EFETUADO CONFORME A CLÁUSULA 5ª.</li><li>ALTERAÇÕES: QUALQUER ALTERAÇÃO NA DATA/HORÁRIO DA FESTA DEVE SER COMUNICADA COM NO MÍNIMO 15 DIAS DE ANTECEDÊNCIA.</li><li>ALIMENTAÇÃO: A CONTRATANTE COMPROMETE-SE A FORNECER ALIMENTAÇÃO ADEQUADA PARA OS FUNCIONÁRIOS DA CONTRATADA QUE ESTIVEREM DESEMPENHANDO SUAS FUNÇÕES DURANTE A REALIZAÇÃO DO EVENTO.</li></ol>
          <h3>CLÁUSULA 4ª - DAS OBRIGAÇÕES DA CONTRATADA</h3>
          <ol><li>INFORMAÇÕES: A CONTRATADA FORNECERÁ UMA CÓPIA DO CONTRATO COM TODAS AS ESPECIFICIDADES DO SERVIÇO.</li><li>EXECUÇÃO: A EQUIPE CONTRATADA EXECUTARÁ TODAS AS ATIVIDADES PROPOSTAS, RESSARCINDO O VALOR CORRESPONDENTE AO TEMPO DE ATIVIDADES NÃO EXECUTADAS, SALVO POR SOLICITAÇÃO EXPRESSA DO CONTRATANTE.</li><li>PONTUALIDADE: EM CASO DE ATRASO, A CONTRATADA COMPENSARÁ O TEMPO AO FINAL DA RECREAÇÃO.</li><li>PROFISSIONAIS: A CONTRATADA COMPROMETE-SE A FORNECER OS PROFISSIONAIS QUALIFICADOS E MATERIAIS NECESSÁRIOS PARA A EXECUÇÃO DOS SERVIÇOS.</li></ol>
          <h3>CLÁUSULA 5ª – DA RETRIBUIÇÃO</h3>
          <p>EM RETRIBUIÇÃO PELOS SERVIÇOS PRESTADOS, A CONTRATADA RECEBERÁ UMA QUANTIA TOTAL DE R$ {d.valorTotal || '[VALOR TOTAL]'}, ESPECIFICADOS:</p>
          <ol><li>{d.pacote || '[PACOTE]'} PARA ATÉ {d.criancas || '[NÚMERO]'} CRIANÇAS: R$ {d.valorPacote || '[VALOR DO PACOTE]'}</li><li>TAXA DE DESLOCAMENTO: R$ {d.deslocamento || '[VALOR DO DESLOCAMENTO]'}</li></ol>
          <p>O VALOR TOTAL DO SERVIÇO CONTRATADO DEVERÁ ESTAR INTEGRALMENTE QUITADO ATÉ A DATA DE REALIZAÇÃO DO EVENTO, PODENDO O PAGAMENTO SER EFETUADO EM DUAS ETAPAS: ENTRADA E SALDO RESTANTE, RESPEITANDO-SE O PRAZO ESTABELECIDO NESTA CLÁUSULA.</p>
          <p>CONDIÇÃO DE PAGAMENTO: {d.pagamento || '[CONDIÇÃO DE PAGAMENTO]'}{d.dataPagamento ? ` — DATA: ${d.dataPagamento}` : ''}.</p>
          <h3>CLÁUSULA 6ª - DA RESCISÃO IMOTIVADA</h3>
          <ol><li>DESISTÊNCIA: DESISTÊNCIA POR PARTE DO CONTRATANTE RESULTARÁ NA PERDA DO SINAL.</li><li>DESISTÊNCIA DA CONTRATADA: EM CASO DE DESISTÊNCIA DA CONTRATADA, O SINAL SERÁ RESSARCIDO EM DOBRO.</li></ol>
        </section>
        <section className="paper">
          <h3>CLÁUSULA 7ª - DO USO DE IMAGEM</h3>
          <ol><li>AUTORIZAÇÃO: O CONTRATANTE AUTORIZA A CONTRATADA A UTILIZAR IMAGENS E VÍDEOS DAS CRIANÇAS E DEMAIS CONVIDADOS DURANTE A FESTA, PARA FINS DE DIVULGAÇÃO E PROMOÇÃO DOS SERVIÇOS PRESTADOS, EM MÍDIAS IMPRESSAS E DIGITAIS.</li><li>DIREITOS DE USO: O CONTRATANTE CONCEDE À CONTRATADA O DIREITO DE UTILIZAR AS IMAGENS DE FORMA IRRESTRITA, SEM NECESSIDADE DE COMPENSAÇÃO OU AUTORIZAÇÃO ADICIONAL, EM REDES SOCIAIS, WEBSITES E OUTROS MATERIAIS PROMOCIONAIS.</li><li>EXCEÇÃO: CASO ALGUM RESPONSÁVEL NÃO DESEJE QUE A IMAGEM DE SUA CRIANÇA SEJA UTILIZADA, DEVE NOTIFICAR A CONTRATADA POR ESCRITO ANTES DO INÍCIO DO EVENTO, PARA QUE MEDIDAS ADEQUADAS SEJAM TOMADAS.</li></ol>
          <h3>CLÁUSULA 8ª - DO FORO</h3>
          <p>FICA DESDE JÁ ELEITO O FORO DA COMARCA DE BELO HORIZONTE PARA SEREM RESOLVIDAS EVENTUAIS PENDÊNCIAS DECORRENTES DESTE CONTRATO.</p>
          <p>JUSTO E ACORDADO O PRESENTE DOCUMENTO, CONTRATANTE E CONTRATADA CONCORDAM VIA CONTRATO ONLINE.</p>
          <div className="signatures"><p><strong>TIA SOL & CIA</strong><br />({PRESTADORA.responsavel})</p><p>________________________________________<br />{d.contratante || '[NOME DO CONTRATANTE]'}</p></div>
        </section>
      </article>
      <style jsx global>{`
        .wrap{max-width:1100px;margin:0 auto;padding:32px 20px 64px;color:#18212b;font-family:Arial,sans-serif}
        .toolbar{display:flex;gap:24px;align-items:center;justify-content:space-between;margin-bottom:24px}
        .toolbar h1{font-size:clamp(25px,4vw,36px);margin:6px 0;font-weight:750;letter-spacing:-.04em}
        .toolbar p{color:#66717c;line-height:1.5;max-width:680px}
        .eyebrow{font-size:11px;font-weight:700;letter-spacing:.15em;color:#d64e7b}
        .toolbar button{border:0;border-radius:10px;padding:14px 18px;background:#e85d86;color:#fff;font-weight:700;cursor:pointer;white-space:nowrap}
        .form-card{border:1px solid #e8e6e2;border-radius:16px;background:#fff;padding:22px;margin-bottom:32px}
        .form-card h2{font-size:16px;margin:10px 0 14px}
        .fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-bottom:22px}
        .field{display:flex;flex-direction:column;gap:6px;font-size:12px;font-weight:700;color:#56616b}
        .field input,.field textarea{font:inherit;font-weight:400;color:#18212b;border:1px solid #d8d6d1;border-radius:9px;padding:11px 12px;background:#fff;min-width:0}
        .field.full{margin:10px 0}
        .hint{font-size:12px;color:#66717c;margin-top:18px}
        .contract{max-width:800px;margin:0 auto}
        .paper{background:#fff;padding:48px 56px;margin:0 0 24px;box-shadow:0 2px 18px #0000000d;border:1px solid #e8e6e2;font-family:Arial,sans-serif;font-size:12px;line-height:1.45;color:#111;text-transform:uppercase;overflow-wrap:anywhere}
        .paper h2,.paper h3,.paper h4{font-size:12px;font-weight:700;margin:20px 0 10px;line-height:1.35}
        .paper .doc-title{text-align:center;font-size:15px;margin:0 0 22px}
        .paper h3{margin-top:20px}
        .paper p{margin:10px 0}
        .paper ol{padding-left:22px;margin:10px 0}
        .paper li{padding-left:2px;margin:5px 0}
        .signatures{display:flex;justify-content:space-between;gap:20px;margin-top:56px;text-align:center;align-items:flex-end}
        .signatures p{width:48%;font-size:11px}
        @media(max-width:650px){.wrap{padding:20px 12px 40px}.toolbar{align-items:flex-start;flex-direction:column}.fields{grid-template-columns:1fr}.form-card{padding:16px}.paper{padding:28px 22px;font-size:11px}.signatures{flex-direction:column;align-items:stretch}.signatures p{width:100%}}
        @media print{
          body{background:#fff!important}
          body *{visibility:hidden!important}
          .contract,.contract *{visibility:visible!important}
          .contract{position:absolute;left:0;top:0;width:100%;max-width:none;margin:0}
          .paper{box-shadow:none;border:0;margin:0;padding:12mm 14mm;min-height:270mm;page-break-after:always;break-after:page;font-size:10.5pt;line-height:1.38}
          .paper:last-child{page-break-after:auto;break-after:auto}
          .paper h2,.paper h3,.paper h4{font-size:10.5pt}
          @page{size:A4;margin:0}
        }
      `}</style>
    </main>
  );
}
