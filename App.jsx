import React, { useState, useEffect } from 'react';
import { Activity, User, Ruler, Dumbbell, Camera, FileText, Save, Download, Plus, Trash2, ChevronRight, ChevronLeft, TrendingUp, CheckCircle, Calendar, ArrowLeft, Heart, Target, Users, ClipboardList, Zap } from 'lucide-react';

// ===================================================================
// HELPERS GLOBAIS
// ===================================================================

const showVal = (v) => (v === 0 || v === undefined || v === null ? '' : v);

const statusInfo = {
  baixa: { label: 'BAIXA', color: '#10b981', bg: '#d1fae5' },
  media: { label: 'MÉDIA', color: '#f97316', bg: '#fff7ed' },
  alta: { label: 'ALTA', color: '#ef4444', bg: '#fee2e2' },
  sem_dado: { label: '—', color: '#94a3b8', bg: '#f1f5f9' },
};

const calcAssimetria = (dir, esq) => {
  const d = parseFloat(dir) || 0, e = parseFloat(esq) || 0;
  if (d === 0 && e === 0) return { diff: 0, perc: 0, status: 'sem_dado' };
  const maior = Math.max(d, e), menor = Math.min(d, e);
  const diff = maior - menor;
  const perc = maior > 0 ? ((diff / maior) * 100) : 0;
  let status;
  if (perc < 10) status = 'baixa';
  else if (perc < 20) status = 'media';
  else status = 'alta';
  return { diff: diff.toFixed(1), perc: perc.toFixed(1), status };
};

// Karvonen: FC alvo = ((220 - idade) - FCrep) × % + FCrep
const calcZonasKarvonen = (idade, fcRepouso) => {
  const i = parseFloat(idade) || 0;
  const fcRep = parseFloat(fcRepouso) || 0;
  if (!i || !fcRep) return null;
  const fcMax = 220 - i;
  const fcReserva = fcMax - fcRep;
  const zona = (perc) => Math.round((fcReserva * (perc / 100)) + fcRep);
  return {
    fcMax,
    fcRepouso: fcRep,
    fcReserva,
    zonas: [
      { nome: 'Z1 - Recuperação', faixa: '50-60%', min: zona(50), max: zona(60), color: '#94a3b8', desc: 'Aquecimento, recuperação ativa' },
      { nome: 'Z2 - Aeróbica Leve', faixa: '60-70%', min: zona(60), max: zona(70), color: '#10b981', desc: 'Resistência aeróbica, queima de gordura' },
      { nome: 'Z3 - Aeróbica', faixa: '70-80%', min: zona(70), max: zona(80), color: '#3b82f6', desc: 'Capacidade aeróbica, condicionamento' },
      { nome: 'Z4 - Anaeróbica', faixa: '80-90%', min: zona(80), max: zona(90), color: '#f97316', desc: 'Limiar anaeróbico, performance' },
      { nome: 'Z5 - Máxima', faixa: '90-100%', min: zona(90), max: zona(100), color: '#ef4444', desc: 'Esforço máximo, potência' },
    ],
  };
};

// RML Abdominal — Tabela ACSM (rep/min)
const classificaRMLAbdominal = (reps, idade, genero) => {
  const r = parseFloat(reps) || 0;
  const i = parseFloat(idade) || 0;
  if (!r || !i) return null;

  // Tabela ACSM simplificada
  const tabelas = {
    masculino: [
      { idadeMin: 15, idadeMax: 19, excelente: 48, bom: 42, medio: 38, regular: 35 },
      { idadeMin: 20, idadeMax: 29, excelente: 43, bom: 37, medio: 33, regular: 29 },
      { idadeMin: 30, idadeMax: 39, excelente: 36, bom: 31, medio: 27, regular: 22 },
      { idadeMin: 40, idadeMax: 49, excelente: 31, bom: 26, medio: 22, regular: 17 },
      { idadeMin: 50, idadeMax: 59, excelente: 26, bom: 22, medio: 18, regular: 13 },
      { idadeMin: 60, idadeMax: 99, excelente: 23, bom: 17, medio: 12, regular: 8 },
    ],
    feminina: [
      { idadeMin: 15, idadeMax: 19, excelente: 42, bom: 36, medio: 32, regular: 27 },
      { idadeMin: 20, idadeMax: 29, excelente: 36, bom: 31, medio: 25, regular: 21 },
      { idadeMin: 30, idadeMax: 39, excelente: 29, bom: 24, medio: 20, regular: 15 },
      { idadeMin: 40, idadeMax: 49, excelente: 25, bom: 20, medio: 15, regular: 10 },
      { idadeMin: 50, idadeMax: 59, excelente: 19, bom: 12, medio: 5, regular: 2 },
      { idadeMin: 60, idadeMax: 99, excelente: 16, bom: 12, medio: 4, regular: 0 },
    ],
  };

  const linha = tabelas[genero]?.find(l => i >= l.idadeMin && i <= l.idadeMax);
  if (!linha) return null;

  let label, color, bg;
  if (r >= linha.excelente) { label = 'Excelente'; color = '#10b981'; bg = '#d1fae5'; }
  else if (r >= linha.bom) { label = 'Bom'; color = '#3b82f6'; bg = '#dbeafe'; }
  else if (r >= linha.medio) { label = 'Médio'; color = '#eab308'; bg = '#fef3c7'; }
  else if (r >= linha.regular) { label = 'Regular'; color = '#f97316'; bg = '#ffedd5'; }
  else { label = 'Fraco'; color = '#ef4444'; bg = '#fee2e2'; }

  return { label, color, bg, referencia: `Faixa ${linha.idadeMin}-${linha.idadeMax} anos`, ideal: linha.excelente };
};

// Salto Vertical — Classificação por faixa etária (cm)
const classificaSaltoVertical = (cm, idade, genero) => {
  const v = parseFloat(cm) || 0;
  const i = parseFloat(idade) || 0;
  if (!v || !i) return null;

  // Tabelas adaptadas (Pollock & Wilmore)
  const refs = {
    masculino: [
      { idadeMin: 15, idadeMax: 19, excelente: 65, bom: 56, medio: 49, regular: 42 },
      { idadeMin: 20, idadeMax: 29, excelente: 70, bom: 60, medio: 50, regular: 41 },
      { idadeMin: 30, idadeMax: 39, excelente: 60, bom: 51, medio: 43, regular: 35 },
      { idadeMin: 40, idadeMax: 49, excelente: 50, bom: 41, medio: 33, regular: 26 },
      { idadeMin: 50, idadeMax: 99, excelente: 42, bom: 33, medio: 25, regular: 18 },
    ],
    feminina: [
      { idadeMin: 15, idadeMax: 19, excelente: 50, bom: 41, medio: 33, regular: 26 },
      { idadeMin: 20, idadeMax: 29, excelente: 53, bom: 43, medio: 35, regular: 28 },
      { idadeMin: 30, idadeMax: 39, excelente: 45, bom: 36, medio: 28, regular: 22 },
      { idadeMin: 40, idadeMax: 49, excelente: 38, bom: 30, medio: 22, regular: 16 },
      { idadeMin: 50, idadeMax: 99, excelente: 31, bom: 23, medio: 16, regular: 10 },
    ],
  };

  const linha = refs[genero]?.find(l => i >= l.idadeMin && i <= l.idadeMax);
  if (!linha) return null;

  let label, color, bg;
  if (v >= linha.excelente) { label = 'Excelente'; color = '#10b981'; bg = '#d1fae5'; }
  else if (v >= linha.bom) { label = 'Bom'; color = '#3b82f6'; bg = '#dbeafe'; }
  else if (v >= linha.medio) { label = 'Médio'; color = '#eab308'; bg = '#fef3c7'; }
  else if (v >= linha.regular) { label = 'Regular'; color = '#f97316'; bg = '#ffedd5'; }
  else { label = 'Fraco'; color = '#ef4444'; bg = '#fee2e2'; }

  return { label, color, bg, referencia: `Faixa ${linha.idadeMin}-${linha.idadeMax} anos`, ideal: linha.excelente };
};

// Potência em Watts — Fórmula de Sayers
const calcPotenciaWatts = (saltoCm, massaKg) => {
  const s = parseFloat(saltoCm) || 0;
  const m = parseFloat(massaKg) || 0;
  if (!s || !m) return 0;
  return Math.round((60.7 * s) + (45.3 * m) - 2055);
};

// Banco de Wells — Classificação por idade/gênero (ACSM, em cm)
const classificaBancoWells = (cm, idade, genero) => {
  const v = parseFloat(cm) || 0;
  const i = parseFloat(idade) || 0;
  if (!v || !i) return null;

  // Tabela ACSM (cm) — distância alcançada
  const refs = {
    masculino: [
      { idadeMin: 15, idadeMax: 19, excelente: 39, bom: 34, medio: 29, regular: 24 },
      { idadeMin: 20, idadeMax: 29, excelente: 40, bom: 33, medio: 28, regular: 23 },
      { idadeMin: 30, idadeMax: 39, excelente: 38, bom: 32, medio: 27, regular: 22 },
      { idadeMin: 40, idadeMax: 49, excelente: 35, bom: 30, medio: 24, regular: 18 },
      { idadeMin: 50, idadeMax: 59, excelente: 35, bom: 28, medio: 24, regular: 16 },
      { idadeMin: 60, idadeMax: 99, excelente: 33, bom: 25, medio: 20, regular: 15 },
    ],
    feminina: [
      { idadeMin: 15, idadeMax: 19, excelente: 43, bom: 38, medio: 34, regular: 29 },
      { idadeMin: 20, idadeMax: 29, excelente: 41, bom: 37, medio: 33, regular: 28 },
      { idadeMin: 30, idadeMax: 39, excelente: 41, bom: 36, medio: 32, regular: 27 },
      { idadeMin: 40, idadeMax: 49, excelente: 38, bom: 34, medio: 30, regular: 25 },
      { idadeMin: 50, idadeMax: 59, excelente: 39, bom: 33, medio: 30, regular: 25 },
      { idadeMin: 60, idadeMax: 99, excelente: 35, bom: 31, medio: 27, regular: 23 },
    ],
  };

  const linha = refs[genero]?.find(l => i >= l.idadeMin && i <= l.idadeMax);
  if (!linha) return null;

  let label, color, bg;
  if (v >= linha.excelente) { label = 'Excelente'; color = '#10b981'; bg = '#d1fae5'; }
  else if (v >= linha.bom) { label = 'Bom'; color = '#3b82f6'; bg = '#dbeafe'; }
  else if (v >= linha.medio) { label = 'Médio'; color = '#eab308'; bg = '#fef3c7'; }
  else if (v >= linha.regular) { label = 'Regular'; color = '#f97316'; bg = '#ffedd5'; }
  else { label = 'Fraco'; color = '#ef4444'; bg = '#fee2e2'; }

  return { label, color, bg, referencia: `Faixa ${linha.idadeMin}-${linha.idadeMax} anos`, ideal: linha.excelente };
};
const classificaSaltoHorizontal = (cm, idade, genero) => {
  const v = parseFloat(cm) || 0;
  const i = parseFloat(idade) || 0;
  if (!v || !i) return null;

  // Adaptado de Davis et al
  const refs = {
    masculino: [
      { idadeMin: 15, idadeMax: 19, excelente: 240, bom: 220, medio: 200, regular: 180 },
      { idadeMin: 20, idadeMax: 29, excelente: 250, bom: 230, medio: 210, regular: 190 },
      { idadeMin: 30, idadeMax: 39, excelente: 230, bom: 210, medio: 190, regular: 170 },
      { idadeMin: 40, idadeMax: 49, excelente: 210, bom: 190, medio: 170, regular: 150 },
      { idadeMin: 50, idadeMax: 99, excelente: 190, bom: 170, medio: 150, regular: 130 },
    ],
    feminina: [
      { idadeMin: 15, idadeMax: 19, excelente: 191, bom: 175, medio: 160, regular: 145 },
      { idadeMin: 20, idadeMax: 29, excelente: 200, bom: 180, medio: 165, regular: 150 },
      { idadeMin: 30, idadeMax: 39, excelente: 185, bom: 170, medio: 155, regular: 140 },
      { idadeMin: 40, idadeMax: 49, excelente: 170, bom: 155, medio: 140, regular: 125 },
      { idadeMin: 50, idadeMax: 99, excelente: 155, bom: 140, medio: 125, regular: 110 },
    ],
  };

  const linha = refs[genero]?.find(l => i >= l.idadeMin && i <= l.idadeMax);
  if (!linha) return null;

  let label, color, bg;
  if (v >= linha.excelente) { label = 'Excelente'; color = '#10b981'; bg = '#d1fae5'; }
  else if (v >= linha.bom) { label = 'Bom'; color = '#3b82f6'; bg = '#dbeafe'; }
  else if (v >= linha.medio) { label = 'Médio'; color = '#eab308'; bg = '#fef3c7'; }
  else if (v >= linha.regular) { label = 'Regular'; color = '#f97316'; bg = '#ffedd5'; }
  else { label = 'Fraco'; color = '#ef4444'; bg = '#fee2e2'; }

  return { label, color, bg, referencia: `Faixa ${linha.idadeMin}-${linha.idadeMax} anos`, ideal: linha.excelente };
};

// ===================================================================
// COMPONENTES EXTERNOS (fora do main pra não perder foco)
// ===================================================================

const Input = ({ label, value, onChange, type = 'number', unit, placeholder }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">{label}</label>
    <div className="relative">
      <input
        type={type}
        inputMode={type === 'number' ? 'decimal' : undefined}
        value={type === 'number' ? showVal(value) : (value || '')}
        onChange={(e) => {
          if (type === 'number') {
            const v = e.target.value;
            if (v === '' || v === '-') { onChange(0); return; }
            const parsed = parseFloat(v);
            onChange(isNaN(parsed) ? 0 : parsed);
          } else {
            onChange(e.target.value);
          }
        }}
        placeholder={placeholder || (type === 'number' ? '0' : '')}
        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
      />
      {unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">{unit}</span>}
    </div>
  </div>
);

const TextArea = ({ label, value, onChange, placeholder, rows = 2 }) => (
  <div>
    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">{label}</label>
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition resize-none"
    />
  </div>
);

const Card = ({ icon: Icon, title, subtitle, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
    <div className="flex items-start gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-indigo-700" />
      </div>
      <div>
        <h3 className="font-bold text-slate-900 text-base">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const GraficoForca = ({ d, e }) => {
  const max = Math.max(d, e, 10);
  const escalaMax = Math.ceil(max / 10) * 10;
  const escalas = [escalaMax, Math.round(escalaMax * 0.75), Math.round(escalaMax * 0.5), Math.round(escalaMax * 0.25), 0];
  const hD = (d / escalaMax) * 100;
  const hE = (e / escalaMax) * 100;
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <div className="flex gap-2" style={{ height: '140px' }}>
        <div className="flex flex-col justify-between text-[8px] font-bold text-slate-400 text-right pr-1" style={{ width: '24px' }}>
          {escalas.map((s, i) => <div key={i}>{s}</div>)}
        </div>
        <div className="flex-1 relative">
          {escalas.map((_, i) => (
            <div key={i} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: `${i * 25}%` }}></div>
          ))}
          <div className="relative h-full flex items-end justify-around gap-3 px-2">
            <div className="flex flex-col items-center justify-end h-full" style={{ width: '40%' }}>
              <div className="text-[10px] font-black text-indigo-700 mb-1">{d}</div>
              <div className="w-full bg-gradient-to-t from-indigo-700 via-indigo-600 to-indigo-400 rounded-t-md shadow-sm" style={{ height: `${hD}%`, minHeight: '4px' }}></div>
            </div>
            <div className="flex flex-col items-center justify-end h-full" style={{ width: '40%' }}>
              <div className="text-[10px] font-black text-purple-700 mb-1">{e}</div>
              <div className="w-full bg-gradient-to-t from-purple-700 via-purple-600 to-purple-400 rounded-t-md shadow-sm" style={{ height: `${hE}%`, minHeight: '4px' }}></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 mt-2 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-indigo-700 to-indigo-400"></div>
          <span className="text-[9px] font-bold text-slate-600">Direito (kg)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gradient-to-t from-purple-700 to-purple-400"></div>
          <span className="text-[9px] font-bold text-slate-600">Esquerdo (kg)</span>
        </div>
      </div>
    </div>
  );
};

const ExercicioForca = ({ label, valD, valE, onChangeD, onChangeE }) => {
  const a = calcAssimetria(valD, valE);
  const info = statusInfo[a.status];
  const d = parseFloat(valD) || 0;
  const e = parseFloat(valE) || 0;
  const handleNum = (val, setter) => {
    if (val === '' || val === '-') { setter(0); return; }
    const p = parseFloat(val);
    setter(isNaN(p) ? 0 : p);
  };
  return (
    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-slate-900 text-sm">{label}</h4>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: info.bg, color: info.color }}>
          {info.label}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Direito (kg)</label>
          <input type="number" inputMode="decimal" placeholder="0"
            value={showVal(valD)}
            onChange={(ev) => handleNum(ev.target.value, onChangeD)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600" />
        </div>
        <div>
          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Esquerdo (kg)</label>
          <input type="number" inputMode="decimal" placeholder="0"
            value={showVal(valE)}
            onChange={(ev) => handleNum(ev.target.value, onChangeE)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:outline-none focus:border-indigo-600" />
        </div>
      </div>
      <GraficoForca d={d} e={e} />
      <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 uppercase mt-2">
        <span>Diferença: <span className="text-slate-900">{a.diff} kg</span></span>
        <span>Assimetria: <span className="text-slate-900">{a.perc}%</span></span>
      </div>
    </div>
  );
};

const PhotoUpload = ({ label, value, onChange }) => {
  const handleUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  };
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2 text-center">{label}</label>
      <label className="block cursor-pointer">
        {value ? (
          <div className="relative group" style={{ aspectRatio: '3/4' }}>
            <img src={value} alt={label} className="w-full h-full object-cover bg-slate-50 rounded-xl border border-slate-200" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl transition flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 transition font-bold text-xs">Trocar foto</span>
            </div>
          </div>
        ) : (
          <div className="w-full border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition" style={{ aspectRatio: '3/4' }}>
            <Camera className="w-7 h-7 text-slate-400 mb-2" />
            <span className="text-xs font-bold text-slate-500">Adicionar</span>
          </div>
        )}
        <input type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => handleUpload(e.target.files[0])} />
      </label>
    </div>
  );
};

// Visualização das zonas de FC (Karvonen)
const ZonasFC = ({ zonas }) => {
  if (!zonas) return (
    <div className="bg-slate-50 rounded-xl p-5 text-center border border-dashed border-slate-300">
      <Heart className="w-7 h-7 text-slate-300 mx-auto mb-2" />
      <p className="text-xs text-slate-500 font-medium">Preencha idade e FC repouso para calcular as zonas</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 text-white">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] font-bold tracking-wider opacity-80 uppercase">Fórmula de Karvonen</div>
            <div className="text-base font-black mt-0.5">Zonas de Treinamento</div>
          </div>
          <div className="flex gap-3 text-right">
            <div>
              <div className="text-[9px] opacity-80 uppercase font-bold">FC Máx</div>
              <div className="text-xl font-black leading-none mt-1">{zonas.fcMax}<span className="text-[10px] font-medium opacity-80"> bpm</span></div>
            </div>
            <div>
              <div className="text-[9px] opacity-80 uppercase font-bold">Reserva</div>
              <div className="text-xl font-black leading-none mt-1">{zonas.fcReserva}<span className="text-[10px] font-medium opacity-80"> bpm</span></div>
            </div>
          </div>
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {zonas.zonas.map((z, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="w-1.5 h-10 rounded-full" style={{ background: z.color }}></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between flex-wrap gap-1">
                <div className="font-bold text-slate-900 text-sm">{z.nome}</div>
                <div className="text-[10px] font-bold text-slate-500">{z.faixa}</div>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{z.desc}</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-black text-slate-900 text-sm whitespace-nowrap" style={{ color: z.color }}>{z.min}–{z.max}</div>
              <div className="text-[9px] font-bold text-slate-400 uppercase">bpm</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ===================================================================
// COMPONENTE PRINCIPAL
// ===================================================================

export default function LinsTrainingApp() {
  const [view, setView] = useState('home');
  const [currentModule, setCurrentModule] = useState(1); // 1=Anamnese, 2=Morfo, 3=Neuro, 4=Postural
  const [athletes, setAthletes] = useState([]);
  const [currentAthleteId, setCurrentAthleteId] = useState(null);
  const [currentEvaluation, setCurrentEvaluation] = useState(getEmptyEvaluation());
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [pdfModulos, setPdfModulos] = useState({ anamnese: true, morfologico: true, forca: true, neuromotor: true });
  const [showPdfBuilder, setShowPdfBuilder] = useState(false);
  const [reportHtml, setReportHtml] = useState(null);

  function getEmptyEvaluation() {
    return {
      id: null, athleteId: null,
      date: new Date().toISOString().split('T')[0],
      // ANAMNESE
      nome: '', email: '', telefone: '', dataNascimento: '', idade: 0, genero: 'masculino',
      modalidade: '', posicao: '', tempoExperiencia: '', clube: '',
      objetivo: '', historicoLesoes: '', medicacoes: '', observacoesAnamnese: '',
      sistolica: 0, diastolica: 0, fcRepouso: 0,
      // MORFOLÓGICO
      massa: 0, estatura: 0,
      ombro: 0, peito: 0, bracoDir: 0, bracoEsq: 0,
      bicipitalDir: 0, bicipitalEsq: 0,
      cintura: 0, abdomen: 0, quadril: 0,
      coxaDir: 0, coxaEsq: 0, panturrilhaDir: 0, panturrilhaEsq: 0,
      dobraPeitoral: 0, dobraAxilarMedia: 0, dobraTriceps: 0,
      dobraSubescapular: 0, dobraAbdominal: 0, dobraSuprailiaca: 0, dobraCoxa: 0,
      dobraBicipital: 0, dobraPanturrilha: 0,
      // NEUROMOTOR
      forcaExtensaoJoelhoD: 0, forcaExtensaoJoelhoE: 0,
      forcaFlexaoJoelhoD: 0, forcaFlexaoJoelhoE: 0,
      forcaExtensaoQuadrilD: 0, forcaExtensaoQuadrilE: 0,
      forcaAducaoQuadrilD: 0, forcaAducaoQuadrilE: 0,
      forcaElevacaoLateralD: 0, forcaElevacaoLateralE: 0,
      forcaElevacaoFrontalD: 0, forcaElevacaoFrontalE: 0,
      forcaPressaoManualD: 0, forcaPressaoManualE: 0,
      rmlAbdominal: 0, saltoVertical: 0, saltoSquat: 0, saltoHorizontal: 0,
      bancoWells: 0,
      // POSTURAL
      fotoFrenteBracosLado: null, fotoFrenteBracosAbertos: null,
      fotoLateralD: null, fotoLateralE: null, fotoCostas: null,
      classificacaoPostural: '', parecerFinal: '',
    };
  }

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const a = await window.storage.get('lins:athletes');
      if (a) setAthletes(JSON.parse(a.value));
      const e = await window.storage.get('lins:evaluations');
      if (e) setEvaluations(JSON.parse(e.value));
    } catch (e) {}
    setLoading(false);
  }

  async function saveAthletes(a) {
    setAthletes(a);
    try { await window.storage.set('lins:athletes', JSON.stringify(a)); } catch (e) {}
  }
  async function saveEvaluations(e) {
    setEvaluations(e);
    try { await window.storage.set('lins:evaluations', JSON.stringify(e)); } catch (e) {}
  }

  function novoAtleta() {
    setCurrentEvaluation(getEmptyEvaluation());
    setCurrentAthleteId(null);
    setCurrentModule(1);
    setView('evaluation');
  }

  function abrirAtleta(id) { setCurrentAthleteId(id); setView('history'); }

  function novaAvaliacao(athleteId) {
    const a = athletes.find(x => x.id === athleteId);
    const newEval = getEmptyEvaluation();
    if (a) {
      newEval.nome = a.nome; newEval.email = a.email;
      newEval.dataNascimento = a.dataNascimento; newEval.idade = a.idade;
      newEval.genero = a.genero;
    }
    newEval.athleteId = athleteId;
    setCurrentEvaluation(newEval); setCurrentAthleteId(athleteId);
    setCurrentModule(1); setView('evaluation');
  }

  function verAvaliacao(id) {
    const ev = evaluations.find(e => e.id === id);
    if (ev) { setCurrentEvaluation(ev); setView('report'); }
  }

  async function salvarAvaliacao() {
    setSaveStatus('Salvando...');
    let newAthletes = [...athletes];
    let athleteId = currentAthleteId;
    if (!athleteId) {
      athleteId = 'ath_' + Date.now();
      newAthletes.push({
        id: athleteId, nome: currentEvaluation.nome, email: currentEvaluation.email,
        dataNascimento: currentEvaluation.dataNascimento, idade: currentEvaluation.idade,
        genero: currentEvaluation.genero, criadoEm: new Date().toISOString(),
      });
      await saveAthletes(newAthletes);
      setCurrentAthleteId(athleteId);
    }
    const evalToSave = { ...currentEvaluation, id: currentEvaluation.id || 'eval_' + Date.now(), athleteId };
    let newEvals = currentEvaluation.id
      ? evaluations.map(e => e.id === evalToSave.id ? evalToSave : e)
      : [...evaluations, evalToSave];
    await saveEvaluations(newEvals);
    setCurrentEvaluation(evalToSave);
    setSaveStatus('Salvo ✓');
    setTimeout(() => setSaveStatus(''), 2000);
  }

  async function excluirAtleta(id) {
    if (!confirm('Excluir este atleta e todas as suas avaliações?')) return;
    await saveAthletes(athletes.filter(a => a.id !== id));
    await saveEvaluations(evaluations.filter(e => e.athleteId !== id));
    setView('athletes');
  }

  const update = (field) => (value) => {
    setCurrentEvaluation((prev) => ({ ...prev, [field]: value }));
  };

  // ============ CÁLCULOS ============
  const calcIMC = () => {
    const m = parseFloat(currentEvaluation.massa);
    const h = parseFloat(currentEvaluation.estatura) / 100;
    if (!m || !h) return 0;
    return (m / (h * h)).toFixed(1);
  };
  const calcGordura = () => {
    const e = currentEvaluation;
    const soma = parseFloat(e.dobraPeitoral||0) + parseFloat(e.dobraAxilarMedia||0) +
                 parseFloat(e.dobraTriceps||0) + parseFloat(e.dobraSubescapular||0) +
                 parseFloat(e.dobraAbdominal||0) + parseFloat(e.dobraSuprailiaca||0) +
                 parseFloat(e.dobraCoxa||0);
    if (!soma || soma <= 0) return 0;
    const idade = parseFloat(e.idade) || 25;
    let densidade;
    if (e.genero === 'masculino') {
      densidade = 1.112 - (0.00043499 * soma) + (0.00000055 * soma * soma) - (0.00028826 * idade);
    } else {
      densidade = 1.097 - (0.00046971 * soma) + (0.00000056 * soma * soma) - (0.00012828 * idade);
    }
    return (((4.95 / densidade) - 4.5) * 100).toFixed(1);
  };
  const calcTMB = () => {
    const e = currentEvaluation;
    const m = parseFloat(e.massa), h = parseFloat(e.estatura), i = parseFloat(e.idade);
    if (!m || !h || !i) return 0;
    if (e.genero === 'masculino') return Math.round(88.36 + (13.4 * m) + (4.8 * h) - (5.7 * i));
    return Math.round(447.6 + (9.2 * m) + (3.1 * h) - (4.3 * i));
  };

  // Zonas FC
  const zonasFC = calcZonasKarvonen(currentEvaluation.idade, currentEvaluation.fcRepouso);

  // ============ GERADOR DE PDF ============
  function gerarPDF(modulos) {
    try {
    const ev = currentEvaluation;
    const dataFmt = new Date(ev.date).toLocaleDateString('pt-BR');
    const imc = calcIMC();
    const imcClass = classificaIMC(imc);
    const gordura = calcGordura();
    const gorduraClass = classificaGordura(gordura);
    const tmb = calcTMB();
    const rce = (() => {
      const c = parseFloat(ev.cintura), h = parseFloat(ev.estatura);
      return (c && h) ? (c / h).toFixed(2).replace('.', ',') : '0,00';
    })();
    const zonas = calcZonasKarvonen(ev.idade, ev.fcRepouso);

    // Duplo Produto = FC × PA Sistólica
    const duploProduto = (parseFloat(ev.fcRepouso) || 0) * (parseFloat(ev.sistolica) || 0);

    const exercicios = [
      { nome: 'Extensão de Joelho', d: ev.forcaExtensaoJoelhoD, e: ev.forcaExtensaoJoelhoE, desc: 'Quadríceps — base para sprints, saltos e desaceleração.' },
      { nome: 'Flexão de Joelho', d: ev.forcaFlexaoJoelhoD, e: ev.forcaFlexaoJoelhoE, desc: 'Isquiotibiais — proteção contra estiramentos e estabilidade.' },
      { nome: 'Adução de Quadril', d: ev.forcaAducaoQuadrilD, e: ev.forcaAducaoQuadrilE, desc: 'Adutores — estabilidade pélvica e prevenção de pubalgia.' },
      { nome: 'Abdução de Quadril', d: ev.forcaAbducaoQuadrilD, e: ev.forcaAbducaoQuadrilE, desc: 'Abdutores — estabilidade lateral do quadril e pelve.' },
      { nome: 'Elevação Lateral', d: ev.forcaElevacaoLateralD, e: ev.forcaElevacaoLateralE, desc: 'Deltoide médio — equilíbrio do ombro em movimentos esportivos.' },
      { nome: 'Elevação Frontal', d: ev.forcaElevacaoFrontalD, e: ev.forcaElevacaoFrontalE, desc: 'Deltoide anterior — proteção articular e potência.' },
    ];

    // Gráfico de força (mantém estilo atual)
    const graficoForca = (dir, esq) => {
      const d = parseFloat(dir) || 0, e = parseFloat(esq) || 0;
      const max = Math.max(d, e, 10);
      const escalaMax = Math.ceil(max / 10) * 10;
      const escalas = [escalaMax, Math.round(escalaMax * 0.75), Math.round(escalaMax * 0.5), Math.round(escalaMax * 0.25), 0];
      const hD = (d / escalaMax) * 100;
      const hE = (e / escalaMax) * 100;
      return `<div style="background:white;border:1px solid #e2e8f0;border-radius:8px;padding:8px;">
        <div style="display:flex;gap:6px;height:120px;">
          <div style="display:flex;flex-direction:column;justify-content:space-between;text-align:right;font-size:7px;font-weight:700;color:#94a3b8;width:18px;padding-right:2px;">
            ${escalas.map(s => `<div>${s}</div>`).join('')}
          </div>
          <div style="flex:1;position:relative;">
            ${escalas.map((_, i) => `<div style="position:absolute;left:0;right:0;border-top:1px solid #f1f5f9;top:${i * 25}%;"></div>`).join('')}
            <div style="position:relative;height:100%;display:flex;align-items:flex-end;justify-content:space-around;gap:8px;padding:0 4px;">
              <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;width:42%;">
                <div style="font-size:9px;font-weight:900;color:#1e40af;margin-bottom:2px;">${d}</div>
                <div style="width:100%;background:linear-gradient(180deg,#60a5fa,#1e40af);border-radius:4px 4px 0 0;height:${hD}%;min-height:3px;"></div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;width:42%;">
                <div style="font-size:9px;font-weight:900;color:#7c3aed;margin-bottom:2px;">${e}</div>
                <div style="width:100%;background:linear-gradient(180deg,#a78bfa,#6d28d9);border-radius:4px 4px 0 0;height:${hE}%;min-height:3px;"></div>
              </div>
            </div>
          </div>
        </div>
        <div style="display:flex;justify-content:center;gap:14px;margin-top:6px;padding-top:6px;border-top:1px solid #f1f5f9;">
          <div style="display:flex;align-items:center;gap:4px;">
            <div style="width:8px;height:8px;background:linear-gradient(180deg,#60a5fa,#1e40af);border-radius:2px;"></div>
            <span style="font-size:8px;font-weight:700;color:#475569;">Direito (kg)</span>
          </div>
          <div style="display:flex;align-items:center;gap:4px;">
            <div style="width:8px;height:8px;background:linear-gradient(180deg,#a78bfa,#6d28d9);border-radius:2px;"></div>
            <span style="font-size:8px;font-weight:700;color:#475569;">Esquerdo (kg)</span>
          </div>
        </div>
      </div>`;
    };

    // Faixa colorida tipo AvaliaFit (segmentos com posicao do atleta)
    const faixaColorida = (segmentos, valorAtual, unidade = '') => {
      const total = segmentos.reduce((acc, s) => acc + s.peso, 0);
      return `<div style="position:relative;margin-top:14px;">
        <div style="display:flex;border-radius:10px;overflow:hidden;height:42px;">
          ${segmentos.map((s, i) => `
            <div style="flex:${s.peso};background:${s.color};display:flex;align-items:center;justify-content:center;color:${s.textColor || '#0f172a'};font-size:9px;font-weight:800;text-align:center;padding:0 4px;">
              ${s.label}
            </div>
          `).join('')}
        </div>
        ${valorAtual !== null && valorAtual !== undefined ? `
          <div style="margin-top:8px;text-align:center;font-size:9px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">
            Resultado atual: <span style="color:#1e40af;font-size:13px;font-weight:900;">${valorAtual}${unidade}</span>
          </div>
        ` : ''}
      </div>`;
    };

    // Header Lins Training
    const brandHeader = `
      <div class="header-brand">
        <div class="logo">L</div>
        <div class="brand-text">
          <div class="brand-name">LINS <span>TRAINING</span></div>
          <div class="brand-tagline"><div class="tag-main">AVALIAÇÃO</div><div class="tag-sub">FÍSICA</div></div>
        </div>
        <div class="header-meta">
          <div class="meta-athlete">${ev.nome || 'Atleta'}</div>
          <div class="meta-date">${dataFmt}</div>
        </div>
      </div>`;

    // ============ PÁGINA 1: CAPA COM CARTA ============
    const paginaCapa = `
      <div class="page page-cover">
        <div class="cover-top">
          <div class="cover-logo">
            <div class="cover-logo-icon">L</div>
            <div class="cover-logo-text">
              <div class="cover-logo-name">LINS <span>TRAINING</span></div>
              <div class="cover-logo-tag"><div class="tag-main">AVALIAÇÃO</div><div class="tag-sub">FÍSICA</div></div>
            </div>
          </div>
          <div class="cover-divider"></div>
          <div class="cover-title-block">
            <div class="cover-title-label">RELATÓRIO DE</div>
            <h1>AVALIAÇÃO FÍSICA</h1>
            <div class="cover-athlete-block">
              <div class="cover-athlete-label">Atleta</div>
              <div class="cover-athlete-name">${ev.nome || '—'}</div>
              <div class="cover-athlete-meta">${ev.modalidade ? ev.modalidade + ' · ' : ''}${ev.posicao ? ev.posicao + ' · ' : ''}${dataFmt}</div>
            </div>
          </div>
        </div>

        <div class="cover-letter">
          <div class="letter-quote-mark">"</div>
          <div class="letter-content">
            <div class="letter-greeting">Atleta,</div>
            <p>Antes dos números, uma palavra.</p>
            <p>Este relatório é o resultado de uma avaliação cuidadosa do seu corpo — composição, força, postura, sinais vitais. Tudo medido com critério científico de referência internacional.</p>
            <p>Mas pra mim, este documento é mais do que dados. É <strong>um compromisso</strong>. Acredito que o esporte forma muito mais do que atletas: forma caráter. E que cada atleta que passa pela Lins Training deixa um legado — no clube, na sua casa, na sua família.</p>
            <div class="letter-quote">
              <em>"Sucesso é a paz proveniente de dar o seu melhor."</em>
              <div class="letter-quote-author">— John Wooden</div>
            </div>
            <p>Que esse seja o nosso caminho juntos. <strong>Um atleta melhor. Uma pessoa melhor.</strong></p>
            <p class="letter-closer">Performance hoje, legado pra sempre.</p>
            <div class="letter-signature">
              <div class="sig-line"></div>
              <div class="sig-name">Lins Oliveira</div>
              <div class="sig-role">Lins Training</div>
            </div>
          </div>
        </div>
      </div>`;

    // ============ ANAMNESE ============
    const paginaAnamnese = !modulos.anamnese ? '' : `
      <div class="page">
        ${brandHeader}
        <div class="title-section">
          <div class="title-label">MÓDULO 1</div>
          <h1>ANAMNESE</h1>
          <div class="title-sub">Identificação, perfil esportivo e zonas de treinamento</div>
        </div>

        <div class="info-grid">
          <div class="info-block">
            <h3>Dados Pessoais</h3>
            <div class="info-row"><span class="lbl">Nome</span><span class="val">${ev.nome || '—'}</span></div>
            <div class="info-row"><span class="lbl">Idade</span><span class="val">${ev.idade || '—'} anos</span></div>
            <div class="info-row"><span class="lbl">Gênero</span><span class="val">${ev.genero}</span></div>
            <div class="info-row"><span class="lbl">E-mail</span><span class="val">${ev.email || '—'}</span></div>
          </div>
          <div class="info-block">
            <h3>Perfil Esportivo</h3>
            <div class="info-row"><span class="lbl">Modalidade</span><span class="val">${ev.modalidade || '—'}</span></div>
            <div class="info-row"><span class="lbl">Posição</span><span class="val">${ev.posicao || '—'}</span></div>
            <div class="info-row"><span class="lbl">Clube</span><span class="val">${ev.clube || '—'}</span></div>
            <div class="info-row"><span class="lbl">Experiência</span><span class="val">${ev.tempoExperiencia || '—'}</span></div>
          </div>
        </div>

        ${ev.objetivo ? `
        <div class="objetivo-box">
          <div class="objetivo-label">OBJETIVO PRINCIPAL</div>
          <div class="objetivo-text">${ev.objetivo}</div>
        </div>` : ''}

        ${ev.historicoLesoes ? `
        <div class="info-block-full">
          <h3>Histórico de Lesões</h3>
          <p>${ev.historicoLesoes}</p>
        </div>` : ''}

        <div class="section-divider">
          <div class="section-num">01</div>
          <h2>Sinais Vitais</h2>
        </div>

        <div class="vitals-grid">
          <div class="vital-card">
            <div class="vital-label">Pressão Arterial</div>
            <div class="vital-value">${ev.sistolica}/${ev.diastolica}</div>
            <div class="vital-unit">mmHg</div>
          </div>
          <div class="vital-card">
            <div class="vital-label">FC Repouso</div>
            <div class="vital-value">${ev.fcRepouso}</div>
            <div class="vital-unit">bpm</div>
          </div>
          <div class="vital-card">
            <div class="vital-label">FC Máx</div>
            <div class="vital-value">${zonas ? zonas.fcMax : '—'}</div>
            <div class="vital-unit">bpm</div>
          </div>
          <div class="vital-card vital-highlight">
            <div class="vital-label">Duplo Produto</div>
            <div class="vital-value">${duploProduto.toLocaleString('pt-BR')}</div>
            <div class="vital-unit">mmHg/min</div>
          </div>
        </div>

        ${zonas ? `
        <div class="section-divider">
          <div class="section-num">02</div>
          <h2>Zonas de Treinamento — Fórmula de Karvonen</h2>
        </div>

        <table class="zonas-table">
          <thead>
            <tr><th>Zona</th><th>Faixa</th><th style="text-align:center;">BPM</th><th>Aplicação</th></tr>
          </thead>
          <tbody>
            ${zonas.zonas.map(z => `
              <tr>
                <td><div style="display:flex;align-items:center;gap:8px;"><div style="width:5px;height:18px;background:${z.color};border-radius:3px;"></div><strong>${z.nome}</strong></div></td>
                <td>${z.faixa}</td>
                <td style="text-align:center;"><strong style="color:${z.color};font-size:11px;">${z.min}–${z.max}</strong></td>
                <td style="font-size:8.5px;color:#475569;">${z.desc}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>` : ''}

        <div class="ref-box">
          <div class="ref-title">NORMAS DE REFERÊNCIA</div>
          <div class="ref-list">
            <div class="ref-item">• Pressão Arterial Ideal: <strong>&lt; 120/80 mmHg</strong></div>
            <div class="ref-item">• Duplo Produto Normal (repouso): <strong>5.500 – 11.300 mmHg/min</strong></div>
            <div class="ref-item">• FC Repouso Atletas: <strong>40 – 60 bpm</strong></div>
            <div class="ref-item">• Karvonen: FC alvo = ((220 − idade) − FCrep) × % + FCrep</div>
          </div>
        </div>
      </div>`;

    // ============ MORFOLÓGICO (REDESIGN AVALIAFIT) ============
    const somaDobras = (parseFloat(ev.dobraPeitoral||0) + parseFloat(ev.dobraAxilarMedia||0) +
                       parseFloat(ev.dobraTriceps||0) + parseFloat(ev.dobraSubescapular||0) +
                       parseFloat(ev.dobraAbdominal||0) + parseFloat(ev.dobraSuprailiaca||0) +
                       parseFloat(ev.dobraCoxa||0)).toFixed(1);

    const paginaMorfo = !modulos.morfologico ? '' : `
      <div class="page">
        ${brandHeader}
        <div class="title-section">
          <div class="title-label">MÓDULO 2</div>
          <h1>MORFOLÓGICO</h1>
          <div class="title-sub">Composição corporal, perimetria e dobras cutâneas</div>
        </div>

        <div class="vitals-grid four">
          <div class="vital-card">
            <div class="vital-label">IMC</div>
            <div class="vital-value">${imc}</div>
            <div class="vital-status" style="color:${imcClass.color};">${imcClass.label}</div>
          </div>
          <div class="vital-card vital-highlight">
            <div class="vital-label">% Gordura</div>
            <div class="vital-value">${gordura}</div>
            <div class="vital-status">${gorduraClass.label}</div>
          </div>
          <div class="vital-card">
            <div class="vital-label">TMB</div>
            <div class="vital-value">${tmb}</div>
            <div class="vital-unit">kcal/dia</div>
          </div>
          <div class="vital-card">
            <div class="vital-label">RCE</div>
            <div class="vital-value">${rce}</div>
            <div class="vital-unit">cintura/altura</div>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-num">01</div>
          <h2>Índice de Massa Corporal (IMC)</h2>
        </div>

        ${faixaColorida([
          { label: 'Desnutrido<br/>(até 18)', color: '#cbd5e1', peso: 1 },
          { label: 'Normal<br/>(18-24,9)', color: '#10b981', peso: 1.2, textColor: 'white' },
          { label: 'Sobrepeso<br/>(25-29,9)', color: '#eab308', peso: 1, textColor: 'white' },
          { label: 'Obesidade I<br/>(30-34,9)', color: '#f97316', peso: 1, textColor: 'white' },
          { label: 'Obesidade II<br/>(35-39,9)', color: '#ef4444', peso: 1, textColor: 'white' },
          { label: 'Mórbida<br/>(40+)', color: '#1e293b', peso: 0.8, textColor: 'white' },
        ], imc, ' kg/m²')}

        <div class="section-divider">
          <div class="section-num">02</div>
          <h2>Percentual de Gordura Corporal</h2>
        </div>

        ${faixaColorida([
          { label: 'Muito Baixo<br/>(até 5%)', color: '#cbd5e1', peso: 1 },
          { label: 'Abaixo Média<br/>(6-14%)', color: '#f97316', peso: 1.5, textColor: 'white' },
          { label: 'Média<br/>(15%)', color: '#10b981', peso: 1, textColor: 'white' },
          { label: 'Acima Média<br/>(16-24%)', color: '#eab308', peso: 1.3, textColor: 'white' },
          { label: 'Muito Alto<br/>(+25%)', color: '#ef4444', peso: 1, textColor: 'white' },
        ], gordura, '%')}

        <div class="section-divider">
          <div class="section-num">03</div>
          <h2>Perimetria</h2>
        </div>

        <table class="data-table">
          <thead>
            <tr><th>Segmento</th><th style="text-align:center;">Direito</th><th style="text-align:center;">Esquerdo</th><th style="text-align:center;">Δ Diferença</th></tr>
          </thead>
          <tbody>
            <tr><td><strong>Braço Relaxado</strong></td><td style="text-align:center;">${ev.bracoDir || '—'} cm</td><td style="text-align:center;">${ev.bracoEsq || '—'} cm</td><td style="text-align:center;">${Math.abs((ev.bracoDir||0) - (ev.bracoEsq||0)).toFixed(1)} cm</td></tr>
            <tr><td><strong>Antebraço</strong></td><td style="text-align:center;">${ev.antebracoDir || '—'} cm</td><td style="text-align:center;">${ev.antebracoEsq || '—'} cm</td><td style="text-align:center;">${Math.abs((ev.antebracoDir||0) - (ev.antebracoEsq||0)).toFixed(1)} cm</td></tr>
            <tr><td><strong>Coxa Proximal</strong></td><td style="text-align:center;">${ev.coxaDir || '—'} cm</td><td style="text-align:center;">${ev.coxaEsq || '—'} cm</td><td style="text-align:center;">${Math.abs((ev.coxaDir||0) - (ev.coxaEsq||0)).toFixed(1)} cm</td></tr>
            <tr><td><strong>Coxa Medial</strong></td><td style="text-align:center;">${ev.coxaMedialDir || '—'} cm</td><td style="text-align:center;">${ev.coxaMedialEsq || '—'} cm</td><td style="text-align:center;">${Math.abs((ev.coxaMedialDir||0) - (ev.coxaMedialEsq||0)).toFixed(1)} cm</td></tr>
            <tr><td><strong>Panturrilha</strong></td><td style="text-align:center;">${ev.panturrilhaDir || '—'} cm</td><td style="text-align:center;">${ev.panturrilhaEsq || '—'} cm</td><td style="text-align:center;">${Math.abs((ev.panturrilhaDir||0) - (ev.panturrilhaEsq||0)).toFixed(1)} cm</td></tr>
          </tbody>
        </table>

        <div class="vitals-grid four" style="margin-top:10px;">
          <div class="vital-card mini"><div class="vital-label">Ombro</div><div class="vital-value">${ev.ombro}<small> cm</small></div></div>
          <div class="vital-card mini"><div class="vital-label">Peito</div><div class="vital-value">${ev.peito}<small> cm</small></div></div>
          <div class="vital-card mini"><div class="vital-label">Cintura</div><div class="vital-value">${ev.cintura}<small> cm</small></div></div>
          <div class="vital-card mini"><div class="vital-label">Quadril</div><div class="vital-value">${ev.quadril}<small> cm</small></div></div>
        </div>
      </div>

      <div class="page">
        ${brandHeader}
        <div class="title-section">
          <div class="title-label">MÓDULO 2 · CONTINUAÇÃO</div>
          <h1>DOBRAS CUTÂNEAS</h1>
          <div class="title-sub">Protocolo Pollock 7 · Equação Jackson & Pollock 1978</div>
        </div>

        <div class="dobras-grid">
          <div class="dobra-card"><div class="dobra-label">Peitoral</div><div class="dobra-value">${ev.dobraPeitoral || 0}<small> mm</small></div></div>
          <div class="dobra-card"><div class="dobra-label">Axilar Média</div><div class="dobra-value">${ev.dobraAxilarMedia || 0}<small> mm</small></div></div>
          <div class="dobra-card"><div class="dobra-label">Tríceps</div><div class="dobra-value">${ev.dobraTriceps || 0}<small> mm</small></div></div>
          <div class="dobra-card"><div class="dobra-label">Subescapular</div><div class="dobra-value">${ev.dobraSubescapular || 0}<small> mm</small></div></div>
          <div class="dobra-card"><div class="dobra-label">Abdominal</div><div class="dobra-value">${ev.dobraAbdominal || 0}<small> mm</small></div></div>
          <div class="dobra-card"><div class="dobra-label">Suprailíaca</div><div class="dobra-value">${ev.dobraSuprailiaca || 0}<small> mm</small></div></div>
          <div class="dobra-card"><div class="dobra-label">Coxa</div><div class="dobra-value">${ev.dobraCoxa || 0}<small> mm</small></div></div>
          <div class="dobra-card"><div class="dobra-label">Bicipital</div><div class="dobra-value">${ev.dobraBicipital || 0}<small> mm</small></div></div>
          <div class="dobra-card"><div class="dobra-label">Panturrilha</div><div class="dobra-value">${ev.dobraPanturrilha || 0}<small> mm</small></div></div>
        </div>

        <div class="resultado-destaque">
          <div class="resultado-item">
            <div class="resultado-label">Σ DOBRAS POLLOCK 7</div>
            <div class="resultado-value">${somaDobras}<small> mm</small></div>
          </div>
          <div class="resultado-divider"></div>
          <div class="resultado-item resultado-main">
            <div class="resultado-label">PERCENTUAL DE GORDURA</div>
            <div class="resultado-value-big">${gordura}<small>%</small></div>
            <div class="resultado-tag">${gorduraClass.label}</div>
          </div>
        </div>

        <div class="ref-box">
          <div class="ref-title">REFERÊNCIA PARA ATLETAS — FUTEBOL</div>
          <div class="ref-list">
            <div class="ref-item">• <strong>Homens:</strong> 8% – 12% de gordura corporal (faixa ideal)</div>
            <div class="ref-item">• <strong>Mulheres:</strong> 16% – 22% de gordura corporal (faixa ideal)</div>
            <div class="ref-item">• Valores muito baixos comprometem hormônios e imunidade</div>
            <div class="ref-item">• Valores acima reduzem velocidade e aumentam risco cardiovascular</div>
          </div>
        </div>
      </div>`;

    // ============ NEUROMOTOR — FORÇA (mantém estilo atual com gráficos D vs E) ============
    const cmj = parseFloat(ev.saltoVertical) || 0;
    const sj = parseFloat(ev.saltoSquat) || 0;
    const ie = (cmj && sj) ? ((cmj - sj) / sj * 100).toFixed(1) : 0;
    const watts = calcPotenciaWatts(ev.saltoVertical, ev.massa);
    const rmlClass = classificaRMLAbdominal(ev.rmlAbdominal, ev.idade, ev.genero);
    const cmjClass = classificaSaltoVertical(ev.saltoVertical, ev.idade, ev.genero);
    const sjClass = classificaSaltoVertical(ev.saltoSquat, ev.idade, ev.genero);
    const horizClass = classificaSaltoHorizontal(ev.saltoHorizontal, ev.idade, ev.genero);
    const wellsClass = classificaBancoWells(ev.bancoWells, ev.idade, ev.genero);

    const paginaForca = !modulos.forca ? '' : `
      <div class="page">
        ${brandHeader}
        <div class="title-section">
          <div class="title-label">MÓDULO 3</div>
          <h1>FORÇA MUSCULAR</h1>
          <div class="title-sub">Avaliação com dinamômetro digital · Análise de assimetrias D vs E</div>
        </div>

        <div class="protocol-box">
          <div class="protocol-icon">⚖</div>
          <div class="protocol-content">
            <div class="protocol-title">PROTOCOLO TÉCNICO</div>
            <p>Avaliação realizada com <strong>dinamômetro digital</strong>, instrumento de referência científica para mensuração precisa de força isométrica máxima. Análise de assimetrias segundo critério <strong>Croisier (2002)</strong>, padrão do futebol europeu de alto rendimento.</p>
          </div>
        </div>

        <div class="selo-assimetria">
          <div class="selo-titulo">Chance de lesão por assimetria</div>
          <div class="selo-faixas">
            <div class="selo-faixa baixa-selo">
              <div class="selo-dot" style="background:#10b981;"></div>
              <div class="selo-info">
                <div class="selo-label">BAIXA</div>
                <div class="selo-range">abaixo de 10%</div>
              </div>
            </div>
            <div class="selo-faixa media-selo">
              <div class="selo-dot" style="background:#f97316;"></div>
              <div class="selo-info">
                <div class="selo-label">MÉDIA</div>
                <div class="selo-range">entre 10% e 20%</div>
              </div>
            </div>
            <div class="selo-faixa alta-selo">
              <div class="selo-dot" style="background:#ef4444;"></div>
              <div class="selo-info">
                <div class="selo-label">ALTA</div>
                <div class="selo-range">acima de 20%</div>
              </div>
            </div>
          </div>
        </div>

        <div class="forca-grid" style="margin-top:14px;">
          ${exercicios.map(exr => {
            const a = calcAssimetria(exr.d, exr.e);
            return `<div class="forca-card">
              <div class="name">${exr.nome}</div>
              <div class="desc">${exr.desc}</div>
              ${graficoForca(exr.d, exr.e)}
              <div class="stats">
                <span class="lbl">Δ <span class="val">${a.diff} kg</span></span>
                <span class="lbl">Assimetria: <span class="val">${a.perc}%</span></span>
                <span class="status-badge ${a.status}">${statusInfo[a.status].label}</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`;

    const paginaNeuro = !modulos.neuromotor ? '' : `
      <div class="page">
        ${brandHeader}
        <div class="title-section">
          <div class="title-label">MÓDULO 4</div>
          <h1>RESISTÊNCIA, POTÊNCIA & FLEXIBILIDADE</h1>
          <div class="title-sub">RML abdominal, saltos e Banco de Wells</div>
        </div>

        <div class="section-divider">
          <div class="section-num">01</div>
          <h2>Resistência Muscular Localizada · RML Abdominal</h2>
        </div>

        <div class="test-row">
          <div class="test-result">
            <div class="test-label">Repetições em 1 minuto</div>
            <div class="test-value">${ev.rmlAbdominal || 0}<small> rep</small></div>
          </div>
          ${rmlClass ? `
          <div class="test-class" style="background:${rmlClass.bg};border-color:${rmlClass.color};">
            <div class="test-class-label" style="color:${rmlClass.color};">CLASSIFICAÇÃO</div>
            <div class="test-class-value" style="color:${rmlClass.color};">${rmlClass.label}</div>
            <div class="test-class-ref" style="color:${rmlClass.color};">${rmlClass.referencia} · Excelente: ${rmlClass.ideal}+ rep</div>
          </div>` : '<div class="test-class"><div class="test-class-value">—</div></div>'}
        </div>

        <div class="section-divider">
          <div class="section-num">02</div>
          <h2>Potência de Membros Inferiores</h2>
        </div>

        <div class="saltos-grid">
          <div class="salto-card">
            <div class="salto-header">
              <div class="salto-name">CMJ</div>
              <div class="salto-tag">com contra-movimento</div>
            </div>
            <div class="salto-body">
              <div class="salto-value">${ev.saltoVertical || 0}<small> cm</small></div>
              ${cmjClass ? `<div class="salto-class" style="background:${cmjClass.bg};color:${cmjClass.color};">${cmjClass.label}</div>` : ''}
              ${watts ? `<div class="salto-watts">⚡ ${watts} W <small>(Sayers)</small></div>` : ''}
            </div>
          </div>

          <div class="salto-card">
            <div class="salto-header">
              <div class="salto-name">SJ</div>
              <div class="salto-tag">squat jump</div>
            </div>
            <div class="salto-body">
              <div class="salto-value">${ev.saltoSquat || 0}<small> cm</small></div>
              ${sjClass ? `<div class="salto-class" style="background:${sjClass.bg};color:${sjClass.color};">${sjClass.label}</div>` : ''}
              ${ie ? `<div class="salto-watts">⟲ Elasticidade ${ie}%</div>` : ''}
            </div>
          </div>

          <div class="salto-card">
            <div class="salto-header">
              <div class="salto-name">Horizontal</div>
              <div class="salto-tag">broad jump</div>
            </div>
            <div class="salto-body">
              <div class="salto-value">${ev.saltoHorizontal || 0}<small> cm</small></div>
              ${horizClass ? `<div class="salto-class" style="background:${horizClass.bg};color:${horizClass.color};">${horizClass.label}</div>` : ''}
              ${horizClass ? `<div class="salto-watts">Excelente: ${horizClass.ideal}+ cm</div>` : ''}
            </div>
          </div>
        </div>

        <div class="section-divider">
          <div class="section-num">03</div>
          <h2>Flexibilidade · Banco de Wells</h2>
        </div>

        <div class="test-row">
          <div class="test-result">
            <div class="test-label">Distância Alcançada</div>
            <div class="test-value">${ev.bancoWells || 0}<small> cm</small></div>
          </div>
          ${wellsClass ? `
          <div class="test-class" style="background:${wellsClass.bg};border-color:${wellsClass.color};">
            <div class="test-class-label" style="color:${wellsClass.color};">CLASSIFICAÇÃO</div>
            <div class="test-class-value" style="color:${wellsClass.color};">${wellsClass.label}</div>
            <div class="test-class-ref" style="color:${wellsClass.color};">Cadeia posterior · Excelente: ${wellsClass.ideal}+ cm</div>
          </div>` : '<div class="test-class"><div class="test-class-value">—</div></div>'}
        </div>

        <div class="ref-box">
          <div class="ref-title">REFERÊNCIAS CIENTÍFICAS</div>
          <div class="ref-list">
            <div class="ref-item">• <strong>Critério Croisier (2002):</strong> assimetria de força em atletas de futebol</div>
            <div class="ref-item">• <strong>Fórmula de Sayers:</strong> Potência (W) = (60,7 × salto cm) + (45,3 × peso kg) − 2055</div>
            <div class="ref-item">• <strong>Índice de Elasticidade:</strong> referência ideal entre 10–20% (CMJ vs SJ)</div>
            <div class="ref-item">• <strong>RML e Wells:</strong> Tabela ACSM (American College of Sports Medicine)</div>
          </div>
        </div>
      </div>`;

    // ============ POSTURAL ============
    const corClassPost = ev.classificacaoPostural === 'Equilibrada' ? '#10b981' :
                         ev.classificacaoPostural === 'Intermediária' ? '#eab308' :
                         ev.classificacaoPostural === 'Preocupante' ? '#ef4444' : '#94a3b8';

    const paginaPostural = !modulos.postural ? '' : `
      <div class="page">
        ${brandHeader}
        <div class="title-section">
          <div class="title-label">MÓDULO 4</div>
          <h1>AVALIAÇÃO POSTURAL</h1>
          <div class="title-sub">Análise visual e parecer técnico</div>
        </div>

        <div class="protocol-box">
          <div class="protocol-icon">📐</div>
          <div class="protocol-content">
            <div class="protocol-title">SOBRE A AVALIAÇÃO POSTURAL</div>
            <p>A análise postural identifica <strong>desalinhamentos e compensações</strong> que afetam diretamente performance e saúde articular. Pequenos desvios podem gerar sobrecargas em cadeias musculares inteiras, aumentando risco de lesões.</p>
          </div>
        </div>

        <div class="postural-photos">
          ${ev.fotoFrenteBracosLado ? `<div class="postural-photo"><img src="${ev.fotoFrenteBracosLado}" /><div class="lbl">Anterior · Braços ao lado</div></div>` : '<div class="postural-photo"><div class="empty">Sem foto</div><div class="lbl">Anterior · Braços ao lado</div></div>'}
          ${ev.fotoFrenteBracosAbertos ? `<div class="postural-photo"><img src="${ev.fotoFrenteBracosAbertos}" /><div class="lbl">Anterior · Braços abertos</div></div>` : '<div class="postural-photo"><div class="empty">Sem foto</div><div class="lbl">Anterior · Braços abertos</div></div>'}
          ${ev.fotoLateralD ? `<div class="postural-photo"><img src="${ev.fotoLateralD}" /><div class="lbl">Lateral Direita</div></div>` : '<div class="postural-photo"><div class="empty">Sem foto</div><div class="lbl">Lateral Direita</div></div>'}
          ${ev.fotoLateralE ? `<div class="postural-photo"><img src="${ev.fotoLateralE}" /><div class="lbl">Lateral Esquerda</div></div>` : '<div class="postural-photo"><div class="empty">Sem foto</div><div class="lbl">Lateral Esquerda</div></div>'}
          ${ev.fotoCostas ? `<div class="postural-photo"><img src="${ev.fotoCostas}" /><div class="lbl">Posterior</div></div>` : '<div class="postural-photo"><div class="empty">Sem foto</div><div class="lbl">Posterior</div></div>'}
        </div>

        ${ev.classificacaoPostural ? `
        <div class="classificacao-postural" style="background:${corClassPost}15;border-color:${corClassPost}40;">
          <div class="cp-label" style="color:${corClassPost};">CLASSIFICAÇÃO POSTURAL GERAL</div>
          <div class="cp-value" style="color:${corClassPost};">${ev.classificacaoPostural}</div>
        </div>` : ''}

        ${ev.parecerFinal ? `
        <div class="parecer-box">
          <div class="parecer-label">PARECER FINAL & RECOMENDAÇÕES</div>
          <p>${ev.parecerFinal}</p>
        </div>` : ''}
      </div>`;

    // ============ ENTENDA SEUS RESULTADOS ============
    const paginaEntenda = `
      <div class="page">
        ${brandHeader}
        <div class="title-section">
          <div class="title-label">GUIA DO ATLETA</div>
          <h1>ENTENDA SEUS RESULTADOS</h1>
          <div class="title-sub">O que cada métrica significa para o seu desempenho</div>
        </div>

        <div class="entenda-grid">
          ${modulos.morfologico ? `
          <div class="entenda-card">
            <div class="entenda-title">IMC · Índice de Massa Corporal</div>
            <p>Divisão do peso pela altura ao quadrado. Indicador inicial de saúde populacional. <strong>Atenção:</strong> em atletas, pode superestimar gordura — sempre analise junto com o percentual de gordura.</p>
          </div>

          <div class="entenda-card">
            <div class="entenda-title">Percentual de Gordura</div>
            <p>Mensurado pelo protocolo Pollock 7 Dobras (Jackson & Pollock 1978). Para atletas: ideal entre 8-12% (homens) e 16-22% (mulheres). Valores muito baixos comprometem hormônios e imunidade.</p>
          </div>

          <div class="entenda-card">
            <div class="entenda-title">TMB · Taxa de Metabolismo Basal</div>
            <p>Quantidade mínima de calorias necessárias para manter as funções vitais em repouso. Base para cálculo das necessidades energéticas diárias.</p>
          </div>

          <div class="entenda-card">
            <div class="entenda-title">RCE · Relação Cintura/Estatura</div>
            <p>Avalia risco cardiovascular pela gordura abdominal. Idealmente, sua cintura deve medir até 50% da sua altura. Valores acima de 0,50 indicam risco elevado.</p>
          </div>` : ''}

          ${modulos.anamnese ? `
          <div class="entenda-card">
            <div class="entenda-title">Duplo Produto</div>
            <p>Estimativa do esforço cardíaco (FC × PA Sistólica). Em repouso, varia de 5.500 a 11.300. Quanto menor, mais saudável o coração. Valores altos indicam sobrecarga cardiovascular.</p>
          </div>

          <div class="entenda-card">
            <div class="entenda-title">Pressão Arterial</div>
            <p>Classificada segundo a Diretriz Brasileira de Hipertensão (2020). Valores ideais: abaixo de 120/80 mmHg. Níveis elevados aumentam risco cardiovascular.</p>
          </div>

          <div class="entenda-card">
            <div class="entenda-title">Zonas de Treinamento (Karvonen)</div>
            <p>Faixas de FC para diferentes objetivos: Z1 recuperação · Z2-Z3 base aeróbica · Z4 limiar anaeróbico · Z5 potência máxima. Use com critério, respeitando o periodização.</p>
          </div>` : ''}
        </div>

        ${modulos.neuromotor ? `
        <div class="section-divider" style="margin-top:18px;">
          <div class="section-num">02</div>
          <h2>Performance & Força</h2>
        </div>

        <div class="entenda-grid">
          <div class="entenda-card">
            <div class="entenda-title">Força Muscular & Assimetrias</div>
            <p>Medida com dinamômetro. Chance de lesão por assimetria: abaixo de 10% baixa, entre 10-20% média, acima de 20% alta. Referência adaptada de Croisier (2002).</p>
          </div>

          <div class="entenda-card">
            <div class="entenda-title">Saltos: CMJ, SJ e Horizontal</div>
            <p>CMJ mede potência com energia elástica. SJ mede potência pura. Horizontal avalia força explosiva. O Índice de Elasticidade (CMJ vs SJ) revela aproveitamento da energia elástica.</p>
          </div>

          <div class="entenda-card">
            <div class="entenda-title">Banco de Wells</div>
            <p>Avalia flexibilidade da cadeia posterior (isquiotibiais e lombar). Fundamental para prevenir lesões e otimizar amplitude de movimento durante movimentos esportivos.</p>
          </div>
        </div>` : ''}

        <div class="ref-box">
          <div class="ref-title">⚠ IMPORTANTE</div>
          <div class="ref-list">
            <div class="ref-item">Este relatório é um <strong>documento técnico de avaliação física</strong>.</div>
            <div class="ref-item">Não substitui consulta médica especializada.</div>
            <div class="ref-item">Use como ferramenta para direcionar seu treinamento e acompanhar evolução.</div>
          </div>
        </div>

        <div style="margin-top:20px;text-align:center;font-size:8px;color:#94a3b8;font-style:italic;">
          Este relatório é um documento técnico de avaliação física e não substitui consulta médica especializada.
        </div>
      </div>`;

    // ============ HTML COMPLETO ============
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Relatório - ${ev.nome}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Helvetica', Arial, sans-serif; }
  body { color: #1e293b; line-height: 1.45; font-size: 10px; background: white; }
  .page { page-break-after: always; padding-bottom: 20px; min-height: 270mm; }
  .page:last-child { page-break-after: auto; }

  /* HEADER MARCA */
  .header-brand { display: flex; align-items: center; gap: 10px; padding-bottom: 10px; margin-bottom: 16px; border-bottom: 2px solid #1e40af; }
  .header-brand .logo { width: 38px; height: 38px; background: linear-gradient(135deg, #1e40af, #7c3aed); border-radius: 9px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 18px; flex-shrink: 0; }
  .header-brand .brand-text { flex: 1; }
  .header-brand .brand-name { font-weight: 900; font-size: 14px; color: #0f172a; letter-spacing: 0.5px; line-height: 1; }
  .header-brand .brand-name span { color: #1e40af; }
  .header-brand .brand-tagline { line-height: 1; }
  .header-brand .brand-tagline .tag-main { font-size: 7px; color: #64748b; font-weight: 700; letter-spacing: 1.2px; }
  .header-brand .brand-tagline .tag-sub { font-size: 5.5px; color: #94a3b8; font-weight: 600; letter-spacing: 1.5px; margin-top: 2px; font-style: italic; }
  .header-brand .header-meta { text-align: right; }
  .header-brand .meta-athlete { font-size: 10px; font-weight: 800; color: #1e40af; }
  .header-brand .meta-date { font-size: 8px; color: #64748b; font-weight: 600; margin-top: 1px; }

  /* CAPA */
  .page-cover { display: flex; flex-direction: column; padding: 0; }
  .cover-top { padding: 30px 0 20px; }
  .cover-logo { display: flex; align-items: center; gap: 14px; }
  .cover-logo-icon { width: 56px; height: 56px; background: linear-gradient(135deg, #1e40af, #7c3aed); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 28px; }
  .cover-logo-name { font-weight: 900; font-size: 22px; color: #0f172a; letter-spacing: 1px; line-height: 1; }
  .cover-logo-name span { color: #1e40af; }
  .cover-logo-tag { line-height: 1; margin-top: 4px; }
  .cover-logo-tag .tag-main { font-size: 9px; color: #64748b; font-weight: 700; letter-spacing: 1.5px; }
  .cover-logo-tag .tag-sub { font-size: 7px; color: #94a3b8; font-weight: 600; letter-spacing: 2px; margin-top: 3px; font-style: italic; }
  .cover-divider { height: 4px; background: linear-gradient(90deg, #1e40af, #7c3aed, transparent); margin: 24px 0; border-radius: 2px; }
  .cover-title-block { padding: 0 0 30px; }
  .cover-title-label { font-size: 11px; color: #64748b; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; }
  .cover-title-block h1 { font-size: 32px; font-weight: 900; color: #0f172a; margin-top: 6px; letter-spacing: -0.8px; line-height: 1.05; }
  .cover-athlete-block { margin-top: 24px; padding: 18px 20px; background: linear-gradient(135deg, #eff6ff, #f5f3ff); border-radius: 14px; border-left: 4px solid #1e40af; }
  .cover-athlete-label { font-size: 9px; color: #64748b; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
  .cover-athlete-name { font-size: 22px; font-weight: 900; color: #1e40af; margin-top: 4px; line-height: 1.1; }
  .cover-athlete-meta { font-size: 11px; color: #475569; font-weight: 600; margin-top: 4px; }

  .cover-letter { background: #fafbff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px 28px; position: relative; }
  .letter-quote-mark { position: absolute; top: -10px; left: 24px; font-size: 70px; color: #1e40af; font-family: Georgia, serif; line-height: 1; opacity: 0.15; font-weight: 900; }
  .letter-content { position: relative; }
  .letter-greeting { font-size: 18px; font-weight: 900; color: #1e40af; margin-bottom: 14px; }
  .letter-content p { font-size: 11px; line-height: 1.75; color: #334155; margin-bottom: 10px; }
  .letter-content p strong { color: #0f172a; }
  .letter-quote { background: white; border-left: 3px solid #1e40af; padding: 12px 16px; border-radius: 0 10px 10px 0; margin: 14px 0; }
  .letter-quote em { font-size: 12px; color: #1e40af; font-weight: 600; font-style: italic; }
  .letter-quote-author { font-size: 9px; color: #64748b; font-weight: 700; letter-spacing: 0.5px; margin-top: 6px; }
  .letter-closer { font-style: italic; color: #1e40af !important; font-weight: 600 !important; margin-top: 14px !important; }
  .letter-signature { margin-top: 20px; padding-top: 18px; border-top: 1px solid #e2e8f0; text-align: right; }
  .sig-line { display: inline-block; width: 180px; height: 1px; background: #cbd5e1; margin-bottom: 8px; }
  .sig-name { font-size: 16px; font-weight: 900; color: #1e40af; line-height: 1; }
  .sig-role { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 4px; }

  /* TÍTULOS DE PÁGINA */
  .title-section { padding-bottom: 14px; margin-bottom: 18px; border-bottom: 3px solid #1e40af; }
  .title-label { font-size: 10px; color: #1e40af; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; }
  .title-section h1 { font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; margin-top: 4px; }
  .title-section .title-sub { color: #64748b; font-size: 10px; margin-top: 4px; font-weight: 500; }
  .section-divider { display: flex; align-items: center; gap: 10px; margin-top: 22px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0; }
  .section-divider .section-num { background: linear-gradient(135deg, #1e40af, #7c3aed); color: white; padding: 4px 10px; border-radius: 6px; font-weight: 900; font-size: 10px; letter-spacing: 1px; }
  .section-divider h2 { font-size: 14px; font-weight: 800; color: #0f172a; }

  /* INFO BLOCKS */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  .info-block h3 { font-size: 10px; color: #1e40af; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
  .info-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 10px; border-bottom: 1px dotted #e2e8f0; }
  .info-row .lbl { color: #64748b; }
  .info-row .val { font-weight: 700; color: #0f172a; }
  .info-block-full { background: #f8fafc; border-radius: 10px; padding: 14px 16px; margin-top: 12px; border-left: 3px solid #1e40af; }
  .info-block-full h3 { font-size: 10px; color: #1e40af; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
  .info-block-full p { font-size: 10px; color: #334155; line-height: 1.55; }

  .objetivo-box { background: linear-gradient(135deg, #1e40af, #7c3aed); color: white; padding: 14px 18px; border-radius: 12px; margin: 14px 0; }
  .objetivo-label { font-size: 9px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; opacity: 0.85; }
  .objetivo-text { font-size: 12px; font-weight: 600; margin-top: 4px; line-height: 1.4; }

  /* VITAL CARDS */
  .vitals-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px; }
  .vitals-grid.four { grid-template-columns: 1fr 1fr 1fr 1fr; }
  .vital-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
  .vital-card.mini { padding: 10px; }
  .vital-card.vital-highlight { background: linear-gradient(135deg, #1e40af, #7c3aed); color: white; border: none; }
  .vital-label { font-size: 8px; color: #64748b; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; }
  .vital-card.vital-highlight .vital-label { color: rgba(255,255,255,0.85); }
  .vital-value { font-size: 22px; font-weight: 900; color: #0f172a; margin-top: 4px; line-height: 1; }
  .vital-value small { font-size: 10px; font-weight: 700; color: #64748b; }
  .vital-card.vital-highlight .vital-value { color: white; }
  .vital-card.vital-highlight .vital-value small { color: rgba(255,255,255,0.85); }
  .vital-unit { font-size: 8px; color: #64748b; font-weight: 700; margin-top: 3px; letter-spacing: 0.5px; }
  .vital-card.vital-highlight .vital-unit { color: rgba(255,255,255,0.85); }
  .vital-status { font-size: 9px; font-weight: 800; margin-top: 4px; }
  .vital-card.vital-highlight .vital-status { color: white; }

  /* TABELAS */
  .data-table, .zonas-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9.5px; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 0 #e2e8f0; }
  .data-table th, .zonas-table th { background: linear-gradient(135deg, #1e40af, #7c3aed); color: white; padding: 8px 10px; text-align: left; font-weight: 800; font-size: 9px; letter-spacing: 0.5px; text-transform: uppercase; }
  .data-table td, .zonas-table td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; background: white; }
  .data-table tr:nth-child(even) td, .zonas-table tr:nth-child(even) td { background: #f8fafc; }

  /* DOBRAS */
  .dobras-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
  .dobra-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
  .dobra-label { font-size: 8px; color: #64748b; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; }
  .dobra-value { font-size: 18px; font-weight: 900; color: #0f172a; margin-top: 4px; line-height: 1; }
  .dobra-value small { font-size: 9px; color: #64748b; }

  .resultado-destaque { display: flex; align-items: center; background: linear-gradient(135deg, #1e40af, #7c3aed); color: white; border-radius: 14px; padding: 18px 24px; margin: 16px 0; gap: 24px; }
  .resultado-item { flex: 1; }
  .resultado-divider { width: 1px; background: rgba(255,255,255,0.3); align-self: stretch; }
  .resultado-label { font-size: 9px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.85; }
  .resultado-value { font-size: 24px; font-weight: 900; margin-top: 4px; line-height: 1; }
  .resultado-value small { font-size: 12px; opacity: 0.85; }
  .resultado-main .resultado-value-big { font-size: 36px; font-weight: 900; margin-top: 4px; line-height: 1; }
  .resultado-main .resultado-value-big small { font-size: 16px; opacity: 0.85; }
  .resultado-tag { font-size: 10px; font-weight: 700; opacity: 0.95; margin-top: 4px; }

  /* REF BOX */
  .ref-box { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px 18px; margin-top: 16px; }
  .ref-title { font-size: 10px; color: #1e40af; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 8px; }
  .ref-item { font-size: 9.5px; color: #1e3a8a; line-height: 1.6; padding: 1px 0; }
  .ref-item strong { font-weight: 700; }

  /* PROTOCOL BOX */
  .protocol-box { display: flex; gap: 14px; background: linear-gradient(135deg, #f0f9ff, #f5f3ff); border: 1px solid #c7d2fe; border-radius: 12px; padding: 14px 18px; margin-bottom: 18px; }
  .protocol-icon { font-size: 22px; flex-shrink: 0; }
  .protocol-content { flex: 1; }
  .protocol-title { font-size: 10px; color: #1e40af; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px; }
  .protocol-content p { font-size: 9.5px; color: #334155; line-height: 1.55; }
  .protocol-content strong { color: #1e40af; font-weight: 700; }

  /* CRITÉRIOS */
  .criterios-section-title { font-size: 9px; font-weight: 900; color: #475569; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; text-align: center; }

  /* SELO VISUAL - CHANCE DE LESÃO */
  .selo-assimetria { background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; margin-bottom: 14px; }
  .selo-titulo { font-size: 9px; font-weight: 900; color: #334155; text-transform: uppercase; letter-spacing: 1.5px; text-align: center; margin-bottom: 12px; }
  .selo-faixas { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .selo-faixa { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; background: white; border: 1px solid #e2e8f0; }
  .selo-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  .selo-info { }
  .selo-label { font-size: 10px; font-weight: 900; color: #1e293b; letter-spacing: 0.5px; }
  .selo-range { font-size: 8px; color: #64748b; font-weight: 600; margin-top: 1px; }
  .criterios-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .criterio-card { padding: 10px; border-radius: 10px; text-align: center; border: 2px solid; }
  .criterio-card.ideal-bg, .criterio-card.excelente-bg, .criterio-card.baixa-bg { background: #d1fae5; border-color: #10b981; }
  .criterio-card.bom-bg { background: #dbeafe; border-color: #3b82f6; }
  .criterio-card.atencao-bg, .criterio-card.media-bg { background: #fff7ed; border-color: #f97316; }
  .criterio-card.moderado-bg { background: #ffe4e6; border-color: #e11d48; }
  .criterio-card.importante-bg, .criterio-card.alta-bg { background: #fee2e2; border-color: #ef4444; }
  .criterio-label { font-size: 9px; font-weight: 900; letter-spacing: 1.5px; }
  .ideal-bg .criterio-label, .excelente-bg .criterio-label, .baixa-bg .criterio-label { color: #065f46; }
  .bom-bg .criterio-label { color: #1e40af; }
  .atencao-bg .criterio-label, .media-bg .criterio-label { color: #9a3412; }
  .moderado-bg .criterio-label { color: #9f1239; }
  .importante-bg .criterio-label, .alta-bg .criterio-label { color: #991b1b; }
  .criterio-value { font-size: 16px; font-weight: 900; margin-top: 4px; line-height: 1; }
  .ideal-bg .criterio-value, .excelente-bg .criterio-value, .baixa-bg .criterio-value { color: #065f46; }
  .bom-bg .criterio-value { color: #1e40af; }
  .atencao-bg .criterio-value, .media-bg .criterio-value { color: #9a3412; }
  .moderado-bg .criterio-value { color: #9f1239; }
  .importante-bg .criterio-value, .alta-bg .criterio-value { color: #991b1b; }
  .criterio-desc { font-size: 8px; font-weight: 600; margin-top: 4px; }
  .ideal-bg .criterio-desc { color: #065f46; }
  .atencao-bg .criterio-desc { color: #78350f; }
  .risco-bg .criterio-desc { color: #991b1b; }

  /* FORÇA (mantém estilo) */
  .forca-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .forca-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; }
  .forca-card .name { font-size: 10px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
  .forca-card .desc { font-size: 8.5px; color: #64748b; line-height: 1.4; margin-bottom: 6px; min-height: 22px; }
  .forca-card .stats { display: flex; justify-content: space-between; align-items: center; margin-top: 6px; padding-top: 6px; border-top: 1px solid #f1f5f9; font-size: 9px; }
  .forca-card .stats .lbl { color: #64748b; font-weight: 600; }
  .forca-card .stats .val { font-weight: 800; color: #0f172a; }
  .status-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 8px; font-weight: 800; }
  .baixa { background: #d1fae5; color: #065f46; }
  .media { background: #fff7ed; color: #9a3412; }
  .alta { background: #fee2e2; color: #991b1b; }
  .sem_dado { background: #f1f5f9; color: #64748b; }

  /* TESTE NEUROMOTOR */
  .test-row { display: grid; grid-template-columns: 1fr 2fr; gap: 12px; align-items: stretch; }
  .test-result { background: linear-gradient(135deg, #1e40af, #7c3aed); color: white; padding: 16px; border-radius: 12px; display: flex; flex-direction: column; justify-content: center; }
  .test-label { font-size: 9px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; opacity: 0.85; }
  .test-value { font-size: 32px; font-weight: 900; margin-top: 4px; line-height: 1; }
  .test-value small { font-size: 12px; opacity: 0.85; }
  .test-class { padding: 16px; border-radius: 12px; border: 2px solid; display: flex; flex-direction: column; justify-content: center; }
  .test-class-label { font-size: 9px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; opacity: 0.85; }
  .test-class-value { font-size: 22px; font-weight: 900; margin-top: 4px; line-height: 1; }
  .test-class-ref { font-size: 9px; font-weight: 700; opacity: 0.85; margin-top: 4px; }

  /* SALTOS */
  .saltos-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .salto-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
  .salto-header { padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; margin-bottom: 10px; }
  .salto-name { font-size: 14px; font-weight: 900; color: #1e40af; line-height: 1; }
  .salto-tag { font-size: 8px; color: #64748b; font-weight: 600; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.5px; }
  .salto-body { text-align: center; }
  .salto-value { font-size: 24px; font-weight: 900; color: #0f172a; line-height: 1; margin-bottom: 8px; }
  .salto-value small { font-size: 10px; color: #64748b; }
  .salto-class { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 10px; font-weight: 800; }
  .salto-watts { font-size: 9px; color: #1e40af; font-weight: 800; margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; }
  .salto-watts small { color: #64748b; font-weight: 600; }

  /* POSTURAL */
  .postural-photos { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 12px; }
  .postural-photo { text-align: center; }
  .postural-photo img { width: 100%; aspect-ratio: 3/4; object-fit: cover; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; }
  .postural-photo .empty { width: 100%; aspect-ratio: 3/4; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 9px; }
  .postural-photo .lbl { font-size: 8px; font-weight: 800; margin-top: 6px; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }

  .classificacao-postural { padding: 16px 20px; border: 2px solid; border-radius: 14px; margin-top: 18px; text-align: center; }
  .cp-label { font-size: 9px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
  .cp-value { font-size: 24px; font-weight: 900; margin-top: 6px; line-height: 1; }

  .parecer-box { background: linear-gradient(135deg, #1e40af, #7c3aed); color: white; padding: 16px 20px; border-radius: 14px; margin-top: 14px; }
  .parecer-label { font-size: 10px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 6px; opacity: 0.9; }
  .parecer-box p { font-size: 11px; line-height: 1.6; }

  /* ENTENDA */
  .entenda-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .entenda-card { background: #f8fafc; border-left: 3px solid #1e40af; border-radius: 0 10px 10px 0; padding: 12px 14px; }
  .entenda-title { font-size: 10px; font-weight: 900; color: #1e40af; margin-bottom: 4px; }
  .entenda-card p { font-size: 9.5px; color: #334155; line-height: 1.55; }
  .entenda-card p strong { color: #0f172a; font-weight: 700; }

  /* SIGNATURES */
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 30px; padding-top: 20px; }
  .sig-block { text-align: center; }
  .sig-line-h { height: 1px; background: #cbd5e1; margin-bottom: 10px; }
  .sig-title { font-size: 9px; color: #64748b; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
  .sig-name-final { font-size: 13px; font-weight: 900; color: #1e40af; margin-top: 4px; }
  .sig-role-final { font-size: 9px; color: #64748b; font-weight: 700; margin-top: 2px; text-transform: uppercase; letter-spacing: 1px; }
</style>
</head>
<body>
${paginaCapa}
${paginaAnamnese}
${paginaMorfo}
${paginaForca}
${paginaNeuro}
${paginaEntenda}
</body>
</html>`;

    // Salva HTML no state — renderiza inline
    setReportHtml(html);
    } catch (err) {
      alert('Erro ao gerar PDF: ' + err.message);
      console.error('Erro PDF:', err);
    }
  }


  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-500 text-sm">Carregando...</div>
    </div>;
  }

  // ============ VISUALIZAÇÃO DO RELATÓRIO ============
  if (reportHtml) {
    const bodyMatch = reportHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const styleMatch = reportHtml.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : reportHtml;
    const styleContent = styleMatch ? styleMatch[1] : '';

    const handlePrint = () => {
      // Abre nova janela com o relatório pra impressão/PDF
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(reportHtml);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    };

    const handleDownloadHTML = () => {
      // Fallback: download como HTML (abre no navegador e pode salvar como PDF)
      const blob = new Blob([reportHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Relatorio_LINS_TRAINING_${currentEvaluation.nome || 'Atleta'}.html`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    };

    return (
      <div style={{ minHeight: '100vh', background: 'white' }}>
        {/* Barra de ações */}
        <div style={{ 
          background: 'linear-gradient(135deg, #1e40af, #7c3aed)', 
          color: 'white', 
          padding: '12px 16px', 
          position: 'sticky', 
          top: 0, 
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }} className="print:hidden">
          <button 
            onClick={() => setReportHtml(null)} 
            style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '8px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
          >
            ← Voltar
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={handlePrint}
              style={{ background: 'white', color: '#1e40af', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 800, border: 'none', cursor: 'pointer' }}
            >
              📄 Salvar PDF
            </button>
            <button 
              onClick={handleDownloadHTML}
              style={{ background: 'rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer' }}
            >
              ⬇ Baixar HTML
            </button>
          </div>
        </div>

        {/* Relatório renderizado */}
        <style dangerouslySetInnerHTML={{ __html: styleContent }} />
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            .print\\:hidden { display: none !important; }
          }
        `}} />
        <div dangerouslySetInnerHTML={{ __html: bodyContent }} />
      </div>
    );
  }

  // ============ HEADER ============
  const Header = () => (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-black text-slate-900 text-sm tracking-tight leading-none">
              LINS <span className="text-indigo-600">TRAINING</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium tracking-wider mt-0.5">AVALIAÇÃO FÍSICA</div>
          </div>
        </div>
        {view !== 'home' && (
          <button onClick={() => setView('home')} className="text-xs font-bold text-slate-600 hover:text-indigo-700 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Início
          </button>
        )}
      </div>
    </div>
  );

  // ============ HOME ============
  if (view === 'home') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Bem-vindo de volta</h1>
            <p className="text-slate-500 text-sm mt-1">Sistema modular de avaliação física</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <Users className="w-5 h-5 text-indigo-700 mb-2" />
              <div className="text-2xl font-black text-slate-900">{athletes.length}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Atletas</div>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <FileText className="w-5 h-5 text-indigo-700 mb-2" />
              <div className="text-2xl font-black text-slate-900">{evaluations.length}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Avaliações</div>
            </div>
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-4 text-white col-span-2 sm:col-span-1">
              <TrendingUp className="w-5 h-5 mb-2" />
              <div className="text-2xl font-black">4</div>
              <div className="text-[10px] font-bold uppercase tracking-wider mt-1 opacity-80">Módulos</div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <button onClick={novoAtleta} className="bg-gradient-to-br from-indigo-600 to-purple-600 hover:opacity-95 text-white rounded-2xl p-6 text-left transition">
              <Plus className="w-6 h-6 mb-3" />
              <div className="font-bold text-base">Nova Avaliação</div>
              <div className="text-xs opacity-80 mt-1">Iniciar avaliação completa de atleta</div>
            </button>
            <button onClick={() => setView('athletes')} className="bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-2xl p-6 text-left transition">
              <Users className="w-6 h-6 mb-3 text-indigo-700" />
              <div className="font-bold text-base">Meus Atletas</div>
              <div className="text-xs text-slate-500 mt-1">Ver histórico e evolução</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ ATLETAS ============
  if (view === 'athletes') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black text-slate-900">Meus Atletas</h1>
              <p className="text-slate-500 text-sm mt-1">{athletes.length} atleta{athletes.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={novoAtleta} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo
            </button>
          </div>
          {athletes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Nenhum atleta cadastrado ainda</p>
              <button onClick={novoAtleta} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold">
                Cadastrar primeiro atleta
              </button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {athletes.map(a => {
                const evals = evaluations.filter(e => e.athleteId === a.id);
                return (
                  <button key={a.id} onClick={() => abrirAtleta(a.id)} className="bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl p-5 text-left transition">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black">
                          {a.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{a.nome}</div>
                          <div className="text-xs text-slate-500">{a.idade} anos · {a.genero}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{evals.length} avaliaç{evals.length !== 1 ? 'ões' : 'ão'}</span>
                      {evals.length > 0 && <span className="text-indigo-700 font-bold">Última: {new Date(evals[evals.length - 1].date).toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ HISTÓRICO ============
  if (view === 'history') {
    const atleta = athletes.find(a => a.id === currentAthleteId);
    const evals = evaluations.filter(e => e.athleteId === currentAthleteId).sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!atleta) { setView('athletes'); return null; }
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button onClick={() => setView('athletes')} className="text-xs font-bold text-slate-600 mb-4 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl">
                  {atleta.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900">{atleta.nome}</h1>
                  <p className="text-sm text-slate-500">{atleta.idade} anos · {atleta.genero}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => novaAvaliacao(currentAthleteId)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Nova Avaliação
                </button>
                <button onClick={() => excluirAtleta(currentAthleteId)} className="bg-red-50 text-red-600 px-3 py-2 rounded-xl text-xs font-bold">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          <h2 className="font-bold text-slate-900 mb-3 text-sm uppercase tracking-wider">Histórico de Avaliações</h2>
          {evals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Nenhuma avaliação ainda</p>
            </div>
          ) : (
            <div className="space-y-2">
              {evals.map(ev => (
                <button key={ev.id} onClick={() => verAvaliacao(ev.id)} className="w-full bg-white hover:bg-slate-50 border border-slate-200 rounded-xl p-4 text-left transition flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-indigo-700" />
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{new Date(ev.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Massa: {ev.massa || '—'}kg · FC repouso: {ev.fcRepouso || '—'} bpm</div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============ REPORT (com PDF Builder) ============
  if (view === 'report') {
    const moduloItens = [
      { key: 'anamnese', label: 'Anamnese', desc: 'Dados, perfil esportivo e zonas Karvonen', icon: ClipboardList, color: '#4f46e5' },
      { key: 'morfologico', label: 'Morfológico', desc: 'Composição, perimetria e dobras', icon: Ruler, color: '#2563eb' },
      { key: 'forca', label: 'Força Muscular', desc: 'Dinamometria e assimetrias D vs E', icon: Dumbbell, color: '#7c3aed' },
      { key: 'neuromotor', label: 'Neuromotor', desc: 'RML, saltos e flexibilidade', icon: Zap, color: '#db2777' },
    ];
    const algumMarcado = Object.values(pdfModulos).some(v => v);

    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button onClick={() => setView(currentAthleteId ? 'history' : 'athletes')} className="text-xs font-bold text-slate-600 mb-4 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-4">
            <div className="text-[10px] font-bold tracking-wider opacity-70 uppercase">Avaliação salva</div>
            <h1 className="text-2xl font-black mt-1">{currentEvaluation.nome}</h1>
            <div className="text-sm opacity-80 mt-1">{new Date(currentEvaluation.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm mb-4">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-indigo-700" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Gerar Relatório PDF</h3>
                <p className="text-xs text-slate-500 mt-0.5">v2 · Marque quais módulos quer no PDF do atleta</p>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {moduloItens.map(m => {
                const Icon = m.icon;
                const marked = pdfModulos[m.key];
                return (
                  <button
                    key={m.key}
                    onClick={() => setPdfModulos({ ...pdfModulos, [m.key]: !marked })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                      marked ? 'bg-white shadow-sm' : 'bg-slate-50 border-slate-200'
                    }`}
                    style={marked ? { borderColor: m.color } : {}}
                  >
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: marked ? m.color : '#e2e8f0' }}>
                      <Icon className="w-4 h-4" style={{ color: marked ? 'white' : '#94a3b8' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-900">{m.label}</div>
                      <div className="text-[11px] text-slate-500">{m.desc}</div>
                    </div>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${marked ? 'border-transparent' : 'border-slate-300 bg-white'}`} style={marked ? { background: m.color } : {}}>
                      {marked && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-blue-50 border-l-3 border-blue-500 rounded-r-lg p-3 mb-5">
              <div className="text-[11px] text-blue-800 leading-relaxed">
                <strong>📌 A carta de abertura</strong> da Lins Training aparece em todos os PDFs, mesmo se você selecionar só um módulo. <strong>O cabeçalho</strong> mostra apenas nome do atleta e data.
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => { setCurrentModule(1); setView('evaluation'); }}
                className="flex-1 bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold"
              >
                Editar
              </button>
              <button
                onClick={() => gerarPDF(pdfModulos)}
                disabled={!algumMarcado}
                className={`flex-1 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${
                  algumMarcado
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:opacity-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Download className="w-4 h-4" /> Gerar PDF
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-xs">
            💡 <strong>Dica:</strong> No celular, ao gerar o PDF, abrirá uma nova aba com o relatório pronto pra imprimir ou salvar como PDF.
          </div>
        </div>
      </div>
    );
  }


  // ============ AVALIAÇÃO MODULAR ============
  const modulos = [
    { num: 1, label: 'Anamnese', icon: ClipboardList, color: 'indigo' },
    { num: 2, label: 'Morfológico', icon: Ruler, color: 'blue' },
    { num: 3, label: 'Força', icon: Dumbbell, color: 'purple' },
    { num: 4, label: 'Neuromotor', icon: Zap, color: 'pink' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Navegação dos módulos */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 mb-4 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {modulos.map((m, i) => {
              const active = currentModule === m.num;
              const Icon = m.icon;
              return (
                <React.Fragment key={m.num}>
                  <button onClick={() => setCurrentModule(m.num)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                      active ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'
                    }`}>
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                  {i < modulos.length - 1 && <div className="w-2 h-px bg-slate-200" />}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* MÓDULO 1 — ANAMNESE */}
        {currentModule === 1 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-indigo-900">Módulo 1 · Anamnese</div>
                  <div className="text-xs text-indigo-700">Identificação, histórico e zonas de treinamento</div>
                </div>
              </div>
            </div>

            <Card icon={User} title="Identificação" subtitle="Dados pessoais do atleta">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Nome Completo" value={currentEvaluation.nome} onChange={update('nome')} type="text" placeholder="Nome do atleta" />
                <Input label="E-mail" value={currentEvaluation.email} onChange={update('email')} type="email" placeholder="email@exemplo.com" />
                <Input label="Telefone" value={currentEvaluation.telefone} onChange={update('telefone')} type="tel" placeholder="(11) 99999-9999" />
                <Input label="Data de Nascimento" value={currentEvaluation.dataNascimento} onChange={update('dataNascimento')} type="date" />
                <Input label="Idade" value={currentEvaluation.idade} onChange={update('idade')} unit="anos" />
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Gênero</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['masculino', 'feminina'].map(g => (
                      <button key={g} onClick={() => update('genero')(g)} className={`py-2.5 rounded-lg text-sm font-bold border transition ${
                        currentEvaluation.genero === g ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent' : 'bg-white text-slate-700 border-slate-200'
                      }`}>{g === 'masculino' ? 'Masculino' : 'Feminina'}</button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card icon={Target} title="Perfil Esportivo" subtitle="Modalidade e contexto competitivo">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Modalidade" value={currentEvaluation.modalidade} onChange={update('modalidade')} type="text" placeholder="Futebol, vôlei, basquete..." />
                <Input label="Posição" value={currentEvaluation.posicao} onChange={update('posicao')} type="text" placeholder="Atacante, lateral..." />
                <Input label="Clube / Equipe" value={currentEvaluation.clube} onChange={update('clube')} type="text" placeholder="Nome do clube" />
                <Input label="Tempo de Experiência" value={currentEvaluation.tempoExperiencia} onChange={update('tempoExperiencia')} type="text" placeholder="Ex: 8 anos" />
              </div>
              <div className="mt-4">
                <TextArea label="Objetivo Principal" value={currentEvaluation.objetivo} onChange={update('objetivo')} placeholder="O que o atleta busca alcançar com essa avaliação..." rows={2} />
              </div>
            </Card>

            <Card icon={FileText} title="Histórico Clínico" subtitle="Lesões, medicações e observações">
              <div className="space-y-3">
                <TextArea label="Histórico de Lesões" value={currentEvaluation.historicoLesoes} onChange={update('historicoLesoes')} placeholder="Lesões anteriores, cirurgias, áreas sensíveis..." rows={3} />
                <TextArea label="Medicações em Uso" value={currentEvaluation.medicacoes} onChange={update('medicacoes')} placeholder="Medicamentos, suplementação..." rows={2} />
                <TextArea label="Observações Adicionais" value={currentEvaluation.observacoesAnamnese} onChange={update('observacoesAnamnese')} placeholder="Qualquer informação relevante para a avaliação..." rows={2} />
              </div>
            </Card>

            <Card icon={Heart} title="Sinais Vitais & Zonas de Treinamento" subtitle="Fórmula de Karvonen — calcula automaticamente">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <Input label="Pressão Sistólica" value={currentEvaluation.sistolica} onChange={update('sistolica')} unit="mmHg" />
                <Input label="Pressão Diastólica" value={currentEvaluation.diastolica} onChange={update('diastolica')} unit="mmHg" />
                <Input label="FC em Repouso" value={currentEvaluation.fcRepouso} onChange={update('fcRepouso')} unit="bpm" />
              </div>
              <ZonasFC zonas={zonasFC} />
              {zonasFC && (
                <div className="mt-4 bg-blue-50 border-l-3 border-blue-500 rounded-r-lg p-3">
                  <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Como interpretar</div>
                  <div className="text-xs text-blue-800 leading-relaxed">
                    A <strong>Fórmula de Karvonen</strong> usa sua FC de reserva ({zonasFC.fcReserva} bpm) para calcular zonas mais precisas que a fórmula tradicional. As zonas <strong>Z2 e Z3</strong> são ideais para base aeróbica; <strong>Z4</strong> trabalha o limiar; <strong>Z5</strong> é potência máxima e deve ser usada com critério.
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* MÓDULO 2 — MORFOLÓGICO */}
        {currentModule === 2 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                  <Ruler className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-blue-900">Módulo 2 · Morfológico</div>
                  <div className="text-xs text-blue-700">Composição, perimetria e dobras cutâneas</div>
                </div>
              </div>
            </div>

            <Card icon={Ruler} title="Composição Básica" subtitle="Massa corporal e estatura">
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <Input label="Massa Corporal" value={currentEvaluation.massa} onChange={update('massa')} unit="kg" />
                <Input label="Estatura" value={currentEvaluation.estatura} onChange={update('estatura')} unit="cm" />
              </div>
              {/* Cards de cálculos automáticos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">IMC</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{calcIMC()}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">kg/m²</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">RCE</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{(() => {
                    const c = parseFloat(currentEvaluation.cintura), h = parseFloat(currentEvaluation.estatura);
                    return (c && h) ? (c / h).toFixed(2).replace('.', ',') : '0,00';
                  })()}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">cintura/estatura</div>
                </div>
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-3 text-white">
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">% Gordura</div>
                  <div className="text-2xl font-black mt-1">{calcGordura()}%</div>
                  <div className="text-[9px] opacity-80 mt-0.5">Pollock 7</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">TMB</div>
                  <div className="text-2xl font-black text-slate-900 mt-1">{calcTMB()}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5">kcal/dia</div>
                </div>
              </div>
            </Card>

            <Card icon={Target} title="Perimetria" subtitle="11 medidas circunferenciais (cm)">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tronco Superior</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <Input label="Ombro" value={currentEvaluation.ombro} onChange={update('ombro')} unit="cm" />
                <Input label="Peito" value={currentEvaluation.peito} onChange={update('peito')} unit="cm" />
                <Input label="Braço Direito" value={currentEvaluation.bracoDir} onChange={update('bracoDir')} unit="cm" />
                <Input label="Braço Esquerdo" value={currentEvaluation.bracoEsq} onChange={update('bracoEsq')} unit="cm" />
                <Input label="Antebraço Direito" value={currentEvaluation.antebracoDir} onChange={update('antebracoDir')} unit="cm" />
                <Input label="Antebraço Esquerdo" value={currentEvaluation.antebracoEsq} onChange={update('antebracoEsq')} unit="cm" />
                <Input label="Bicipital Direito" value={currentEvaluation.bicipitalDir} onChange={update('bicipitalDir')} unit="cm" />
                <Input label="Bicipital Esquerdo" value={currentEvaluation.bicipitalEsq} onChange={update('bicipitalEsq')} unit="cm" />
              </div>

              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tronco / Abdômen</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
                <Input label="Cintura" value={currentEvaluation.cintura} onChange={update('cintura')} unit="cm" />
                <Input label="Abdômen" value={currentEvaluation.abdomen} onChange={update('abdomen')} unit="cm" />
                <Input label="Quadril" value={currentEvaluation.quadril} onChange={update('quadril')} unit="cm" />
              </div>

              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Membros Inferiores</div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Coxa Proximal Dir" value={currentEvaluation.coxaDir} onChange={update('coxaDir')} unit="cm" />
                <Input label="Coxa Proximal Esq" value={currentEvaluation.coxaEsq} onChange={update('coxaEsq')} unit="cm" />
                <Input label="Coxa Medial Dir" value={currentEvaluation.coxaMedialDir} onChange={update('coxaMedialDir')} unit="cm" />
                <Input label="Coxa Medial Esq" value={currentEvaluation.coxaMedialEsq} onChange={update('coxaMedialEsq')} unit="cm" />
                <Input label="Panturrilha Direita" value={currentEvaluation.panturrilhaDir} onChange={update('panturrilhaDir')} unit="cm" />
                <Input label="Panturrilha Esquerda" value={currentEvaluation.panturrilhaEsq} onChange={update('panturrilhaEsq')} unit="cm" />
              </div>

              {/* Indicador de assimetrias dos perímetros */}
              {(currentEvaluation.bracoDir > 0 || currentEvaluation.coxaDir > 0 || currentEvaluation.panturrilhaDir > 0) && (
                <div className="mt-5 bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-3">Análise de Assimetrias Circunferenciais</div>
                  <div className="space-y-2">
                    {[
                      { label: 'Braço', d: currentEvaluation.bracoDir, e: currentEvaluation.bracoEsq },
                      { label: 'Antebraço', d: currentEvaluation.antebracoDir, e: currentEvaluation.antebracoEsq },
                      { label: 'Coxa Proximal', d: currentEvaluation.coxaDir, e: currentEvaluation.coxaEsq },
                      { label: 'Coxa Medial', d: currentEvaluation.coxaMedialDir, e: currentEvaluation.coxaMedialEsq },
                      { label: 'Panturrilha', d: currentEvaluation.panturrilhaDir, e: currentEvaluation.panturrilhaEsq },
                    ].map((seg, i) => {
                      const a = calcAssimetria(seg.d, seg.e);
                      const info = statusInfo[a.status];
                      return (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-200 last:border-0">
                          <div className="font-bold text-slate-900 text-xs">{seg.label}</div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-slate-500">D: <strong className="text-slate-900">{seg.d || 0}</strong></span>
                            <span className="text-slate-500">E: <strong className="text-slate-900">{seg.e || 0}</strong></span>
                            <span className="text-slate-500">Δ <strong className="text-slate-900">{a.diff}cm</strong></span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: info.bg, color: info.color }}>
                              {info.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Card>

            <Card icon={Activity} title="Dobras Cutâneas" subtitle="Medições em mm — Pollock 7 entra no cálculo do % de gordura">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Input label="Peitoral" value={currentEvaluation.dobraPeitoral} onChange={update('dobraPeitoral')} unit="mm" />
                <Input label="Axilar Média" value={currentEvaluation.dobraAxilarMedia} onChange={update('dobraAxilarMedia')} unit="mm" />
                <Input label="Tríceps" value={currentEvaluation.dobraTriceps} onChange={update('dobraTriceps')} unit="mm" />
                <Input label="Subescapular" value={currentEvaluation.dobraSubescapular} onChange={update('dobraSubescapular')} unit="mm" />
                <Input label="Abdominal" value={currentEvaluation.dobraAbdominal} onChange={update('dobraAbdominal')} unit="mm" />
                <Input label="Suprailíaca" value={currentEvaluation.dobraSuprailiaca} onChange={update('dobraSuprailiaca')} unit="mm" />
                <Input label="Coxa" value={currentEvaluation.dobraCoxa} onChange={update('dobraCoxa')} unit="mm" />
                <Input label="Bicipital" value={currentEvaluation.dobraBicipital} onChange={update('dobraBicipital')} unit="mm" />
                <Input label="Panturrilha" value={currentEvaluation.dobraPanturrilha} onChange={update('dobraPanturrilha')} unit="mm" />
              </div>

              {/* Resultado destacado */}
              <div className="mt-5 grid sm:grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-4 text-white">
                  <div className="text-[10px] font-bold uppercase opacity-80">% Gordura Corporal</div>
                  <div className="text-3xl font-black mt-1">{calcGordura()}%</div>
                  <div className="text-[10px] opacity-80 mt-1">Equação Jackson & Pollock 1978</div>
                </div>
                <div className="bg-slate-100 rounded-xl p-4">
                  <div className="text-[10px] font-bold uppercase text-slate-600">Soma das Dobras</div>
                  <div className="text-3xl font-black mt-1 text-slate-900">{(() => {
                    const e = currentEvaluation;
                    return (parseFloat(e.dobraPeitoral||0) + parseFloat(e.dobraAxilarMedia||0) +
                            parseFloat(e.dobraTriceps||0) + parseFloat(e.dobraSubescapular||0) +
                            parseFloat(e.dobraAbdominal||0) + parseFloat(e.dobraSuprailiaca||0) +
                            parseFloat(e.dobraCoxa||0)).toFixed(1);
                  })()}</div>
                  <div className="text-[10px] mt-1 text-slate-600">mm (7 dobras)</div>
                </div>
                <div className="bg-slate-100 rounded-xl p-4">
                  <div className="text-[10px] font-bold uppercase text-slate-600">TMB</div>
                  <div className="text-3xl font-black mt-1 text-slate-900">{calcTMB()}</div>
                  <div className="text-[10px] mt-1 text-slate-600">kcal/dia</div>
                </div>
              </div>

              <div className="mt-4 bg-blue-50 border-l-3 border-blue-500 rounded-r-lg p-3">
                <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Referência</div>
                <div className="text-xs text-blue-800 leading-relaxed">
                  Para atletas de futebol: <strong>homens 8-12%</strong>, <strong>mulheres 16-22%</strong> de gordura corporal são as faixas ideais. Valores fora dessas faixas merecem atenção nutricional e de performance.
                </div>
              </div>
            </Card>

            {/* Evolução entre avaliações */}
            {(() => {
              const outrasAval = evaluations
                .filter(e => e.athleteId === currentAthleteId && e.id !== currentEvaluation.id && e.massa > 0)
                .sort((a, b) => new Date(b.date) - new Date(a.date));
              if (outrasAval.length === 0) return null;
              const ultima = outrasAval[0];
              const massaAtual = parseFloat(currentEvaluation.massa) || 0;
              const massaAnt = parseFloat(ultima.massa) || 0;
              const diffMassa = massaAtual && massaAnt ? (massaAtual - massaAnt).toFixed(1) : 0;

              return (
                <Card icon={TrendingUp} title="Evolução" subtitle={`Comparado com avaliação de ${new Date(ultima.date).toLocaleDateString('pt-BR')}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                      <div className="text-[9px] font-bold text-slate-500 uppercase">Massa</div>
                      <div className="text-lg font-black text-slate-900 mt-1">{diffMassa > 0 ? '+' : ''}{diffMassa} <span className="text-xs text-slate-500">kg</span></div>
                    </div>
                    {[
                      { label: 'Cintura', atual: currentEvaluation.cintura, ant: ultima.cintura, unit: 'cm' },
                      { label: 'Abdômen', atual: currentEvaluation.abdomen, ant: ultima.abdomen, unit: 'cm' },
                      { label: 'Quadril', atual: currentEvaluation.quadril, ant: ultima.quadril, unit: 'cm' },
                    ].map((m, i) => {
                      const diff = (parseFloat(m.atual)||0) && (parseFloat(m.ant)||0) ? ((parseFloat(m.atual)||0) - (parseFloat(m.ant)||0)).toFixed(1) : 0;
                      return (
                        <div key={i} className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                          <div className="text-[9px] font-bold text-slate-500 uppercase">{m.label}</div>
                          <div className="text-lg font-black text-slate-900 mt-1">{diff > 0 ? '+' : ''}{diff} <span className="text-xs text-slate-500">{m.unit}</span></div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })()}
          </div>
        )}

        {/* MÓDULO 3 — FORÇA MUSCULAR */}
        {currentModule === 3 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-purple-900">Módulo 3 · Força Muscular</div>
                  <div className="text-xs text-purple-700">Dinamometria — análise de assimetrias D vs E</div>
                </div>
              </div>
            </div>

            {/* Selo visual - Chance de lesão */}
            <div className="bg-gradient-to-r from-slate-50 to-gray-50 border border-slate-200 rounded-2xl p-4 mb-1">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center mb-3">Chance de lesão por assimetria</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 p-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-black text-slate-800">BAIXA</div>
                    <div className="text-[8px] text-slate-500 font-semibold">abaixo de 10%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 p-2.5">
                  <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-black text-slate-800">MÉDIA</div>
                    <div className="text-[8px] text-slate-500 font-semibold">entre 10% e 20%</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl border border-slate-100 p-2.5">
                  <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-black text-slate-800">ALTA</div>
                    <div className="text-[8px] text-slate-500 font-semibold">acima de 20%</div>
                  </div>
                </div>
              </div>
            </div>

            <Card icon={Dumbbell} title="Avaliação de Força Muscular" subtitle="Análise de assimetrias D vs E (kg)">
              <div className="space-y-3">
                <ExercicioForca label="Extensão de Joelho" valD={currentEvaluation.forcaExtensaoJoelhoD} valE={currentEvaluation.forcaExtensaoJoelhoE} onChangeD={update('forcaExtensaoJoelhoD')} onChangeE={update('forcaExtensaoJoelhoE')} />
                <ExercicioForca label="Flexão de Joelho" valD={currentEvaluation.forcaFlexaoJoelhoD} valE={currentEvaluation.forcaFlexaoJoelhoE} onChangeD={update('forcaFlexaoJoelhoD')} onChangeE={update('forcaFlexaoJoelhoE')} />
                <ExercicioForca label="Adução de Quadril" valD={currentEvaluation.forcaAducaoQuadrilD} valE={currentEvaluation.forcaAducaoQuadrilE} onChangeD={update('forcaAducaoQuadrilD')} onChangeE={update('forcaAducaoQuadrilE')} />
                <ExercicioForca label="Abdução de Quadril" valD={currentEvaluation.forcaAbducaoQuadrilD} valE={currentEvaluation.forcaAbducaoQuadrilE} onChangeD={update('forcaAbducaoQuadrilD')} onChangeE={update('forcaAbducaoQuadrilE')} />
                <ExercicioForca label="Elevação Lateral" valD={currentEvaluation.forcaElevacaoLateralD} valE={currentEvaluation.forcaElevacaoLateralE} onChangeD={update('forcaElevacaoLateralD')} onChangeE={update('forcaElevacaoLateralE')} />
                <ExercicioForca label="Elevação Frontal" valD={currentEvaluation.forcaElevacaoFrontalD} valE={currentEvaluation.forcaElevacaoFrontalE} onChangeD={update('forcaElevacaoFrontalD')} onChangeE={update('forcaElevacaoFrontalE')} />
              </div>

              <div className="mt-5 bg-blue-50 border-l-3 border-blue-500 rounded-r-lg p-3">
                <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Critério Croisier (2002)</div>
                <div className="text-xs text-blue-800 leading-relaxed">
                  Chance de lesão por assimetria: <strong>abaixo de 10%</strong> = baixa · <strong>10–20%</strong> = média · <strong>acima de 20%</strong> = alta. Referência adaptada de Croisier (2002).
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* MÓDULO 4 — NEUROMOTOR */}
        {currentModule === 4 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-100 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-pink-600 rounded-xl flex items-center justify-center text-white">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-black text-pink-900">Módulo 4 · Neuromotor</div>
                  <div className="text-xs text-pink-700">Resistência, potência e flexibilidade</div>
                </div>
              </div>
            </div>

            <Card icon={Activity} title="Resistência Muscular Localizada" subtitle="RML Abdominal — repetições em 1 minuto">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="RML Abdominal" value={currentEvaluation.rmlAbdominal} onChange={update('rmlAbdominal')} unit="rep/min" />
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Classificação</label>
                  {(() => {
                    const c = classificaRMLAbdominal(currentEvaluation.rmlAbdominal, currentEvaluation.idade, currentEvaluation.genero);
                    if (!c) {
                      return <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-400 font-medium">Preencha rep, idade e gênero</div>;
                    }
                    return (
                      <div className="rounded-lg p-2.5 border" style={{ background: c.bg, borderColor: c.color + '40' }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-black text-base" style={{ color: c.color }}>{c.label}</div>
                            <div className="text-[10px] opacity-75 mt-0.5" style={{ color: c.color }}>{c.referencia}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] font-bold opacity-75 uppercase" style={{ color: c.color }}>Excelente a partir de</div>
                            <div className="text-sm font-black" style={{ color: c.color }}>{c.ideal} rep</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="mt-4 bg-blue-50 border-l-3 border-blue-500 rounded-r-lg p-3">
                <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Protocolo</div>
                <div className="text-xs text-blue-800 leading-relaxed">
                  Atleta deitado, joelhos flexionados a 90°, pés apoiados. Realiza o máximo de abdominais em <strong>60 segundos</strong>. Referência: Tabela ACSM (American College of Sports Medicine).
                </div>
              </div>
            </Card>

            <Card icon={TrendingUp} title="Potência de Membros Inferiores" subtitle="CMJ, Squat Jump e Salto Horizontal">
              {/* CMJ — Salto Vertical com contra-movimento */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">CMJ · Salto Vertical com Contra-Movimento</div>
                  <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">com balanço de braços</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <Input label="Altura do Salto" value={currentEvaluation.saltoVertical} onChange={update('saltoVertical')} unit="cm" />
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Classificação</label>
                    {(() => {
                      const c = classificaSaltoVertical(currentEvaluation.saltoVertical, currentEvaluation.idade, currentEvaluation.genero);
                      if (!c) return <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-400 font-medium">—</div>;
                      return (
                        <div className="rounded-lg p-2.5 border" style={{ background: c.bg, borderColor: c.color + '40' }}>
                          <div className="font-black text-base" style={{ color: c.color }}>{c.label}</div>
                          <div className="text-[10px] opacity-75 mt-0.5" style={{ color: c.color }}>Excelente: {c.ideal}+ cm</div>
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Potência (Sayers)</label>
                    {(() => {
                      const w = calcPotenciaWatts(currentEvaluation.saltoVertical, currentEvaluation.massa);
                      if (!w) return <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-400 font-medium">Preencha salto + massa</div>;
                      return (
                        <div className="rounded-lg p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                          <div className="font-black text-base">{w} W</div>
                          <div className="text-[10px] opacity-80 mt-0.5">Potência muscular</div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* SJ — Squat Jump sem contra-movimento */}
              <div className="pt-5 border-t border-slate-200 mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">SJ · Squat Jump (sem contra-movimento)</div>
                  <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">parado em 90°</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <Input label="Altura do Salto" value={currentEvaluation.saltoSquat} onChange={update('saltoSquat')} unit="cm" />
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Classificação</label>
                    {(() => {
                      const c = classificaSaltoVertical(currentEvaluation.saltoSquat, currentEvaluation.idade, currentEvaluation.genero);
                      if (!c) return <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-400 font-medium">—</div>;
                      return (
                        <div className="rounded-lg p-2.5 border" style={{ background: c.bg, borderColor: c.color + '40' }}>
                          <div className="font-black text-base" style={{ color: c.color }}>{c.label}</div>
                          <div className="text-[10px] opacity-75 mt-0.5" style={{ color: c.color }}>Potência pura</div>
                        </div>
                      );
                    })()}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Índice de Elasticidade</label>
                    {(() => {
                      const cmj = parseFloat(currentEvaluation.saltoVertical) || 0;
                      const sj = parseFloat(currentEvaluation.saltoSquat) || 0;
                      if (!cmj || !sj) return <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-400 font-medium">Preencha CMJ e SJ</div>;
                      const ie = ((cmj - sj) / sj * 100).toFixed(1);
                      let cor, label;
                      if (ie < 5) { cor = '#ef4444'; label = 'Baixa'; }
                      else if (ie < 10) { cor = '#eab308'; label = 'Média'; }
                      else if (ie < 20) { cor = '#10b981'; label = 'Boa'; }
                      else { cor = '#3b82f6'; label = 'Excelente'; }
                      return (
                        <div className="rounded-lg p-2.5 border" style={{ background: cor + '15', borderColor: cor + '40' }}>
                          <div className="font-black text-base" style={{ color: cor }}>{ie}% · {label}</div>
                          <div className="text-[10px] opacity-75 mt-0.5" style={{ color: cor }}>CMJ vs SJ</div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Salto Horizontal */}
              <div className="pt-5 border-t border-slate-200">
                <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-3">Salto Horizontal · Broad Jump</div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input label="Distância do Salto" value={currentEvaluation.saltoHorizontal} onChange={update('saltoHorizontal')} unit="cm" />
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Classificação</label>
                    {(() => {
                      const c = classificaSaltoHorizontal(currentEvaluation.saltoHorizontal, currentEvaluation.idade, currentEvaluation.genero);
                      if (!c) return <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-400 font-medium">Preencha distância, idade e gênero</div>;
                      return (
                        <div className="rounded-lg p-2.5 border" style={{ background: c.bg, borderColor: c.color + '40' }}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-black text-base" style={{ color: c.color }}>{c.label}</div>
                              <div className="text-[10px] opacity-75 mt-0.5" style={{ color: c.color }}>{c.referencia}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[9px] font-bold opacity-75 uppercase" style={{ color: c.color }}>Excelente</div>
                              <div className="text-sm font-black" style={{ color: c.color }}>{c.ideal}+ cm</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-blue-50 border-l-3 border-blue-500 rounded-r-lg p-3">
                <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Sobre os testes de salto</div>
                <div className="text-xs text-blue-800 leading-relaxed">
                  <strong>CMJ (Counter Movement Jump):</strong> atleta agacha rapidamente e salta — usa energia elástica do ciclo alongamento-encurtamento.<br />
                  <strong>SJ (Squat Jump):</strong> atleta mantém posição agachada (90°) e salta sem balanço — mede potência pura, sem energia elástica.<br />
                  <strong>Índice de Elasticidade:</strong> (CMJ − SJ) ÷ SJ × 100. Atletas com bom uso da energia elástica apresentam <strong>10–20%</strong> de diferença. Valores baixos indicam déficit no ciclo alongamento-encurtamento.<br />
                  <strong>Potência (Sayers):</strong> 60,7 × CMJ + 45,3 × peso − 2055 (padrão científico).
                </div>
              </div>
            </Card>

            <Card icon={Activity} title="Flexibilidade · Banco de Wells" subtitle="Cadeia posterior — distância alcançada (cm)">
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Distância Alcançada" value={currentEvaluation.bancoWells} onChange={update('bancoWells')} unit="cm" />
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Classificação</label>
                  {(() => {
                    const c = classificaBancoWells(currentEvaluation.bancoWells, currentEvaluation.idade, currentEvaluation.genero);
                    if (!c) {
                      return <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-400 font-medium">Preencha distância, idade e gênero</div>;
                    }
                    return (
                      <div className="rounded-lg p-2.5 border" style={{ background: c.bg, borderColor: c.color + '40' }}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-black text-base" style={{ color: c.color }}>{c.label}</div>
                            <div className="text-[10px] opacity-75 mt-0.5" style={{ color: c.color }}>{c.referencia}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] font-bold opacity-75 uppercase" style={{ color: c.color }}>Excelente a partir de</div>
                            <div className="text-sm font-black" style={{ color: c.color }}>{c.ideal}+ cm</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="mt-4 bg-blue-50 border-l-3 border-blue-500 rounded-r-lg p-3">
                <div className="text-[10px] font-bold text-blue-900 uppercase tracking-wider mb-1">Protocolo</div>
                <div className="text-xs text-blue-800 leading-relaxed">
                  Atleta sentado, pernas estendidas e pés apoiados no banco. Realiza flexão lenta do tronco com braços estendidos, deslizando os dedos sobre a régua. Registra-se a maior distância alcançada (3 tentativas, considera a melhor). <strong>Avalia flexibilidade da cadeia posterior</strong> — isquiotibiais e lombar. Referência: Tabela ACSM.
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* MÓDULO 4 — POSTURAL */}
        {/* MÓDULO POSTURAL REMOVIDO — Avaliação postural pelo APECS */}

        <div className="flex items-center justify-between mt-5 gap-3 flex-wrap">
          <button onClick={() => currentModule > 1 ? setCurrentModule(currentModule - 1) : setView('home')}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> {currentModule > 1 ? 'Anterior' : 'Início'}
          </button>
          <div className="flex items-center gap-2">
            <button onClick={salvarAvaliacao} className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2 border border-indigo-200">
              <Save className="w-4 h-4" /> {saveStatus || 'Salvar'}
            </button>
            {currentModule < 4 ? (
              <button onClick={() => setCurrentModule(currentModule + 1)} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                Próximo <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={async () => { try { await salvarAvaliacao(); } catch(e) {} setView('report'); }} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                <FileText className="w-4 h-4" /> Gerar Relatório
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
