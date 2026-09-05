from pathlib import Path

import matplotlib.pyplot as plt


dimensions = [
    "Governança",
    "Planejamento",
    "Controle de prazo",
    "Capacidade e horas",
    "Qualidade das entregas",
    "Revisão por pares",
    "Interfaces entre seções",
    "Riscos e impedimentos",
    "Comunicação",
    "Informação gerencial",
    "Qualidade dos dados",
    "Experiência e acessibilidade",
    "Automação e alertas",
    "Segurança e segregação",
    "Orientação ao resultado final",
]

scores = [2, 2, 2, 1, 1, 1, 2, 2, 1, 2, 1, 3, 2, 3, 2]

output = Path("/home/ubuntu/auditoria-estudo-bndes/maturidade-plataforma.png")
output.parent.mkdir(parents=True, exist_ok=True)

plt.style.use("seaborn-v0_8-whitegrid")
plt.rcParams.update(
    {
        "font.family": "DejaVu Sans",
        "axes.titlesize": 16,
        "axes.labelsize": 11,
        "xtick.labelsize": 10,
        "ytick.labelsize": 10,
    }
)

colors = ["#8F2D20" if value <= 1 else "#B86A2B" if value == 2 else "#335C4A" for value in scores]

fig, ax = plt.subplots(figsize=(11, 8.8), dpi=180)
positions = list(range(len(dimensions)))
ax.barh(positions, scores, color=colors, height=0.62)
ax.set_yticks(positions, labels=dimensions)
ax.invert_yaxis()
ax.set_xlim(0, 5)
ax.set_xticks(range(0, 6))
ax.set_xlabel("Nota de maturidade (0 a 5)")
ax.set_title("Maturidade da plataforma para gerir a execução do Estudo BNDES", loc="left", pad=18, weight="bold")
ax.text(
    0,
    1.015,
    "Nota geral: 1,80 · controles parcialmente definidos, ainda sem adoção operacional",
    transform=ax.transAxes,
    fontsize=11,
    color="#4D514C",
)

for position, score in zip(positions, scores):
    ax.text(score + 0.08, position, f"{score}", va="center", ha="left", weight="bold", color="#1D2722")

ax.axvline(3, color="#335C4A", linewidth=1.1, linestyle="--", alpha=0.8)
ax.text(3.05, len(dimensions) - 0.3, "processo definido", fontsize=9, color="#335C4A")
ax.spines[["top", "right", "left"]].set_visible(False)
ax.grid(axis="y", visible=False)
ax.grid(axis="x", color="#D8D1C3", linewidth=0.8)
fig.patch.set_facecolor("#F6F0E2")
ax.set_facecolor("#F6F0E2")
plt.tight_layout()
fig.savefig(output, bbox_inches="tight", facecolor=fig.get_facecolor())
print(output)
