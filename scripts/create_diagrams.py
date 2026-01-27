"""
Generate remaining visualizations for roadmap
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import Rectangle, FancyBboxPatch
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import seaborn as sns

plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

# Risk definitions
risks = {
    'Phase 0': [
        {'name': 'Video API quality', 'probability': 0.5, 'impact': 9, 'phase': 0},
        {'name': 'Audio accuracy', 'probability': 0.5, 'impact': 7, 'phase': 0},
        {'name': 'Cost per video', 'probability': 0.7, 'impact': 9, 'phase': 0},
        {'name': 'RT collab', 'probability': 0.3, 'impact': 7, 'phase': 0},
        {'name': 'Licensing', 'probability': 0.3, 'impact': 9, 'phase': 0},
    ],
    'Phase 1': [
        {'name': 'API rate limits', 'probability': 0.7, 'impact': 7, 'phase': 1},
        {'name': 'Cost budget', 'probability': 0.7, 'impact': 9, 'phase': 1},
        {'name': 'FFmpeg fail', 'probability': 0.5, 'impact': 7, 'phase': 1},
        {'name': 'WebSocket', 'probability': 0.5, 'impact': 5, 'phase': 1},
        {'name': 'LLM issues', 'probability': 0.5, 'impact': 7, 'phase': 1},
    ],
    'Phase 2': [
        {'name': 'Avatar API', 'probability': 0.7, 'impact': 7, 'phase': 2},
        {'name': 'AI edits', 'probability': 0.5, 'impact': 5, 'phase': 2},
        {'name': 'State conflicts', 'probability': 0.5, 'impact': 7, 'phase': 2},
        {'name': 'Cost explosion', 'probability': 0.7, 'impact': 9, 'phase': 2},
        {'name': 'Rate limits', 'probability': 0.7, 'impact': 7, 'phase': 2},
        {'name': 'User churn', 'probability': 0.5, 'impact': 7, 'phase': 2},
    ],
    'Phase 3': [
        {'name': 'Scalability', 'probability': 0.5, 'impact': 9, 'phase': 3},
        {'name': 'Collab bugs', 'probability': 0.5, 'impact': 7, 'phase': 3},
        {'name': 'SOC 2 fail', 'probability': 0.3, 'impact': 9, 'phase': 3},
        {'name': 'Fraud', 'probability': 0.5, 'impact': 5, 'phase': 3},
        {'name': 'Viral traffic', 'probability': 0.3, 'impact': 7, 'phase': 3},
        {'name': 'Copyright', 'probability': 0.5, 'impact': 7, 'phase': 3},
    ]
}

# Metrics
metrics_progression = {
    'Phase 0': {
        'Users': 0,
        'Videos Generated': 10,
        'Success Rate': 85,
        'Avg Gen Time (min)': 20,
        'Cost per Video': 5.0,
        'NPS': None
    },
    'Phase 1': {
        'Users': 10,
        'Videos Generated': 100,
        'Success Rate': 80,
        'Avg Gen Time (min)': 15,
        'Cost per Video': 4.5,
        'NPS': None
    },
    'Phase 2': {
        'Users': 1000,
        'Videos Generated': 5000,
        'Success Rate': 85,
        'Avg Gen Time (min)': 12,
        'Cost per Video': 4.0,
        'NPS': 40
    },
    'Phase 3': {
        'Users': 10000,
        'Videos Generated': 50000,
        'Success Rate': 90,
        'Avg Gen Time (min)': 10,
        'Cost per Video': 3.0,
        'NPS': 50
    }
}

print("Generating risk heatmap...")
fig, axes = plt.subplots(2, 2, figsize=(18, 14))
axes = axes.flatten()

for idx, (phase_name, phase_risks) in enumerate(risks.items()):
    ax = axes[idx]
    
    risk_matrix = np.zeros((10, 10))
    risk_labels = []
    
    for risk in phase_risks:
        prob_idx = int(risk['probability'] * 9)
        impact_idx = int((risk['impact'] / 10) * 9)
        risk_score = risk['probability'] * risk['impact']
        risk_matrix[9 - prob_idx, impact_idx] = risk_score
        risk_labels.append((risk['name'], prob_idx, impact_idx, risk_score))
    
    im = ax.imshow(risk_matrix, cmap='YlOrRd', aspect='auto', vmin=0, vmax=9)
    
    for name, prob_idx, impact_idx, score in risk_labels:
        text_color = 'white' if score > 4.5 else 'black'
        ax.text(impact_idx, 9 - prob_idx, f'{name}\n{score:.1f}', 
               ha='center', va='center', fontsize=8, fontweight='bold',
               color=text_color)
    
    ax.set_xlabel('Impact', fontsize=12, fontweight='bold')
    ax.set_ylabel('Probability', fontsize=12, fontweight='bold')
    ax.set_title(f'{phase_name}: Risk Assessment', fontsize=14, fontweight='bold')
    ax.set_xticks(range(10))
    ax.set_yticks(range(10))
    ax.set_xticklabels([f'{i}' for i in range(1, 11)], fontsize=9)
    ax.set_yticklabels([f'{i*10}%' for i in range(10, 0, -1)], fontsize=9)
    
    plt.colorbar(im, ax=ax, label='Risk Score')

fig.suptitle('Risk Assessment Heat Maps by Phase', fontsize=18, fontweight='bold')
plt.tight_layout()
plt.savefig('/tmp/risk_heatmap.png', dpi=300, bbox_inches='tight')
print("✓ Risk heatmap saved")
plt.close()

print("\nGenerating metrics dashboard...")
fig, axes = plt.subplots(2, 3, figsize=(18, 10))
phase_names = list(metrics_progression.keys())

metrics = [
    ('Users', 'Total Users', False, '#E63946'),
    ('Videos Generated', 'Videos Generated', False, '#F1FAEE'),
    ('Success Rate', 'Success Rate (%)', True, '#A8DADC'),
    ('Avg Gen Time (min)', 'Avg Gen Time (min)', True, '#457B9D'),
    ('Cost per Video', 'Cost per Video ($)', True, '#1D3557'),
    ('NPS', 'Net Promoter Score', True, '#2A9D8F')
]

for idx, (metric_key, title, show_target, color) in enumerate(metrics):
    ax = axes[idx // 3, idx % 3]
    
    values = [metrics_progression[p][metric_key] for p in phase_names]
    
    x_data = []
    y_data = []
    for i, val in enumerate(values):
        if val is not None:
            x_data.append(i)
            y_data.append(val)
    
    if not y_data:
        ax.text(0.5, 0.5, 'No data', ha='center', va='center', fontsize=14)
        ax.set_title(title, fontsize=12, fontweight='bold')
        continue
    
    ax.plot(x_data, y_data, marker='o', linewidth=3, markersize=10, color=color)
    ax.fill_between(x_data, y_data, alpha=0.3, color=color)
    
    for i, (x, y) in enumerate(zip(x_data, y_data)):
        offset = 0.05 * (max(y_data) - min(y_data)) if len(y_data) > 1 else 0.05 * y
        ax.text(x, y + offset, f'{y:,.0f}' if y >= 100 else f'{y:.1f}', 
               ha='center', fontsize=10, fontweight='bold')
    
    ax.set_xticks(range(len(phase_names)))
    ax.set_xticklabels([p.replace(' ', '\n') for p in phase_names], fontsize=9)
    ax.set_ylabel(metric_key, fontsize=10, fontweight='bold')
    ax.set_title(title, fontsize=12, fontweight='bold')
    ax.grid(alpha=0.3)

fig.suptitle('Success Metrics Progression', fontsize=18, fontweight='bold')
plt.tight_layout()
plt.savefig('/tmp/metrics_dashboard.png', dpi=300, bbox_inches='tight')
print("✓ Metrics dashboard saved")
plt.close()

print("\nGenerating decision tree...")
fig, ax = plt.subplots(figsize=(16, 10))
ax.set_xlim(0, 10)
ax.set_ylim(0, 10)
ax.axis('off')

decisions = [
    {
        'phase': 'Phase 0',
        'position': (5, 8.5),
        'criteria': ['Spikes complete', 'PoCs validated', 'Cost OK', 'Accuracy >85%'],
        'go': (2, 6.5),
        'no_go': (8, 6.5)
    },
    {
        'phase': 'Phase 1',
        'position': (5, 5.5),
        'criteria': ['100+ videos', 'Success >75%', 'User sat >3/5', 'Cost <$5'],
        'go': (2, 3.5),
        'no_go': (8, 3.5)
    },
    {
        'phase': 'Phase 2',
        'position': (5, 2.5),
        'criteria': ['1K users', 'NPS >35', 'Success >85%', 'Security OK'],
        'go': (2, 0.5),
        'no_go': (8, 0.5)
    }
]

for decision in decisions:
    phase_box = FancyBboxPatch(
        (decision['position'][0] - 1.2, decision['position'][1] - 0.25),
        2.4, 0.5,
        boxstyle="round,pad=0.1",
        facecolor='lightblue',
        edgecolor='black',
        linewidth=2
    )
    ax.add_patch(phase_box)
    ax.text(decision['position'][0], decision['position'][1], 
           f"{decision['phase']} Gate", ha='center', va='center',
           fontsize=12, fontweight='bold')
    
    criteria_text = ' • '.join(decision['criteria'])
    ax.text(decision['position'][0], decision['position'][1] - 0.6,
           criteria_text, ha='center', va='top', fontsize=8,
           bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
    
    go_box = FancyBboxPatch(
        (decision['go'][0] - 0.6, decision['go'][1] - 0.2),
        1.2, 0.4,
        boxstyle="round,pad=0.1",
        facecolor='lightgreen',
        edgecolor='black',
        linewidth=2
    )
    ax.add_patch(go_box)
    ax.text(decision['go'][0], decision['go'][1], 
           'GO', ha='center', va='center',
           fontsize=11, fontweight='bold')
    
    ax.annotate('', xy=decision['go'], 
               xytext=(decision['position'][0] - 0.4, decision['position'][1] - 0.4),
               arrowprops=dict(arrowstyle='->', lw=2, color='green'))
    
    nogo_box = FancyBboxPatch(
        (decision['no_go'][0] - 0.6, decision['no_go'][1] - 0.2),
        1.2, 0.4,
        boxstyle="round,pad=0.1",
        facecolor='lightcoral',
        edgecolor='black',
        linewidth=2
    )
    ax.add_patch(nogo_box)
    ax.text(decision['no_go'][0], decision['no_go'][1], 
           'NO-GO', ha='center', va='center',
           fontsize=11, fontweight='bold')
    
    ax.annotate('', xy=decision['no_go'], 
               xytext=(decision['position'][0] + 0.4, decision['position'][1] - 0.4),
               arrowprops=dict(arrowstyle='->', lw=2, color='red'))

ax.text(5, 9.5, 'Phase Gate Decision Framework', ha='center', 
       fontsize=16, fontweight='bold')

plt.savefig('/tmp/decision_tree.png', dpi=300, bbox_inches='tight')
print("✓ Decision tree saved")
plt.close()

print("\nAll visualizations generated successfully!")
