# ⚡ LINS TRAINING — Sistema de Avaliação Física

Sistema modular de avaliação física para atletas de futebol e alto rendimento.

## 🏋️ Módulos

1. **Anamnese** — Dados pessoais, perfil esportivo, sinais vitais, zonas Karvonen
2. **Morfológico** — Composição corporal, perimetria D/E, dobras cutâneas (Pollock 7)
3. **Força Muscular** — Dinamometria com análise de assimetrias D vs E
4. **Neuromotor** — RML abdominal, CMJ, Squat Jump, salto horizontal, Banco de Wells

## 📄 Geração de PDF

- PDF individual por módulo
- PDF completo (todos os módulos)
- Download automático via `window.print()`

## 🚀 Deploy

```bash
npm install
npm run build
```

Deploy automático na Vercel via GitHub.

## 🛠 Tecnologias

- React 18
- Vite 5
- Tailwind CSS 3
- Lucide React (ícones)

## 📋 Classificação de Assimetrias

**Chance de lesão por assimetria** (Croisier, 2002 — adaptado):

| Faixa | Classificação |
|-------|--------------|
| < 10% | 🟢 BAIXA |
| 10–20% | 🟠 MÉDIA |
| > 20% | 🔴 ALTA |

## 👤 Autor

**Lins Oliveira** — Performance Trainer  
LINS TRAINING
