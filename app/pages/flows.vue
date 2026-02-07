<script setup lang="ts">
import {
  Zap,
  Cog,
  GitBranch,
  Clock,
  Mail,
  MessageSquare,
  Plus,
  Minus,
  Maximize2,
  Save,
  Filter,
  Webhook,
} from 'lucide-vue-next'

const nodeTypes = [
  { type: 'trigger', label: 'Trigger', description: 'Start a workflow', icon: Zap, color: 'bg-yellow-500' },
  { type: 'action', label: 'Action', description: 'Perform an action', icon: Cog, color: 'bg-blue-500' },
  { type: 'condition', label: 'Condition', description: 'Branch logic', icon: GitBranch, color: 'bg-purple-500' },
  { type: 'delay', label: 'Delay', description: 'Wait before next step', icon: Clock, color: 'bg-orange-500' },
  { type: 'email', label: 'Email', description: 'Send an email', icon: Mail, color: 'bg-green-500' },
  { type: 'sms', label: 'SMS', description: 'Send a text message', icon: MessageSquare, color: 'bg-pink-500' },
  { type: 'filter', label: 'Filter', description: 'Filter records', icon: Filter, color: 'bg-cyan-500' },
  { type: 'webhook', label: 'Webhook', description: 'Call external API', icon: Webhook, color: 'bg-red-500' },
]

interface CanvasNode {
  id: number
  type: string
  label: string
  icon: typeof Zap
  color: string
  x: number
  y: number
}

interface Connection {
  from: number
  to: number
  label?: string
}

const canvasNodes: CanvasNode[] = [
  { id: 1, type: 'trigger', label: 'New Lead Created', icon: Zap, color: 'bg-yellow-500', x: 300, y: 40 },
  { id: 2, type: 'delay', label: 'Wait 1 Hour', icon: Clock, color: 'bg-orange-500', x: 300, y: 180 },
  { id: 3, type: 'condition', label: 'Lead Score > 50?', icon: GitBranch, color: 'bg-purple-500', x: 300, y: 320 },
  { id: 4, type: 'email', label: 'Send Welcome Email', icon: Mail, color: 'bg-green-500', x: 80, y: 480 },
  { id: 5, type: 'action', label: 'Assign to Sales Rep', icon: Cog, color: 'bg-blue-500', x: 520, y: 480 },
  { id: 6, type: 'sms', label: 'Send SMS Follow-up', icon: MessageSquare, color: 'bg-pink-500', x: 80, y: 620 },
]

const connections: Connection[] = [
  { from: 1, to: 2 },
  { from: 2, to: 3 },
  { from: 3, to: 4, label: 'Yes' },
  { from: 3, to: 5, label: 'No' },
  { from: 4, to: 6 },
]

const zoom = ref(100)
const nodeWidth = 220
const nodeHeight = 72

function getNodePos(id: number) {
  const node = canvasNodes.find(n => n.id === id)
  if (!node) return { x: 0, y: 0 }
  return { x: node.x, y: node.y }
}

function computePath(conn: Connection): string {
  const from = getNodePos(conn.from)
  const to = getNodePos(conn.to)

  const fromNode = canvasNodes.find(n => n.id === conn.from)

  let startX = from.x + nodeWidth / 2
  const startY = from.y + nodeHeight

  // For condition nodes with labeled outputs, offset the start x
  if (fromNode?.type === 'condition' && conn.label) {
    if (conn.label === 'Yes') {
      startX = from.x + nodeWidth / 4
    } else if (conn.label === 'No') {
      startX = from.x + (nodeWidth * 3) / 4
    }
  }

  const endX = to.x + nodeWidth / 2
  const endY = to.y

  const midY = (startY + endY) / 2

  return `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`
}
</script>

<template>
  <div class="-m-4 md:-m-6 flex flex-col h-[calc(100vh-4rem)]">
    <!-- Toolbar -->
    <div class="flex items-center justify-between border-b border-border bg-card px-4 py-2 shrink-0">
      <div class="flex items-center gap-2">
        <h2 class="text-sm font-semibold">Lead Nurture Flow</h2>
        <Badge variant="secondary">Draft</Badge>
      </div>
      <div class="flex items-center gap-1">
        <div class="flex items-center rounded-md border border-border">
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7"
            @click="zoom = Math.max(50, zoom - 10)"
          >
            <Minus class="size-3" />
          </Button>
          <span class="w-12 text-center text-xs text-muted-foreground">{{ zoom }}%</span>
          <Button
            variant="ghost"
            size="icon"
            class="h-7 w-7"
            @click="zoom = Math.min(150, zoom + 10)"
          >
            <Plus class="size-3" />
          </Button>
        </div>
        <Button variant="ghost" size="icon" class="h-7 w-7">
          <Maximize2 class="size-4" />
        </Button>
        <Button size="sm">
          <Save class="size-4" />
          Save Flow
        </Button>
      </div>
    </div>

    <!-- Main area -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Node palette -->
      <div class="w-64 border-r border-border bg-card p-4 overflow-y-auto shrink-0">
        <h3 class="text-xs font-semibold uppercase text-muted-foreground mb-3 tracking-wider">
          Node Types
        </h3>
        <div class="space-y-2">
          <div
            v-for="nodeType in nodeTypes"
            :key="nodeType.type"
            class="flex items-center gap-3 rounded-lg border border-border p-3 cursor-grab hover:bg-muted/50 transition-colors"
          >
            <div :class="[nodeType.color, 'rounded-md p-1.5 text-white shrink-0']">
              <component :is="nodeType.icon" class="size-4" />
            </div>
            <div class="min-w-0">
              <p class="text-sm font-medium">{{ nodeType.label }}</p>
              <p class="text-xs text-muted-foreground">{{ nodeType.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Canvas -->
      <div class="flex-1 bg-muted/30 overflow-auto relative">
        <!-- Dot grid background -->
        <div
          class="absolute inset-0"
          style="background-image: radial-gradient(circle, hsl(0 0% 70% / 0.3) 1px, transparent 1px); background-size: 24px 24px;"
        />

        <div
          class="relative min-w-[900px] min-h-[800px] p-8"
          :style="{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }"
        >
          <!-- SVG connections layer -->
          <svg class="absolute inset-0 w-full h-full pointer-events-none" style="z-index: 1;">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" class="fill-muted-foreground/50" />
              </marker>
            </defs>
            <path
              v-for="conn in connections"
              :key="`${conn.from}-${conn.to}`"
              :d="computePath(conn)"
              fill="none"
              class="stroke-muted-foreground/40"
              stroke-width="2"
              marker-end="url(#arrowhead)"
            />
            <!-- Connection labels -->
            <template v-for="conn in connections" :key="`label-${conn.from}-${conn.to}`">
              <text
                v-if="conn.label"
                :x="(getNodePos(conn.from).x + getNodePos(conn.to).x + nodeWidth) / 2"
                :y="(getNodePos(conn.from).y + nodeHeight + getNodePos(conn.to).y) / 2"
                text-anchor="middle"
                class="fill-muted-foreground text-xs"
                font-size="11"
              >
                {{ conn.label }}
              </text>
            </template>
          </svg>

          <!-- Nodes layer -->
          <div
            v-for="node in canvasNodes"
            :key="node.id"
            class="absolute w-[220px] rounded-xl border border-border bg-card p-4 shadow-sm cursor-move hover:shadow-md transition-shadow"
            :style="{ left: `${node.x}px`, top: `${node.y}px`, zIndex: 2 }"
          >
            <!-- Input connection dot -->
            <div
              v-if="node.type !== 'trigger'"
              class="absolute -top-1.5 left-1/2 -translate-x-1/2 size-3 rounded-full border-2 border-border bg-card"
            />

            <!-- Node content -->
            <div class="flex items-center gap-3">
              <div :class="[node.color, 'rounded-md p-1.5 text-white shrink-0']">
                <component :is="node.icon" class="size-4" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium truncate">{{ node.label }}</p>
                <p class="text-xs text-muted-foreground capitalize">{{ node.type }}</p>
              </div>
            </div>

            <!-- Output connection dot(s) -->
            <template v-if="node.type === 'condition'">
              <div class="absolute -bottom-1.5 left-1/4 -translate-x-1/2 size-3 rounded-full border-2 border-green-500 bg-green-500" />
              <div class="absolute -bottom-1.5 left-3/4 -translate-x-1/2 size-3 rounded-full border-2 border-red-500 bg-red-500" />
            </template>
            <div
              v-else
              class="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-3 rounded-full border-2 border-primary bg-primary"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
