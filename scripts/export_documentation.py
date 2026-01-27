"""
AI Music Video Generator - Roadmap Analysis & Visualizations
Generates detailed charts, timelines, and quantitative analysis for the implementation roadmap
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import Rectangle, FancyBboxPatch
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import seaborn as sns
from collections import defaultdict

# Set style
plt.style.use('seaborn-v0_8-darkgrid')
sns.set_palette("husl")

# ============================================================================
# DATA DEFINITIONS
# ============================================================================

# Phase definitions
phases = {
    'Phase 0': {
        'name': 'Foundation & Validation',
        'duration_weeks': 8,
        'team_size': 5.5,
        'cost': 211250,
        'deliverables': 5,
        'risks_high': 2,
        'risks_medium': 3,
        'success_rate_target': 85
    },
    'Phase 1': {
        'name': 'MVP - Core Video Generation',
        'duration_weeks': 12,
        'team_size': 11,
        'cost': 590040,
        'deliverables': 8,
        'risks_high': 3,
        'risks_medium': 3,
        'success_rate_target': 80
    },
    'Phase 2': {
        'name': 'Beta - Advanced Features',
        'duration_weeks': 18,
        'team_size': 15,
        'cost': 1244035,
        'deliverables': 7,
        'risks_high': 4,
        'risks_medium': 3,
        'success_rate_target': 85
    },
    'Phase 3': {
        'name': 'GA - Production Launch',
        'duration_weeks': 14,
        'team_size': 16,
        'cost': 1326600,
        'deliverables': 8,
        'risks_high': 3,
        'risks_medium': 4,
        'success_rate_target': 90
    }
}

# Workstream definitions for Gantt chart
workstreams = [
    # Phase 0
    {'phase': 0, 'name': 'Technical Spikes', 'start': 0, 'duration': 4, 'team': 3},
    {'phase': 0, 'name': 'Infrastructure Setup', 'start': 0, 'duration': 3, 'team': 2},
    {'phase': 0, 'name': 'PoC Development', 'start': 3, 'duration': 5, 'team': 4},
    {'phase': 0, 'name': 'Architecture Decisions', 'start': 2, 'duration': 6, 'team': 2},
    
    # Phase 1
    {'phase': 1, 'name': 'Audio Processing Service', 'start': 8, 'duration': 4, 'team': 2},
    {'phase': 1, 'name': 'Storyboard Generation', 'start': 11, 'duration': 4, 'team': 2},
    {'phase': 1, 'name': 'Video Orchestration', 'start': 12, 'duration': 6, 'team': 3},
    {'phase': 1, 'name': 'Frontend Core', 'start': 11, 'duration': 7, 'team': 3},
    {'phase': 1, 'name': 'User Management', 'start': 10, 'duration': 4, 'team': 2},
    {'phase': 1, 'name': 'Testing & Deployment', 'start': 16, 'duration': 4, 'team': 4},
    
    # Phase 2
    {'phase': 2, 'name': 'Avatar Integration', 'start': 20, 'duration': 8, 'team': 3},
    {'phase': 2, 'name': 'Conversational AI Agent', 'start': 22, 'duration': 10, 'team': 3},
    {'phase': 2, 'name': 'Advanced Editing UI', 'start': 20, 'duration': 12, 'team': 3},
    {'phase': 2, 'name': 'Collaborative Editing', 'start': 26, 'duration': 10, 'team': 3},
    {'phase': 2, 'name': 'Scaling Infrastructure', 'start': 20, 'duration': 6, 'team': 2},
    {'phase': 2, 'name': 'Beta Program Operations', 'start': 28, 'duration': 10, 'team': 2},
    {'phase': 2, 'name': 'Security Audit', 'start': 28, 'duration': 6, 'team': 2},
    
    # Phase 3
    {'phase': 3, 'name': 'Real-Time Collaboration', 'start': 38, 'duration': 10, 'team': 4},
    {'phase': 3, 'name': 'Enterprise Features', 'start': 42, 'duration': 8, 'team': 3},
    {'phase': 3, 'name': 'Billing Integration', 'start': 40, 'duration': 6, 'team': 2},
    {'phase': 3, 'name': 'Multi-Region Deploy', 'start': 41, 'duration': 6, 'team': 2},
    {'phase': 3, 'name': 'SOC 2 Audit', 'start': 38, 'duration': 16, 'team': 2},
    {'phase': 3, 'name': 'Marketing & Launch', 'start': 44, 'duration': 8, 'team': 3},
    {'phase': 3, 'name': 'Final Testing & QA', 'start': 48, 'duration': 4, 'team': 4},
]

# Risk definitions
risks = {
    'Phase 0': [
        {'name': 'Video API quality', 'probability': 0.5, 'impact': 9, 'phase': 0},
        {'name': 'Audio accuracy', 'probability': 0.5, 'impact': 7, 'phase': 0},
        {'name': 'Cost per video', 'probability': 0.7, 'impact': 9, 'phase': 0},
        {'name': 'Real-time collab complexity', 'probability': 0.3, 'impact': 7, 'phase': 0},
        {'name': 'Licensing issues', 'probability': 0.3, 'impact': 9, 'phase': 0},
    ],
    'Phase 1': [
        {'name': 'Video API rate limits', 'probability': 0.7, 'impact': 7, 'phase': 1},
        {'name': 'Cost exceeds budget', 'probability': 0.7, 'impact': 9, 'phase': 1},
        {'name': 'FFmpeg failures', 'probability': 0.5, 'impact': 7, 'phase': 1},
        {'name': 'WebSocket instability', 'probability': 0.5, 'impact': 5, 'phase': 1},
        {'name': 'LLM hallucinations', 'probability': 0.5, 'impact': 7, 'phase': 1},
        {'name': 'Audio processing slow', 'probability': 0.5, 'impact': 5, 'phase': 1},
    ],
    'Phase 2': [
        {'name': 'Avatar API issues', 'probability': 0.7, 'impact': 7, 'phase': 2},
        {'name': 'AI agent invalid edits', 'probability': 0.5, 'impact': 5, 'phase': 2},
        {'name': 'Collab state conflicts', 'probability': 0.5, 'impact': 7, 'phase': 2},
        {'name': 'Cost explosion', 'probability': 0.7, 'impact': 9, 'phase': 2},
        {'name': 'Rate limits at scale', 'probability': 0.7, 'impact': 7, 'phase': 2},
        {'name': 'Beta user churn', 'probability': 0.5, 'impact': 7, 'phase': 2},
        {'name': 'Security vulnerability', 'probability': 0.3, 'impact': 9, 'phase': 2},
    ],
    'Phase 3': [
        {'name': 'Launch scalability', 'probability': 0.5, 'impact': 9, 'phase': 3},
        {'name': 'Real-time collab bugs', 'probability': 0.5, 'impact': 7, 'phase': 3},
        {'name': 'SOC 2 audit failure', 'probability': 0.3, 'impact': 9, 'phase': 3},
        {'name': 'Payment fraud', 'probability': 0.5, 'impact': 5, 'phase': 3},
        {'name': 'Viral traffic', 'probability': 0.3, 'impact': 7, 'phase': 3},
        {'name': 'Copyright claims', 'probability': 0.5, 'impact': 7, 'phase': 3},
        {'name': 'Security breach', 'probability': 0.3, 'impact': 9, 'phase': 3},
    ]
}

# Team composition by role across phases
team_composition = {
    'Phase 0': {
        'Backend Engineers': 1.0,
        'ML Engineers': 1.0,
        'Frontend Engineers': 0.5,
        'DevOps/SRE': 1.0,
        'Audio Engineers': 1.0,
        'QA Engineers': 0,
        'Designers': 0,
        'Product Managers': 0.5,
        'Other': 0.5
    },
    'Phase 1': {
        'Backend Engineers': 3.0,
        'ML Engineers': 1.0,
        'Frontend Engineers': 2.0,
        'DevOps/SRE': 1.0,
        'Audio Engineers': 1.0,
        'QA Engineers': 0.5,
        'Designers': 1.0,
        'Product Managers': 1.0,
        'Other': 0.5
    },
    'Phase 2': {
        'Backend Engineers': 4.0,
        'ML Engineers': 2.0,
        'Frontend Engineers': 3.0,
        'DevOps/SRE': 1.5,
        'Audio Engineers': 0.5,
        'QA Engineers': 1.5,
        'Designers': 1.0,
        'Product Managers': 1.0,
        'Other': 1.5
    },
    'Phase 3': {
        'Backend Engineers': 4.0,
        'ML Engineers': 1.5,
        'Frontend Engineers': 3.0,
        'DevOps/SRE': 2.0,
        'Audio Engineers': 0,
        'QA Engineers': 2.0,
        'Designers': 1.0,
        'Product Managers': 1.0,
        'Other': 3.0
    }
}

# Cost breakdown
cost_breakdown = {
    'Phase 0': {
        'Labor': 154000,
        'Infrastructure': 5000,
        'API Costs': 3000,
        'Tools': 2000,
        'Other': 5000,
        'Contingency': 42250
    },
    'Phase 1': {
        'Labor': 462000,
        'Infrastructure': 24000,
        'API Costs': 300,
        'Tools': 900,
        'Other': 4500,
        'Contingency': 98340
    },
    'Phase 2': {
        'Labor': 945000,
        'Infrastructure': 67500,
        'API Costs': 34000,
        'Tools': 12150,
        'Other': 26250,
        'Contingency': 159135
    },
    'Phase 3': {
        'Labor': 784000,
        'Infrastructure': 87500,
        'API Costs': 222500,
        'Tools': 13000,
        'Other': 99000,
        'Contingency': 120600
    }
}

# Success metrics progression
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

# ============================================================================
# VISUALIZATION FUNCTIONS
# ============================================================================

def create_gantt_chart():
    """Create a comprehensive Gantt chart showing all workstreams"""
    fig, ax = plt.subplots(figsize=(20, 12))
    
    # Color scheme for phases
    phase_colors = {
        0: '#FF6B6B',  # Red
        1: '#4ECDC4',  # Teal
        2: '#45B7D1',  # Blue
        3: '#96CEB4'   # Green
    }
    
    # Sort workstreams by start time for better visualization
    sorted_streams = sorted(workstreams, key=lambda x: x['start'])
    
    # Plot each workstream
    for idx, stream in enumerate(sorted_streams):
        color = phase_colors[stream['phase']]
        
        # Create bar
        ax.barh(idx, stream['duration'], left=stream['start'], 
                height=0.6, color=color, alpha=0.8, edgecolor='black', linewidth=0.5)
        
        # Add text label
        label = f"{stream['name']} ({stream['team']} FTE)"
        mid_point = stream['start'] + stream['duration'] / 2
        ax.text(mid_point, idx, label, ha='center', va='center', 
                fontsize=8, fontweight='bold', color='white')
    
    # Add phase boundaries
    phase_starts = [0, 8, 20, 38, 52]
    phase_names = ['Phase 0:\nFoundation', 'Phase 1:\nMVP', 'Phase 2:\nBeta', 'Phase 3:\nGA', 'Phase 4']
    
    for i, (start, name) in enumerate(zip(phase_starts[:-1], phase_names[:-1])):
        ax.axvline(x=start, color='black', linestyle='--', linewidth=2, alpha=0.5)
        ax.text(start + (phase_starts[i+1] - start) / 2, len(sorted_streams) + 0.5, 
                name, ha='center', fontsize=12, fontweight='bold',
                bbox=dict(boxstyle='round', facecolor=phase_colors[i], alpha=0.3))
    
    # Formatting
    ax.set_xlabel('Week', fontsize=14, fontweight='bold')
    ax.set_ylabel('Workstream', fontsize=14, fontweight='bold')
    ax.set_title('AI Music Video Generator - Implementation Timeline', 
                 fontsize=18, fontweight='bold', pad=20)
    ax.set_yticks(range(len(sorted_streams)))
    ax.set_yticklabels([s['name'] for s in sorted_streams], fontsize=9)
    ax.set_xlim(0, 56)
    ax.grid(axis='x', alpha=0.3)
    
    # Legend
    legend_elements = [mpatches.Patch(facecolor=phase_colors[i], label=f'Phase {i}') 
                      for i in range(4)]
    ax.legend(handles=legend_elements, loc='upper right', fontsize=10)
    
    plt.tight_layout()
    plt.savefig('/tmp/gantt_chart.png', dpi=300, bbox_inches='tight')
    print("✓ Gantt chart saved to /tmp/gantt_chart.png")
    plt.close()


def create_resource_allocation_chart():
    """Create stacked area chart showing resource allocation over time"""
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(16, 12))
    
    # Create week-by-week data
    weeks = list(range(0, 53))
    role_data = {role: [] for role in team_composition['Phase 0'].keys()}
    
    for week in weeks:
        if week < 8:
            phase = 'Phase 0'
        elif week < 20:
            phase = 'Phase 1'
        elif week < 38:
            phase = 'Phase 2'
        else:
            phase = 'Phase 3'
        
        for role in role_data.keys():
            role_data[role].append(team_composition[phase][role])
    
    # Plot stacked area chart
    ax1.stackplot(weeks, *role_data.values(), labels=role_data.keys(), alpha=0.8)
    ax1.set_xlabel('Week', fontsize=12, fontweight='bold')
    ax1.set_ylabel('Full-Time Equivalents (FTE)', fontsize=12, fontweight='bold')
    ax1.set_title('Resource Allocation by Role Over Time', fontsize=16, fontweight='bold')
    ax1.legend(loc='upper left', fontsize=9)
    ax1.grid(alpha=0.3)
    ax1.set_xlim(0, 52)
    
    # Add phase boundaries
    for week, name in [(8, 'P0→P1'), (20, 'P1→P2'), (38, 'P2→P3')]:
        ax1.axvline(x=week, color='red', linestyle='--', linewidth=2, alpha=0.6)
        ax1.text(week, ax1.get_ylim()[1] * 0.95, name, rotation=90, 
                ha='right', fontsize=10, fontweight='bold')
    
    # Plot total team size
    total_fte = [sum(role_data[role][i] for role in role_data.keys()) for i in range(len(weeks))]
    ax2.plot(weeks, total_fte, linewidth=3, color='#2E86AB', marker='o', markersize=4)
    ax2.fill_between(weeks, total_fte, alpha=0.3, color='#2E86AB')
    ax2.set_xlabel('Week', fontsize=12, fontweight='bold')
    ax2.set_ylabel('Total Team Size (FTE)', fontsize=12, fontweight='bold')
    ax2.set_title('Total Team Size Progression', fontsize=16, fontweight='bold')
    ax2.grid(alpha=0.3)
    ax2.set_xlim(0, 52)
    
    # Add phase boundaries
    for week, name in [(8, 'P0→P1'), (20, 'P1→P2'), (38, 'P2→P3')]:
        ax2.axvline(x=week, color='red', linestyle='--', linewidth=2, alpha=0.6)
    
    # Annotate team sizes
    phase_midpoints = [(0, 8), (8, 20), (20, 38), (38, 52)]
    phase_labels = ['Phase 0\n5.5 FTE', 'Phase 1\n11 FTE', 'Phase 2\n15 FTE', 'Phase 3\n16 FTE']
    for (start, end), label in zip(phase_midpoints, phase_labels):
        mid = (start + end) / 2
        ax2.annotate(label, xy=(mid, total_fte[int(mid)]), 
                    xytext=(mid, total_fte[int(mid)] + 2),
                    fontsize=11, fontweight='bold', ha='center',
                    bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
    
    plt.tight_layout()
    plt.savefig('/tmp/resource_allocation.png', dpi=300, bbox_inches='tight')
    print("✓ Resource allocation chart saved to /tmp/resource_allocation.png")
    plt.close()


def create_cost_analysis():
    """Create comprehensive cost analysis visualizations"""
    fig = plt.figure(figsize=(18, 10))
    gs = fig.add_gridspec(2, 3, hspace=0.3, wspace=0.3)
    
    # 1. Cost by Phase (bar chart)
    ax1 = fig.add_subplot(gs[0, 0])
    phase_names = list(phases.keys())
    phase_costs = [phases[p]['cost'] for p in phase_names]
    colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']
    
    bars = ax1.bar(range(len(phase_names)), phase_costs, color=colors, alpha=0.8, edgecolor='black')
    ax1.set_xticks(range(len(phase_names)))
    ax1.set_xticklabels(phase_names, fontsize=10, fontweight='bold')
    ax1.set_ylabel('Cost ($)', fontsize=11, fontweight='bold')
    ax1.set_title('Total Cost by Phase', fontsize=13, fontweight='bold')
    ax1.grid(axis='y', alpha=0.3)
    
    # Add value labels on bars
    for bar in bars:
        height = bar.get_height()
        ax1.text(bar.get_x() + bar.get_width()/2., height,
                f'${height/1000:.0f}K',
                ha='center', va='bottom', fontsize=9, fontweight='bold')
    
    # 2. Cost breakdown stacked bar
    ax2 = fig.add_subplot(gs[0, 1])
    cost_categories = ['Labor', 'Infrastructure', 'API Costs', 'Tools', 'Other', 'Contingency']
    
    bottoms = [0] * len(phase_names)
    category_colors = plt.cm.Set3(np.linspace(0, 1, len(cost_categories)))
    
    for idx, category in enumerate(cost_categories):
        values = [cost_breakdown[p][category] for p in phase_names]
        ax2.bar(range(len(phase_names)), values, bottom=bottoms, 
               label=category, color=category_colors[idx], alpha=0.8, edgecolor='black', linewidth=0.5)
        bottoms = [bottoms[i] + values[i] for i in range(len(values))]
    
    ax2.set_xticks(range(len(phase_names)))
    ax2.set_xticklabels(phase_names, fontsize=10, fontweight='bold')
    ax2.set_ylabel('Cost ($)', fontsize=11, fontweight='bold')
    ax2.set_title('Cost Breakdown by Category', fontsize=13, fontweight='bold')
    ax2.legend(loc='upper left', fontsize=8)
    ax2.grid(axis='y', alpha=0.3)
    
    # 3. Cumulative cost over time
    ax3 = fig.add_subplot(gs[0, 2])
    
    cumulative_weeks = []
    cumulative_costs = []
    total_cost = 0
    
    for phase_name in phase_names:
        phase = phases[phase_name]
        start_week = sum(phases[p]['duration_weeks'] for p in phase_names[:list(phase_names).index(phase_name)])
        end_week = start_week + phase['duration_weeks']
        
        cumulative_weeks.extend([start_week, end_week])
        cumulative_costs.extend([total_cost, total_cost + phase['cost']])
        total_cost += phase['cost']
    
    ax3.plot(cumulative_weeks, cumulative_costs, linewidth=3, color='#E63946', marker='o', markersize=6)
    ax3.fill_between(cumulative_weeks, cumulative_costs, alpha=0.2, color='#E63946')
    ax3.set_xlabel('Week', fontsize=11, fontweight='bold')
    ax3.set_ylabel('Cumulative Cost ($)', fontsize=11, fontweight='bold')
    ax3.set_title('Cumulative Cost Over Time', fontsize=13, fontweight='bold')
    ax3.grid(alpha=0.3)
    
    # Format y-axis as currency
    ax3.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x/1e6:.1f}M'))
    
    # 4. Cost per phase as pie chart
    ax4 = fig.add_subplot(gs[1, 0])
    ax4.pie(phase_costs, labels=phase_names, autopct='%1.1f%%', colors=colors,
            startangle=90, textprops={'fontsize': 10, 'fontweight': 'bold'})
    ax4.set_title('Cost Distribution by Phase', fontsize=13, fontweight='bold')
    
    # 5. Labor vs non-labor costs
    ax5 = fig.add_subplot(gs[1, 1])
    labor_costs = [cost_breakdown[p]['Labor'] for p in phase_names]
    nonlabor_costs = [phase_costs[i] - labor_costs[i] for i in range(len(phase_names))]
    
    x = np.arange(len(phase_names))
    width = 0.35
    
    ax5.bar(x - width/2, labor_costs, width, label='Labor', color='#457B9D', alpha=0.8, edgecolor='black')
    ax5.bar(x + width/2, nonlabor_costs, width, label='Non-Labor', color='#F1FAEE', alpha=0.8, edgecolor='black')
    
    ax5.set_xticks(x)
    ax5.set_xticklabels(phase_names, fontsize=10, fontweight='bold')
    ax5.set_ylabel('Cost ($)', fontsize=11, fontweight='bold')
    ax5.set_title('Labor vs Non-Labor Costs', fontsize=13, fontweight='bold')
    ax5.legend(fontsize=9)
    ax5.grid(axis='y', alpha=0.3)
    
    # 6. Summary statistics
    ax6 = fig.add_subplot(gs[1, 2])
    ax6.axis('off')
    
    total_cost = sum(phase_costs)
    total_labor = sum(labor_costs)
    total_weeks = sum(phases[p]['duration_weeks'] for p in phase_names)
    avg_burn_rate = total_cost / total_weeks
    
    summary_text = f"""
    COST SUMMARY
    
    Total Project Cost: ${total_cost:,.0f}
    
    Total Labor Cost: ${total_labor:,.0f}
    ({total_labor/total_cost*100:.1f}% of total)
    
    Total Non-Labor: ${total_cost - total_labor:,.0f}
    ({(1-total_labor/total_cost)*100:.1f}% of total)
    
    Total Duration: {total_weeks} weeks
    
    Average Weekly Burn Rate: ${avg_burn_rate:,.0f}/week
    
    Highest Cost Phase: {phase_names[phase_costs.index(max(phase_costs))]}
    (${max(phase_costs):,.0f})
    
    Total Contingency: ${sum(cost_breakdown[p]['Contingency'] for p in phase_names):,.0f}
    ({sum(cost_breakdown[p]['Contingency'] for p in phase_names)/total_cost*100:.1f}% of total)
    """
    
    ax6.text(0.1, 0.9, summary_text, fontsize=11, family='monospace',
            verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))
    
    fig.suptitle('AI Music Video Generator - Cost Analysis', fontsize=18, fontweight='bold', y=0.98)
    
    plt.savefig('/tmp/cost_analysis.png', dpi=300, bbox_inches='tight')
    print("✓ Cost analysis saved to /tmp/cost_analysis.png")
    plt.close()


def create_risk_heatmap():
    """Create risk assessment heatmap"""
    fig, axes = plt.subplots(2, 2, figsize=(18, 14))
    axes = axes.flatten()
    
    for idx, (phase_name, phase_risks) in enumerate(risks.items()):
        ax = axes[idx]
        
        # Create risk matrix data
        risk_matrix = np.zeros((10, 10))  # 10x10 grid for probability vs impact
        risk_labels = []
        
        for risk in phase_risks:
            prob_idx = int(risk['probability'] * 9)  # Scale 0-1 to 0-9
            impact_idx = int((risk['impact'] / 10) * 9)  # Scale 0-10 to 0-9
            risk_score = risk['probability'] * risk['impact']
            risk_matrix[9 - prob_idx, impact_idx] = risk_score  # Invert Y-axis
            risk_labels.append((risk['name'], prob_idx, impact_idx, risk_score))
        
        # Plot heatmap
        im = ax.imshow(risk_matrix, cmap='YlOrRd', aspect='auto', vmin=0, vmax=9)
        
        # Add risk labels
        for name, prob_idx, impact_idx, score in risk_labels:
            # Determine text color based on background
            text_color = 'white' if score > 4.5 else 'black'
            ax.text(impact_idx, 9 - prob_idx, f'{name}\n{score:.1f}', 
                   ha='center', va='center', fontsize=8, fontweight='bold',
                   color=text_color, wrap=True)
        
        # Formatting
        ax.set_xlabel('Impact', fontsize=12, fontweight='bold')
        ax.set_ylabel('Probability', fontsize=12, fontweight='bold')
        ax.set_title(f'{phase_name}: Risk Assessment Matrix', fontsize=14, fontweight='bold')
        ax.set_xticks(range(10))
        ax.set_yticks(range(10))
        ax.set_xticklabels([f'{i}' for i in range(1, 11)], fontsize=9)
        ax.set_yticklabels([f'{i*10}%' for i in range(10, 0, -1)], fontsize=9)
        
        # Add risk zones
        ax.axhline(y=3, color='orange', linestyle='--', linewidth=2, alpha=0.5)
        ax.axvline(x=5, color='orange', linestyle='--', linewidth=2, alpha=0.5)
        ax.text(2, 1, 'LOW RISK', fontsize=10, fontweight='bold', alpha=0.7)
        ax.text(7, 1, 'MEDIUM RISK', fontsize=10, fontweight='bold', alpha=0.7)
        ax.text(7, 8, 'HIGH RISK', fontsize=10, fontweight='bold', alpha=0.7, color='white')
        
        # Colorbar
        plt.colorbar(im, ax=ax, label='Risk Score')
    
    fig.suptitle('Risk Assessment Heat Maps by Phase', fontsize=18, fontweight='bold', y=0.995)
    plt.tight_layout()
    plt.savefig('/tmp/risk_heatmap.png', dpi=300, bbox_inches='tight')
    print("✓ Risk heatmap saved to /tmp/risk_heatmap.png")
    plt.close()


def create_metrics_dashboard():
    """Create success metrics progression dashboard"""
    fig, axes = plt.subplots(2, 3, figsize=(18, 10))
    phase_names = list(metrics_progression.keys())
    
    # Define metrics to plot
    metrics = [
        ('Users', 'Total Users', False, '#E63946'),
        ('Videos Generated', 'Videos Generated (Cumulative)', False, '#F1FAEE'),
        ('Success Rate', 'Video Generation Success Rate (%)', True, '#A8DADC'),
        ('Avg Gen Time (min)', 'Avg Generation Time (min)', True, '#457B9D'),
        ('Cost per Video', 'Cost per Video ($)', True, '#1D3557'),
        ('NPS', 'Net Promoter Score', True, '#2A9D8F')
    ]
    
    for idx, (metric_key, title, show_target, color) in enumerate(metrics):
        ax = axes[idx // 3, idx % 3]
        
        # Extract data
        values = [metrics_progression[p][metric_key] for p in phase_names]
        
        # Handle None values (NPS not measured in early phases)
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
        
        # Plot
        ax.plot(x_data, y_data, marker='o', linewidth=3, markersize=10, color=color)
        ax.fill_between(x_data, y_data, alpha=0.3, color=color)
        
        # Add value labels
        for i, (x, y) in enumerate(zip(x_data, y_data)):
            offset = 0.05 * (max(y_data) - min(y_data)) if len(y_data) > 1 else 0.05 * y
            ax.text(x, y + offset, f'{y:,.0f}' if y >= 100 else f'{y:.1f}', 
                   ha='center', fontsize=10, fontweight='bold')
        
        # Formatting
        ax.set_xticks(range(len(phase_names)))
        ax.set_xticklabels([p.replace(' ', '\n') for p in phase_names], fontsize=9)
        ax.set_ylabel(metric_key.replace('_', ' '), fontsize=10, fontweight='bold')
        ax.set_title(title, fontsize=12, fontweight='bold')
        ax.grid(alpha=0.3)
        
        # Add target line for relevant metrics
        if show_target and metric_key in ['Success Rate', 'Cost per Video']:
            if metric_key == 'Success Rate':
                target = 90
                ax.axhline(y=target, color='green', linestyle='--', linewidth=2, alpha=0.5)
                ax.text(len(phase_names) - 0.5, target, f'Target: {target}%', 
                       fontsize=9, fontweight='bold', color='green')
            elif metric_key == 'Cost per Video':
                target = 2.0
                ax.axhline(y=target, color='green', linestyle='--', linewidth=2, alpha=0.5)
                ax.text(len(phase_names) - 0.5, target, f'Target: ${target}', 
                       fontsize=9, fontweight='bold', color='green')
    
    fig.suptitle('Success Metrics Progression Across Phases', fontsize=18, fontweight='bold')
    plt.tight_layout()
    plt.savefig('/tmp/metrics_dashboard.png', dpi=300, bbox_inches='tight')
    print("✓ Metrics dashboard saved to /tmp/metrics_dashboard.png")
    plt.close()


def create_decision_tree():
    """Create phase gate decision tree"""
    fig, ax = plt.subplots(figsize=(16, 12))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis('off')
    
    # Define decision tree structure
    decisions = [
        {
            'phase': 'Phase 0',
            'position': (5, 9),
            'criteria': [
                'Technical spikes complete',
                'PoCs validated',
                'Cost < $0.50/sec video',
                'Audio accuracy > 85%'
            ],
            'go': (2, 7),
            'no_go': (8, 7)
        },
        {
            'phase': 'Phase 1',
            'position': (5, 6),
            'criteria': [
                '100+ videos generated',
                'Success rate > 75%',
                'User satisfaction > 3/5',
                'Cost per video < $5'
            ],
            'go': (2, 4),
            'no_go': (8, 4)
        },
        {
            'phase': 'Phase 2',
            'position': (5, 3),
            'criteria': [
                '1,000+ beta users',
                'NPS > 35',
                'Success rate > 85%',
                'Security audit passed'
            ],
            'go': (2, 1),
            'no_go': (8, 1)
        }
    ]
    
    for decision in decisions:
        # Main decision box
        phase_box = FancyBboxPatch(
            (decision['position'][0] - 1.5, decision['position'][1] - 0.3),
            3, 0.6,
            boxstyle="round,pad=0.1",
            facecolor='lightblue',
            edgecolor='black',
            linewidth=2
        )
        ax.add_patch(phase_box)
        ax.text(decision['position'][0], decision['position'][1], 
               f"{decision['phase']} Gate", ha='center', va='center',
               fontsize=13, fontweight='bold')
        
        # Criteria list
        criteria_text = '\n'.join([f'• {c}' for c in decision['criteria']])
        ax.text(decision['position'][0], decision['position'][1] - 0.8,
               criteria_text, ha='center', va='top', fontsize=9,
               bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
        
        # GO path
        go_box = FancyBboxPatch(
            (decision['go'][0] - 0.8, decision['go'][1] - 0.25),
            1.6, 0.5,
            boxstyle="round,pad=0.1",
            facecolor='lightgreen',
            edgecolor='black',
            linewidth=2
        )
        ax.add_patch(go_box)
        ax.text(decision['go'][0], decision['go'][1], 
               'GO\nProceed to\nNext Phase', ha='center', va='center',
               fontsize=10, fontweight='bold')
        
        # Arrow to GO
        ax.annotate('', xy=decision['go'], 
                   xytext=(decision['position'][0] - 0.5, decision['position'][1] - 0.5),
                   arrowprops=dict(arrowstyle='->', lw=3, color='green'))
        ax.text(decision['go'][0] + 0.3, decision['go'][1] + 0.5, 
               'All criteria\nmet', fontsize=8, color='green', fontweight='bold')
        
        # NO-GO path
        nogo_box = FancyBboxPatch(
            (decision['no_go'][0] - 0.8, decision['no_go'][1] - 0.25),
            1.6, 0.5,
            boxstyle="round,pad=0.1",
            facecolor='lightcoral',
            edgecolor='black',
            linewidth=2
        )
        ax.add_patch(nogo_box)
        ax.text(decision['no_go'][0], decision['no_go'][1], 
               'NO-GO\nReassess or\nPivot', ha='center', va='center',
               fontsize=10, fontweight='bold')
        
        # Arrow to NO-GO
        ax.annotate('', xy=decision['no_go'], 
                   xytext=(decision['position'][0] + 0.5, decision['position'][1] - 0.5),
                   arrowprops=dict(arrowstyle='->', lw=3, color='red'))
        ax.text(decision['no_go'][0] - 0.3, decision['no_go'][1] + 0.5, 
               'Critical\nfailure', fontsize=8, color='red', fontweight='bold')
    
    # Title
    ax.text(5, 9.7, 'Phase Gate Decision Framework', ha='center', 
           fontsize=16, fontweight='bold')
    
    plt.savefig('/tmp/decision_tree.png', dpi=300, bbox_inches='tight')
    print("✓ Decision tree saved to /tmp/decision_tree.png")
    plt.close()


def generate_summary_report():
    """Generate a text-based summary report with key metrics"""
    
    total_cost = sum(phases[p]['cost'] for p in phases.keys())
    total_weeks = sum(phases[p]['duration_weeks'] for p in phases.keys())
    total_risks = sum(len(risks[p]) for p in risks.keys())
    high_risks = sum(1 for p in risks.keys() for r in risks[p] 
                     if r['probability'] * r['impact'] > 6)
    
    report = f"""
╔══════════════════════════════════════════════════════════════════════════════╗
║                AI MUSIC VIDEO GENERATOR - IMPLEMENTATION SUMMARY              ║
╚══════════════════════════════════════════════════════════════════════════════╝

PROJECT OVERVIEW
────────────────────────────────────────────────────────────────────────────────
Total Duration:              {total_weeks} weeks (~{total_weeks/4:.1f} months)
Total Estimated Cost:        ${total_cost:,.0f}
Peak Team Size:              {max(phases[p]['team_size'] for p in phases.keys()):.1f} FTEs
Average Weekly Burn Rate:    ${total_cost/total_weeks:,.0f}

PHASE BREAKDOWN
────────────────────────────────────────────────────────────────────────────────
"""
    
    for phase_name, phase_data in phases.items():
        report += f"""
{phase_name}: {phase_data['name']}
  Duration:        {phase_data['duration_weeks']} weeks
  Team Size:       {phase_data['team_size']:.1f} FTEs
  Cost:            ${phase_data['cost']:,.0f}
  Deliverables:    {phase_data['deliverables']}
  Success Target:  {phase_data['success_rate_target']}% video generation success
"""
    
    report += f"""
RISK ASSESSMENT
────────────────────────────────────────────────────────────────────────────────
Total Identified Risks:      {total_risks}
High-Priority Risks:         {high_risks} (risk score > 6)

Top 5 Critical Risks:
"""
    
    # Calculate top risks across all phases
    all_risks = []
    for phase_name, phase_risks in risks.items():
        for risk in phase_risks:
            risk_score = risk['probability'] * risk['impact']
            all_risks.append((phase_name, risk['name'], risk_score))
    
    all_risks.sort(key=lambda x: x[2], reverse=True)
    
    for i, (phase, name, score) in enumerate(all_risks[:5], 1):
        report += f"  {i}. {name} ({phase}) - Risk Score: {score:.1f}\n"
    
    report += f"""
SUCCESS METRICS TARGETS (End of Phase 3)
────────────────────────────────────────────────────────────────────────────────
Total Users:                 10,000+
Videos Generated:            50,000+
Video Success Rate:          90%+
Average Generation Time:     <10 minutes (4-min song)
Cost per Video:              <$3.00
Net Promoter Score:          50+
System Uptime:               99.9%+

KEY MILESTONES
────────────────────────────────────────────────────────────────────────────────
Week 8:   Foundation complete, technical feasibility validated
Week 20:  MVP launched to internal users (100 videos generated)
Week 38:  Beta release with advanced features (1,000+ users)
Week 52:  General Availability with production scalability

RESOURCE ALLOCATION HIGHLIGHTS
────────────────────────────────────────────────────────────────────────────────
Backend Engineers:           Peak at 4.0 FTEs in Phase 2-3
ML Engineers:                Peak at 2.0 FTEs in Phase 2
Frontend Engineers:          Peak at 3.0 FTEs in Phase 2-3
DevOps/SRE:                  Peak at 2.0 FTEs in Phase 3

COST BREAKDOWN (Total)
────────────────────────────────────────────────────────────────────────────────
Labor:                       ${sum(cost_breakdown[p]['Labor'] for p in phases.keys()):,.0f} ({sum(cost_breakdown[p]['Labor'] for p in phases.keys())/total_cost*100:.1f}%)
Infrastructure:              ${sum(cost_breakdown[p]['Infrastructure'] for p in phases.keys()):,.0f} ({sum(cost_breakdown[p]['Infrastructure'] for p in phases.keys())/total_cost*100:.1f}%)
API Costs:                   ${sum(cost_breakdown[p]['API Costs'] for p in phases.keys()):,.0f} ({sum(cost_breakdown[p]['API Costs'] for p in phases.keys())/total_cost*100:.1f}%)
Tools & Services:            ${sum(cost_breakdown[p]['Tools'] for p in phases.keys()):,.0f} ({sum(cost_breakdown[p]['Tools'] for p in phases.keys())/total_cost*100:.1f}%)
Other:                       ${sum(cost_breakdown[p]['Other'] for p in phases.keys()):,.0f} ({sum(cost_breakdown[p]['Other'] for p in phases.keys())/total_cost*100:.1f}%)
Contingency:                 ${sum(cost_breakdown[p]['Contingency'] for p in phases.keys()):,.0f} ({sum(cost_breakdown[p]['Contingency'] for p in phases.keys())/total_cost*100:.1f}%)

CRITICAL PATH DEPENDENCIES
────────────────────────────────────────────────────────────────────────────────
1. Audio Processing Pipeline (Phase 1) → Blocks storyboard generation
2. Storyboard Generation (Phase 1) → Blocks video orchestration
3. Video API Integration (Phase 1) → Blocks end-to-end testing
4. Avatar Integration (Phase 2) → Required for AI agent capabilities
5. Real-Time Collaboration (Phase 3) → Required for enterprise features

RECOMMENDED DECISION GATES
────────────────────────────────────────────────────────────────────────────────
Phase 0 → Phase 1:  All technical spikes passed, PoCs validated, costs acceptable
Phase 1 → Phase 2:  100+ videos, >75% success rate, user satisfaction >3/5
Phase 2 → Phase 3:  1,000+ users, NPS >35, security audit passed
Phase 3 → Launch:   10K users, 99.9% uptime, SOC 2 complete, no P0 bugs

────────────────────────────────────────────────────────────────────────────────
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
    
    # Save report
    with open('/tmp/implementation_summary.txt', 'w') as f:
        f.write(report)
    
    print("✓ Summary report saved to /tmp/implementation_summary.txt")
    return report


def create_scenario_comparison():
    """Create scenario comparison for different implementation strategies"""
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    
    scenarios = {
        'Baseline': {
            'duration': 52,
            'cost': 3371925,
            'risk': 6.5,
            'quality': 85,
            'description': 'Proposed phased approach'
        },
        'Aggressive': {
            'duration': 36,
            'cost': 4200000,
            'risk': 8.5,
            'quality': 75,
            'description': 'Parallel development, larger team'
        },
        'Conservative': {
            'duration': 72,
            'cost': 3000000,
            'risk': 4.0,
            'quality': 90,
            'description': 'Extended validation, smaller team'
        },
        'Minimum Viable': {
            'duration': 28,
            'cost': 1800000,
            'risk': 7.0,
            'quality': 70,
            'description': 'MVP only, no advanced features'
        }
    }
    
    scenario_names = list(scenarios.keys())
    colors = ['#2A9D8F', '#E76F51', '#264653', '#F4A261']
    
    # 1. Duration comparison
    ax1 = axes[0, 0]
    durations = [scenarios[s]['duration'] for s in scenario_names]
    bars = ax1.barh(scenario_names, durations, color=colors, alpha=0.8, edgecolor='black')
    ax1.set_xlabel('Duration (weeks)', fontsize=12, fontweight='bold')
    ax1.set_title('Timeline Comparison', fontsize=14, fontweight='bold')
    ax1.grid(axis='x', alpha=0.3)
    
    for bar in bars:
        width = bar.get_width()
        ax1.text(width + 2, bar.get_y() + bar.get_height()/2, 
                f'{width} weeks', va='center', fontsize=10, fontweight='bold')
    
    # 2. Cost comparison
    ax2 = axes[0, 1]
    costs = [scenarios[s]['cost'] / 1e6 for s in scenario_names]
    bars = ax2.barh(scenario_names, costs, color=colors, alpha=0.8, edgecolor='black')
    ax2.set_xlabel('Cost ($ millions)', fontsize=12, fontweight='bold')
    ax2.set_title('Cost Comparison', fontsize=14, fontweight='bold')
    ax2.grid(axis='x', alpha=0.3)
    
    for bar in bars:
        width = bar.get_width()
        ax2.text(width + 0.1, bar.get_y() + bar.get_height()/2, 
                f'${width:.2f}M', va='center', fontsize=10, fontweight='bold')
    
    # 3. Risk vs Quality scatter
    ax3 = axes[1, 0]
    risks = [scenarios[s]['risk'] for s in scenario_names]
    qualities = [scenarios[s]['quality'] for s in scenario_names]
    
    scatter = ax3.scatter(risks, qualities, s=500, c=colors, alpha=0.7, edgecolor='black', linewidth=2)
    
    for i, name in enumerate(scenario_names):
        ax3.annotate(name, (risks[i], qualities[i]), fontsize=11, fontweight='bold',
                    xytext=(10, 10), textcoords='offset points',
                    bbox=dict(boxstyle='round', facecolor='white', alpha=0.8))
    
    ax3.set_xlabel('Risk Level (1-10)', fontsize=12, fontweight='bold')
    ax3.set_ylabel('Expected Quality Score (1-100)', fontsize=12, fontweight='bold')
    ax3.set_title('Risk vs Quality Trade-off', fontsize=14, fontweight='bold')
    ax3.grid(alpha=0.3)
    
    # Add quadrants
    ax3.axhline(y=80, color='gray', linestyle='--', alpha=0.5)
    ax3.axvline(x=6, color='gray', linestyle='--', alpha=0.5)
    ax3.text(3, 95, 'Low Risk\nHigh Quality', ha='center', fontsize=9, alpha=0.6)
    ax3.text(8.5, 95, 'High Risk\nHigh Quality', ha='center', fontsize=9, alpha=0.6)
    ax3.text(3, 72, 'Low Risk\nLow Quality', ha='center', fontsize=9, alpha=0.6)
    ax3.text(8.5, 72, 'High Risk\nLow Quality', ha='center', fontsize=9, alpha=0.6)
    
    # 4. Radar chart
    ax4 = axes[1, 1]
    
    categories = ['Speed\n(inverse weeks)', 'Cost\n(inverse $M)', 'Low Risk\n(10-risk)', 
                  'Quality\n(score)', 'Features\n(completeness)']
    
    # Normalize all metrics to 0-10 scale
    def normalize(value, min_val, max_val):
        return 10 * (value - min_val) / (max_val - min_val)
    
    # Calculate feature completeness score (baseline = 10)
    feature_scores = {
        'Baseline': 10,
        'Aggressive': 10,
        'Conservative': 10,
        'Minimum Viable': 5
    }
    
    angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
    angles += angles[:1]
    
    ax4 = plt.subplot(2, 2, 4, projection='polar')
    
    for i, name in enumerate(scenario_names):
        values = [
            normalize(1/scenarios[name]['duration'], 1/72, 1/28),  # Speed (inverse)
            normalize(1/scenarios[name]['cost'], 1/4.2e6, 1/1.8e6),  # Cost (inverse)
            normalize(10 - scenarios[name]['risk'], 10-8.5, 10-4),  # Low risk
            normalize(scenarios[name]['quality'], 70, 90),  # Quality
            normalize(feature_scores[name], 5, 10)  # Features
        ]
        values += values[:1]
        
        ax4.plot(angles, values, 'o-', linewidth=2, label=name, color=colors[i])
        ax4.fill(angles, values, alpha=0.15, color=colors[i])
    
    ax4.set_xticks(angles[:-1])
    ax4.set_xticklabels(categories, fontsize=10)
    ax4.set_ylim(0, 10)
    ax4.set_title('Multi-Dimensional Scenario Comparison', fontsize=14, fontweight='bold', pad=20)
    ax4.legend(loc='upper right', bbox_to_anchor=(1.3, 1.0), fontsize=9)
    ax4.grid(True)
    
    fig.suptitle('Implementation Strategy Scenarios', fontsize=18, fontweight='bold')
    plt.tight_layout()
    plt.savefig('/tmp/scenario_comparison.png', dpi=300, bbox_inches='tight')
    print("✓ Scenario comparison saved to /tmp/scenario_comparison.png")
    plt.close()


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Generate all visualizations and reports"""
    print("\n" + "="*80)
    print("AI MUSIC VIDEO GENERATOR - ROADMAP ANALYSIS")
    print("="*80 + "\n")
    
    print("Generating visualizations...\n")
    
    create_gantt_chart()
    create_resource_allocation_chart()
    create_cost_analysis()
    create_risk_heatmap()
    create_metrics_dashboard()
    create_decision_tree()
    create_scenario_comparison()
    
    print("\nGenerating summary report...\n")
    report = generate_summary_report()
    
    print("\n" + "="*80)
    print("GENERATION COMPLETE")
    print("="*80)
    print("\nGenerated files:")
    print("  • /tmp/gantt_chart.png - Timeline with workstreams")
    print("  • /tmp/resource_allocation.png - Team composition over time")
    print("  • /tmp/cost_analysis.png - Comprehensive cost breakdown")
    print("  • /tmp/risk_heatmap.png - Risk assessment matrices")
    print("  • /tmp/metrics_dashboard.png - Success metrics progression")
    print("  • /tmp/decision_tree.png - Phase gate decision framework")
    print("  • /tmp/scenario_comparison.png - Alternative strategies")
    print("  • /tmp/implementation_summary.txt - Detailed text report")
    print("\n" + "="*80 + "\n")
    
    # Print summary excerpt
    print("SUMMARY EXCERPT:")
    print("-" * 80)
    print(report.split("PHASE BREAKDOWN")[0])

if __name__ == "__main__":
    main()
