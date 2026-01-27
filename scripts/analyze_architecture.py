"""
Generate architecture diagrams for the Music Video Conversational AI system
"""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import numpy as np

# Set style
plt.style.use('default')
plt.rcParams['font.size'] = 9
plt.rcParams['font.family'] = 'sans-serif'

def create_system_architecture_diagram():
    """Create high-level system architecture diagram"""
    fig, ax = plt.subplots(1, 1, figsize=(14, 10))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 10)
    ax.axis('off')
    
    # Title
    ax.text(5, 9.5, 'Music Video AI System Architecture', 
            ha='center', va='top', fontsize=16, fontweight='bold')
    
    # Client Layer
    client_box = FancyBboxPatch((0.5, 7.5), 9, 1.5, 
                                boxstyle="round,pad=0.1", 
                                facecolor='#E3F2FD', 
                                edgecolor='#1976D2', 
                                linewidth=2)
    ax.add_patch(client_box)
    ax.text(5, 8.7, 'Client Application', ha='center', fontweight='bold', fontsize=11)
    
    # Client components
    ax.add_patch(FancyBboxPatch((1, 8), 2, 0.5, facecolor='#BBDEFB', edgecolor='#1976D2'))
    ax.text(2, 8.25, 'Storyboard\nCanvas', ha='center', va='center', fontsize=8)
    
    ax.add_patch(FancyBboxPatch((4, 8), 2, 0.5, facecolor='#BBDEFB', edgecolor='#1976D2'))
    ax.text(5, 8.25, 'Video Editor\nTimeline', ha='center', va='center', fontsize=8)
    
    ax.add_patch(FancyBboxPatch((7, 8), 2, 0.5, facecolor='#BBDEFB', edgecolor='#1976D2'))
    ax.text(8, 8.25, 'Chat Interface\n(WebSocket)', ha='center', va='center', fontsize=8)
    
    # API Gateway
    gateway_box = FancyBboxPatch((0.5, 6.3), 9, 0.8, 
                                 boxstyle="round,pad=0.05", 
                                 facecolor='#FFF3E0', 
                                 edgecolor='#F57C00', 
                                 linewidth=2)
    ax.add_patch(gateway_box)
    ax.text(5, 6.7, 'API Gateway (Auth, Rate Limiting, Routing)', 
            ha='center', va='center', fontweight='bold', fontsize=10)
    
    # Arrows from client to gateway
    ax.arrow(2, 7.5, 0, -0.6, head_width=0.2, head_length=0.1, fc='black', ec='black')
    ax.arrow(8, 7.5, 0, -0.6, head_width=0.2, head_length=0.1, fc='black', ec='black')
    
    # Services Layer
    # Media Service
    media_box = FancyBboxPatch((0.5, 3.5), 3, 2.3, 
                               boxstyle="round,pad=0.1", 
                               facecolor='#E8F5E9', 
                               edgecolor='#388E3C', 
                               linewidth=2)
    ax.add_patch(media_box)
    ax.text(2, 5.5, 'Media Service', ha='center', fontweight='bold', fontsize=10)
    ax.text(2, 5.1, '• Video Processing', ha='center', fontsize=8)
    ax.text(2, 4.8, '• Audio Analysis', ha='center', fontsize=8)
    ax.text(2, 4.5, '• Thumbnail Gen', ha='center', fontsize=8)
    ax.text(2, 4.2, '• Format Conversion', ha='center', fontsize=8)
    ax.text(2, 3.9, '• FFmpeg Integration', ha='center', fontsize=8)
    
    # AI Service
    ai_box = FancyBboxPatch((4, 3.5), 3, 2.3, 
                            boxstyle="round,pad=0.1", 
                            facecolor='#F3E5F5', 
                            edgecolor='#7B1FA2', 
                            linewidth=2)
    ax.add_patch(ai_box)
    ax.text(5.5, 5.5, 'Conversational AI', ha='center', fontweight='bold', fontsize=10)
    ax.text(5.5, 5.1, '• LangChain Agent', ha='center', fontsize=8)
    ax.text(5.5, 4.8, '• GPT-4 + Tools', ha='center', fontsize=8)
    ax.text(5.5, 4.5, '• State Manager', ha='center', fontsize=8)
    ax.text(5.5, 4.2, '• NLU Pipeline', ha='center', fontsize=8)
    ax.text(5.5, 3.9, '• Context Manager', ha='center', fontsize=8)
    
    # Video Gen Service
    vgen_box = FancyBboxPatch((7.5, 3.5), 2, 2.3, 
                              boxstyle="round,pad=0.1", 
                              facecolor='#FCE4EC', 
                              edgecolor='#C2185B', 
                              linewidth=2)
    ax.add_patch(vgen_box)
    ax.text(8.5, 5.5, 'Video Gen', ha='center', fontweight='bold', fontsize=10)
    ax.text(8.5, 5.1, '• CogVideoX', ha='center', fontsize=8)
    ax.text(8.5, 4.8, '• Vidu API', ha='center', fontsize=8)
    ax.text(8.5, 4.5, '• Google Veo', ha='center', fontsize=8)
    ax.text(8.5, 4.2, '• Style Transfer', ha='center', fontsize=8)
    ax.text(8.5, 3.9, '• Motion Control', ha='center', fontsize=8)
    
    # Arrows from gateway to services
    ax.arrow(2, 6.3, 0, -0.4, head_width=0.2, head_length=0.1, fc='black', ec='black')
    ax.arrow(5.5, 6.3, 0, -0.4, head_width=0.2, head_length=0.1, fc='black', ec='black')
    ax.arrow(8, 6.3, 0.3, -0.4, head_width=0.2, head_length=0.1, fc='black', ec='black')
    
    # Storage Layer
    # S3
    s3_box = FancyBboxPatch((0.5, 1.5), 2.2, 1.5, 
                            boxstyle="round,pad=0.1", 
                            facecolor='#FFF9C4', 
                            edgecolor='#F9A825', 
                            linewidth=2)
    ax.add_patch(s3_box)
    ax.text(1.6, 2.5, 'S3 Storage', ha='center', fontweight='bold', fontsize=10)
    ax.text(1.6, 2.2, '• Media Files', ha='center', fontsize=8)
    ax.text(1.6, 1.95, '• Rendered Videos', ha='center', fontsize=8)
    ax.text(1.6, 1.7, '• CDN Distribution', ha='center', fontsize=8)
    
    # Redis
    redis_box = FancyBboxPatch((3, 1.5), 2, 1.5, 
                               boxstyle="round,pad=0.1", 
                               facecolor='#FFCCBC', 
                               edgecolor='#E64A19', 
                               linewidth=2)
    ax.add_patch(redis_box)
    ax.text(4, 2.5, 'Redis', ha='center', fontweight='bold', fontsize=10)
    ax.text(4, 2.2, '• Session State', ha='center', fontsize=8)
    ax.text(4, 1.95, '• Operation Cache', ha='center', fontsize=8)
    ax.text(4, 1.7, '• Real-time Data', ha='center', fontsize=8)
    
    # Postgres
    postgres_box = FancyBboxPatch((5.3, 1.5), 2, 1.5, 
                                  boxstyle="round,pad=0.1", 
                                  facecolor='#B2DFDB', 
                                  edgecolor='#00796B', 
                                  linewidth=2)
    ax.add_patch(postgres_box)
    ax.text(6.3, 2.5, 'PostgreSQL', ha='center', fontweight='bold', fontsize=10)
    ax.text(6.3, 2.2, '• Projects', ha='center', fontsize=8)
    ax.text(6.3, 1.95, '• User Data', ha='center', fontsize=8)
    ax.text(6.3, 1.7, '• Edit History', ha='center', fontsize=8)
    
    # Vector DB
    vector_box = FancyBboxPatch((7.6, 1.5), 1.9, 1.5, 
                                boxstyle="round,pad=0.1", 
                                facecolor='#D1C4E9', 
                                edgecolor='#5E35B1', 
                                linewidth=2)
    ax.add_patch(vector_box)
    ax.text(8.55, 2.5, 'Vector DB', ha='center', fontweight='bold', fontsize=10)
    ax.text(8.55, 2.2, '• Embeddings', ha='center', fontsize=8)
    ax.text(8.55, 1.95, '• Semantic', ha='center', fontsize=8)
    ax.text(8.55, 1.7, '  Search', ha='center', fontsize=8)
    
    # Arrows from services to storage
    ax.arrow(2, 3.5, -0.3, -0.4, head_width=0.15, head_length=0.1, fc='gray', ec='gray')
    ax.arrow(5.5, 3.5, -1.3, -0.4, head_width=0.15, head_length=0.1, fc='gray', ec='gray')
    ax.arrow(5.5, 3.5, 0.7, -0.4, head_width=0.15, head_length=0.1, fc='gray', ec='gray')
    ax.arrow(5.5, 3.5, 2.8, -0.4, head_width=0.15, head_length=0.1, fc='gray', ec='gray')
    
    # Legend
    ax.text(0.5, 0.8, 'Data Flow:', fontweight='bold', fontsize=9)
    ax.arrow(0.8, 0.6, 0.5, 0, head_width=0.08, head_length=0.08, fc='black', ec='black')
    ax.text(1.5, 0.6, 'Synchronous', va='center', fontsize=8)
    
    ax.arrow(3, 0.6, 0.5, 0, head_width=0.08, head_length=0.08, fc='gray', ec='gray')
    ax.text(3.7, 0.6, 'Async/Storage', va='center', fontsize=8)
    
    plt.tight_layout()
    plt.savefig('music_video_system_architecture.png', dpi=300, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    print("✓ Saved: music_video_system_architecture.png")
    plt.close()


def create_conversation_flow_diagram():
    """Create conversation flow diagram"""
    fig, ax = plt.subplots(1, 1, figsize=(12, 10))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 12)
    ax.axis('off')
    
    # Title
    ax.text(5, 11.5, 'Conversation Flow: "Make the chorus more dramatic"', 
            ha='center', va='top', fontsize=14, fontweight='bold')
    
    y_pos = 10.5
    step_height = 1.3
    
    # Step 1: User Input
    ax.add_patch(FancyBboxPatch((0.5, y_pos), 9, 0.8, 
                                boxstyle="round,pad=0.1", 
                                facecolor='#E3F2FD', 
                                edgecolor='#1976D2', 
                                linewidth=2))
    ax.text(5, y_pos + 0.4, '1. User Input: "Make the chorus more dramatic"', 
            ha='center', va='center', fontweight='bold', fontsize=10)
    
    # Arrow
    ax.arrow(5, y_pos, 0, -0.4, head_width=0.3, head_length=0.15, fc='black', ec='black')
    y_pos -= step_height
    
    # Step 2: Intent Classification
    ax.add_patch(FancyBboxPatch((0.5, y_pos), 9, 1, 
                                boxstyle="round,pad=0.1", 
                                facecolor='#F3E5F5', 
                                edgecolor='#7B1FA2', 
                                linewidth=2))
    ax.text(5, y_pos + 0.7, '2. Intent Classification', ha='center', fontweight='bold', fontsize=10)
    ax.text(5, y_pos + 0.35, 'Mode: refinement | Target: chorus section | Adjustment: more dramatic', 
            ha='center', fontsize=9)
    
    ax.arrow(5, y_pos, 0, -0.4, head_width=0.3, head_length=0.15, fc='black', ec='black')
    y_pos -= step_height
    
    # Step 3: Load Context
    ax.add_patch(FancyBboxPatch((0.5, y_pos), 9, 1.1, 
                                boxstyle="round,pad=0.1", 
                                facecolor='#E8F5E9', 
                                edgecolor='#388E3C', 
                                linewidth=2))
    ax.text(5, y_pos + 0.8, '3. Load Context', ha='center', fontweight='bold', fontsize=10)
    ax.text(2, y_pos + 0.45, '• Music: chorus at 45s-75s', ha='left', fontsize=8)
    ax.text(2, y_pos + 0.2, '• Timeline: 8 clips in chorus', ha='left', fontsize=8)
    ax.text(6, y_pos + 0.45, '• Last drama level: 5', ha='left', fontsize=8)
    ax.text(6, y_pos + 0.2, '• Operation history', ha='left', fontsize=8)
    
    ax.arrow(5, y_pos, 0, -0.4, head_width=0.3, head_length=0.15, fc='black', ec='black')
    y_pos -= step_height + 0.3
    
    # Step 4: Agent Planning
    ax.add_patch(FancyBboxPatch((0.5, y_pos), 9, 1.1, 
                                boxstyle="round,pad=0.1", 
                                facecolor='#FFF3E0', 
                                edgecolor='#F57C00', 
                                linewidth=2))
    ax.text(5, y_pos + 0.8, '4. Agent Planning', ha='center', fontweight='bold', fontsize=10)
    ax.text(5, y_pos + 0.5, 'Tools to use:', ha='center', fontsize=9)
    ax.text(2.5, y_pos + 0.2, '1. find_music_section("chorus")', ha='left', fontsize=8)
    ax.text(6, y_pos + 0.2, '2. adjust_dramatic_intensity()', ha='left', fontsize=8)
    
    ax.arrow(5, y_pos, 0, -0.4, head_width=0.3, head_length=0.15, fc='black', ec='black')
    y_pos -= step_height + 0.2
    
    # Step 5: Tool Execution
    ax.add_patch(FancyBboxPatch((0.5, y_pos), 9, 1.2, 
                                boxstyle="round,pad=0.1", 
                                facecolor='#FCE4EC', 
                                edgecolor='#C2185B', 
                                linewidth=2))
    ax.text(5, y_pos + 0.9, '5. Tool Execution', ha='center', fontweight='bold', fontsize=10)
    ax.text(5, y_pos + 0.6, 'Find chorus clips → Apply adjustments:', ha='center', fontsize=9)
    ax.text(2, y_pos + 0.3, '• Contrast: +20%', ha='left', fontsize=8)
    ax.text(5, y_pos + 0.3, '• Motion blur: +15%', ha='left', fontsize=8)
    ax.text(7.5, y_pos + 0.3, '• Cut frequency: +30%', ha='left', fontsize=8)
    
    ax.arrow(5, y_pos, 0, -0.4, head_width=0.3, head_length=0.15, fc='black', ec='black')
    y_pos -= step_height + 0.2
    
    # Step 6: State Update
    ax.add_patch(FancyBboxPatch((0.5, y_pos), 9, 1, 
                                boxstyle="round,pad=0.1", 
                                facecolor='#FFCCBC', 
                                edgecolor='#E64A19', 
                                linewidth=2))
    ax.text(5, y_pos + 0.7, '6. State Update', ha='center', fontweight='bold', fontsize=10)
    ax.text(2.5, y_pos + 0.35, '• Save parameter changes', ha='left', fontsize=8)
    ax.text(6, y_pos + 0.35, '• Add to undo stack', ha='left', fontsize=8)
    ax.text(4.25, y_pos + 0.05, '• Generate preview', ha='center', fontsize=8)
    
    ax.arrow(5, y_pos, 0, -0.4, head_width=0.3, head_length=0.15, fc='black', ec='black')
    y_pos -= step_height
    
    # Step 7: Response
    ax.add_patch(FancyBboxPatch((0.5, y_pos), 9, 0.9, 
                                boxstyle="round,pad=0.1", 
                                facecolor='#C8E6C9', 
                                edgecolor='#388E3C', 
                                linewidth=2))
    ax.text(5, y_pos + 0.6, '7. Natural Language Response', ha='center', fontweight='bold', fontsize=10)
    ax.text(5, y_pos + 0.25, '"I\'ve made the chorus more dramatic by increasing contrast,', ha='center', fontsize=9)
    ax.text(5, y_pos + 0.05, 'adding motion blur, and tightening the cuts. Preview ready!"', ha='center', fontsize=9)
    
    plt.tight_layout()
    plt.savefig('conversation_flow_diagram.png', dpi=300, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    print("✓ Saved: conversation_flow_diagram.png")
    plt.close()


def create_state_management_diagram():
    """Create state management layers diagram"""
    fig, ax = plt.subplots(1, 1, figsize=(12, 10))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 11)
    ax.axis('off')
    
    # Title
    ax.text(5, 10.5, 'Layered State Management Architecture', 
            ha='center', va='top', fontsize=14, fontweight='bold')
    
    y_pos = 9.5
    layer_height = 1.5
    
    # Layer 1: Ephemeral
    ax.add_patch(FancyBboxPatch((1, y_pos), 8, layer_height, 
                                boxstyle="round,pad=0.1", 
                                facecolor='#FFEBEE', 
                                edgecolor='#C62828', 
                                linewidth=2))
    ax.text(5, y_pos + layer_height - 0.3, 'EPHEMERAL STATE', 
            ha='center', fontweight='bold', fontsize=11)
    ax.text(5, y_pos + layer_height - 0.65, 'Current turn only - discarded after response', 
            ha='center', fontsize=9, style='italic')
    ax.text(2, y_pos + 0.65, '• Current utterance', ha='left', fontsize=8)
    ax.text(2, y_pos + 0.4, '• Parsed intent', ha='left', fontsize=8)
    ax.text(5.5, y_pos + 0.65, '• Extracted entities', ha='left', fontsize=8)
    ax.text(5.5, y_pos + 0.4, '• Tool results', ha='left', fontsize=8)
    ax.text(8, y_pos + 0.1, 'Storage:\nIn-memory', ha='center', fontsize=7, 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor='gray'))
    
    ax.arrow(5, y_pos, 0, -0.3, head_width=0.3, head_length=0.12, fc='black', ec='black')
    y_pos -= layer_height + 0.4
    
    # Layer 2: Conversation
    ax.add_patch(FancyBboxPatch((1, y_pos), 8, layer_height, 
                                boxstyle="round,pad=0.1", 
                                facecolor='#FFF3E0', 
                                edgecolor='#EF6C00', 
                                linewidth=2))
    ax.text(5, y_pos + layer_height - 0.3, 'CONVERSATION STATE', 
            ha='center', fontweight='bold', fontsize=11)
    ax.text(5, y_pos + layer_height - 0.65, 'Active conversation - ~30 min TTL', 
            ha='center', fontsize=9, style='italic')
    ax.text(2, y_pos + 0.65, '• Message history (10-15 turns)', ha='left', fontsize=8)
    ax.text(2, y_pos + 0.4, '• Conversation mode', ha='left', fontsize=8)
    ax.text(5.5, y_pos + 0.65, '• Context window', ha='left', fontsize=8)
    ax.text(5.5, y_pos + 0.4, '• Pending confirmations', ha='left', fontsize=8)
    ax.text(8, y_pos + 0.1, 'Storage:\nRedis', ha='center', fontsize=7, 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor='gray'))
    
    ax.arrow(5, y_pos, 0, -0.3, head_width=0.3, head_length=0.12, fc='black', ec='black')
    y_pos -= layer_height + 0.4
    
    # Layer 3: Session
    ax.add_patch(FancyBboxPatch((1, y_pos), 8, layer_height + 0.3, 
                                boxstyle="round,pad=0.1", 
                                facecolor='#E8F5E9', 
                                edgecolor='#2E7D32', 
                                linewidth=2))
    ax.text(5, y_pos + layer_height + 0.3 - 0.3, 'SESSION STATE', 
            ha='center', fontweight='bold', fontsize=11)
    ax.text(5, y_pos + layer_height + 0.3 - 0.65, 'Editing session - hours/days', 
            ha='center', fontsize=9, style='italic')
    ax.text(2, y_pos + 0.95, '• Timeline (clips, tracks)', ha='left', fontsize=8)
    ax.text(2, y_pos + 0.7, '• Operation stack', ha='left', fontsize=8)
    ax.text(2, y_pos + 0.45, '• Selection state', ha='left', fontsize=8)
    ax.text(5.5, y_pos + 0.95, '• Music analysis cache', ha='left', fontsize=8)
    ax.text(5.5, y_pos + 0.7, '• Storyboard', ha='left', fontsize=8)
    ax.text(5.5, y_pos + 0.45, '• Active parameters', ha='left', fontsize=8)
    ax.text(8, y_pos + 0.25, 'Storage:\nRedis (hot)\n+ Postgres\n(snapshots)', 
            ha='center', fontsize=7, 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor='gray'))
    
    ax.arrow(5, y_pos, 0, -0.3, head_width=0.3, head_length=0.12, fc='black', ec='black')
    y_pos -= layer_height + 0.7
    
    # Layer 4: Project
    ax.add_patch(FancyBboxPatch((1, y_pos), 8, layer_height, 
                                boxstyle="round,pad=0.1", 
                                facecolor='#E1F5FE', 
                                edgecolor='#0277BD', 
                                linewidth=2))
    ax.text(5, y_pos + layer_height - 0.3, 'PROJECT STATE', 
            ha='center', fontweight='bold', fontsize=11)
    ax.text(5, y_pos + layer_height - 0.65, 'Permanent project data', 
            ha='center', fontsize=9, style='italic')
    ax.text(2, y_pos + 0.65, '• Project metadata', ha='left', fontsize=8)
    ax.text(2, y_pos + 0.4, '• Asset library', ha='left', fontsize=8)
    ax.text(5.5, y_pos + 0.65, '• Full edit history', ha='left', fontsize=8)
    ax.text(5.5, y_pos + 0.4, '• Rendered outputs', ha='left', fontsize=8)
    ax.text(8, y_pos + 0.1, 'Storage:\nPostgres\n+ S3', ha='center', fontsize=7, 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor='gray'))
    
    ax.arrow(5, y_pos, 0, -0.3, head_width=0.3, head_length=0.12, fc='black', ec='black')
    y_pos -= layer_height + 0.4
    
    # Layer 5: User
    ax.add_patch(FancyBboxPatch((1, y_pos), 8, layer_height - 0.3, 
                                boxstyle="round,pad=0.1", 
                                facecolor='#F3E5F5', 
                                edgecolor='#6A1B9A', 
                                linewidth=2))
    ax.text(5, y_pos + layer_height - 0.3 - 0.25, 'USER STATE', 
            ha='center', fontweight='bold', fontsize=11)
    ax.text(5, y_pos + layer_height - 0.3 - 0.55, 'Cross-project user data', 
            ha='center', fontsize=9, style='italic')
    ax.text(2.5, y_pos + 0.4, '• User preferences', ha='left', fontsize=8)
    ax.text(5, y_pos + 0.4, '• Style presets', ha='left', fontsize=8)
    ax.text(7, y_pos + 0.4, '• Usage analytics', ha='left', fontsize=8)
    ax.text(8, y_pos + 0.05, 'Storage:\nPostgres', ha='center', fontsize=7, 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='white', edgecolor='gray'))
    
    plt.tight_layout()
    plt.savefig('state_management_layers.png', dpi=300, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    print("✓ Saved: state_management_layers.png")
    plt.close()


def create_websocket_flow_diagram():
    """Create WebSocket communication flow diagram"""
    fig, ax = plt.subplots(1, 1, figsize=(14, 10))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 12)
    ax.axis('off')
    
    # Title
    ax.text(5, 11.5, 'WebSocket Communication Flow', 
            ha='center', va='top', fontsize=14, fontweight='bold')
    
    # Client and Server columns
    client_x = 2
    server_x = 8
    
    # Client header
    ax.add_patch(FancyBboxPatch((client_x - 0.8, 10.5), 1.6, 0.5, 
                                facecolor='#E3F2FD', edgecolor='#1976D2', linewidth=2))
    ax.text(client_x, 10.75, 'Client', ha='center', fontweight='bold', fontsize=11)
    
    # Server header
    ax.add_patch(FancyBboxPatch((server_x - 0.8, 10.5), 1.6, 0.5, 
                                facecolor='#F3E5F5', edgecolor='#7B1FA2', linewidth=2))
    ax.text(server_x, 10.75, 'Server', ha='center', fontweight='bold', fontsize=11)
    
    # Vertical lines
    ax.plot([client_x, client_x], [10.3, 0.5], 'k--', linewidth=1, alpha=0.3)
    ax.plot([server_x, server_x], [10.3, 0.5], 'k--', linewidth=1, alpha=0.3)
    
    y_pos = 9.8
    
    # Connection
    ax.annotate('', xy=(server_x, y_pos), xytext=(client_x, y_pos),
                arrowprops=dict(arrowstyle='->', lw=2, color='#4CAF50'))
    ax.text(5, y_pos + 0.15, 'WebSocket Connect', ha='center', fontsize=9, 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#C8E6C9'))
    y_pos -= 0.6
    
    # Connected confirmation
    ax.annotate('', xy=(client_x, y_pos), xytext=(server_x, y_pos),
                arrowprops=dict(arrowstyle='->', lw=2, color='#4CAF50'))
    ax.text(5, y_pos + 0.15, '{"type": "connected", "session_id": "..."}', 
            ha='center', fontsize=8, 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#C8E6C9'))
    y_pos -= 0.8
    
    # User message
    ax.annotate('', xy=(server_x, y_pos), xytext=(client_x, y_pos),
                arrowprops=dict(arrowstyle='->', lw=2, color='#2196F3'))
    ax.text(5, y_pos + 0.15, '{"type": "user_message", "content": "trim the intro"}', 
            ha='center', fontsize=8, 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#BBDEFB'))
    y_pos -= 0.6
    
    # Processing indicator
    ax.annotate('', xy=(client_x, y_pos), xytext=(server_x, y_pos),
                arrowprops=dict(arrowstyle='->', lw=2, color='#FF9800'))
    ax.text(5, y_pos + 0.15, '{"type": "typing", "status": "thinking"}', 
            ha='center', fontsize=8, 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#FFE0B2'))
    y_pos -= 0.6
    
    # Operation start
    ax.annotate('', xy=(client_x, y_pos), xytext=(server_x, y_pos),
                arrowprops=dict(arrowstyle='->', lw=2, color='#9C27B0'))
    ax.text(5, y_pos + 0.15, '{"type": "operation_start", "operation": "trim"}', 
            ha='center', fontsize=8, 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#E1BEE7'))
    y_pos -= 0.7
    
    # Streaming response chunks
    for i, chunk in enumerate(['Trimming', ' the intro', ' clip...'], 1):
        ax.annotate('', xy=(client_x, y_pos), xytext=(server_x, y_pos),
                    arrowprops=dict(arrowstyle='->', lw=1.5, color='#673AB7', alpha=0.7))
        ax.text(5, y_pos + 0.15, f'{{"type": "agent_chunk", "content": "{chunk}"}}', 
                ha='center', fontsize=7, 
                bbox=dict(boxstyle='round,pad=0.2', facecolor='#D1C4E9', alpha=0.7))
        y_pos -= 0.45
    
    y_pos -= 0.2
    
    # Operation complete
    ax.annotate('', xy=(client_x, y_pos), xytext=(server_x, y_pos),
                arrowprops=dict(arrowstyle='->', lw=2, color='#4CAF50'))
    ax.text(5, y_pos + 0.15, '{"type": "operation_complete", "success": true}', 
            ha='center', fontsize=8, 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#C8E6C9'))
    y_pos -= 0.6
    
    # State update
    ax.annotate('', xy=(client_x, y_pos), xytext=(server_x, y_pos),
                arrowprops=dict(arrowstyle='->', lw=2, color='#00BCD4'))
    ax.text(5, y_pos + 0.15, '{"type": "state_update", "timeline": {...}}', 
            ha='center', fontsize=8, 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#B2EBF2'))
    y_pos -= 0.6
    
    # Agent complete
    ax.annotate('', xy=(client_x, y_pos), xytext=(server_x, y_pos),
                arrowprops=dict(arrowstyle='->', lw=2, color='#8BC34A'))
    ax.text(5, y_pos + 0.15, '{"type": "agent_complete", "content": "..."}', 
            ha='center', fontsize=8, 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#DCEDC8'))
    y_pos -= 0.8
    
    # Undo request
    ax.annotate('', xy=(server_x, y_pos), xytext=(client_x, y_pos),
                arrowprops=dict(arrowstyle='->', lw=2, color='#F44336'))
    ax.text(5, y_pos + 0.15, '{"type": "undo", "content": "undo"}', 
            ha='center', fontsize=8, 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#FFCDD2'))
    y_pos -= 0.6
    
    # Undo result
    ax.annotate('', xy=(client_x, y_pos), xytext=(server_x, y_pos),
                arrowprops=dict(arrowstyle='->', lw=2, color='#F44336'))
    ax.text(5, y_pos + 0.15, '{"type": "operation_complete", "operation": "undo"}', 
            ha='center', fontsize=8, 
            bbox=dict(boxstyle='round,pad=0.3', facecolor='#FFCDD2'))
    
    # Legend
    ax.text(0.5, 0.8, 'Message Types:', fontweight='bold', fontsize=9)
    
    colors = {
        'User Messages': '#2196F3',
        'Agent Responses': '#673AB7',
        'Operations': '#9C27B0',
        'State Updates': '#00BCD4',
        'System': '#4CAF50',
        'Errors/Undo': '#F44336'
    }
    
    y_legend = 0.5
    for label, color in colors.items():
        ax.plot([0.6, 1.2], [y_legend, y_legend], color=color, linewidth=3)
        ax.text(1.4, y_legend, label, va='center', fontsize=7)
        y_legend -= 0.15
    
    plt.tight_layout()
    plt.savefig('websocket_communication_flow.png', dpi=300, bbox_inches='tight', 
                facecolor='white', edgecolor='none')
    print("✓ Saved: websocket_communication_flow.png")
    plt.close()


if __name__ == "__main__":
    print("Generating architecture diagrams...\n")
    
    create_system_architecture_diagram()
    create_conversation_flow_diagram()
    create_state_management_diagram()
    create_websocket_flow_diagram()
    
    print("\n✓ All diagrams generated successfully!")
    print("\nGenerated files:")
    print("  1. music_video_system_architecture.png")
    print("  2. conversation_flow_diagram.png")
    print("  3. state_management_layers.png")
    print("  4. websocket_communication_flow.png")
