<script setup lang="ts">
import {
  Zap, Cog, GitBranch, Clock, Mail, MessageSquare,
  Plus, Minus, Maximize2, Save, Filter, Webhook,
  Trash2, ChevronLeft, Play, X, Pencil, Check,
  MousePointer2,
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'
import type { Flow } from '~/composables/useFlows'

const route = useRoute()
const router = useRouter()
const flowId = route.params.id as string

const {
  fetchFlow, updateFlow,
  fetchNodes, fetchConnections,
  saveFlowData,
} = useFlows()

// ── Node palette definitions ──
const nodeTypes = [
  { type: 'trigger', label: 'Trigger', description: 'Start a workflow', icon: Zap, color: 'bg-yellow-500', borderColor: 'border-yellow-500' },
  { type: 'action', label: 'Action', description: 'Perform an action', icon: Cog, color: 'bg-blue-500', borderColor: 'border-blue-500' },
  { type: 'condition', label: 'Condition', description: 'Branch logic', icon: GitBranch, color: 'bg-purple-500', borderColor: 'border-purple-500' },
  { type: 'delay', label: 'Delay', description: 'Wait before next step', icon: Clock, color: 'bg-orange-500', borderColor: 'border-orange-500' },
  { type: 'email', label: 'Email', description: 'Send an email', icon: Mail, color: 'bg-green-500', borderColor: 'border-green-500' },
  { type: 'sms', label: 'SMS', description: 'Send a text message', icon: MessageSquare, color: 'bg-pink-500', borderColor: 'border-pink-500' },
  { type: 'filter', label: 'Filter', description: 'Filter records', icon: Filter, color: 'bg-cyan-500', borderColor: 'border-cyan-500' },
  { type: 'webhook', label: 'Webhook', description: 'Call external API', icon: Webhook, color: 'bg-red-500', borderColor: 'border-red-500' },
]

const iconMap: Record<string, any> = {
  trigger: Zap, action: Cog, condition: GitBranch, delay: Clock,
  email: Mail, sms: MessageSquare, filter: Filter, webhook: Webhook,
}
const colorMap: Record<string, string> = {
  trigger: 'bg-yellow-500', action: 'bg-blue-500', condition: 'bg-purple-500',
  delay: 'bg-orange-500', email: 'bg-green-500', sms: 'bg-pink-500',
  filter: 'bg-cyan-500', webhook: 'bg-red-500',
}

// ── Interfaces ──
interface FlowNode {
  id: number
  dbId?: string
  type: string
  label: string
  x: number
  y: number
  config?: Record<string, any>
}

interface Connection {
  id: string
  from: number
  to: number
  fromPort?: string // 'default' | 'yes' | 'no'
  label?: string
}

// ── State ──
const flow = ref<Flow | null>(null)
const nodes = ref<FlowNode[]>([])
const connections = ref<Connection[]>([])
const zoom = ref(100)
const selectedNodeId = ref<number | null>(null)
const hoveredNodeId = ref<number | null>(null)
const nextId = ref(1)
const saving = ref(false)
const hasUnsavedChanges = ref(false)
const flowLoaded = ref(false)

// ── Edit flow name inline ──
const editingName = ref(false)
const editNameValue = ref('')

function startEditName() {
  editNameValue.value = flow.value?.name || ''
  editingName.value = true
}

async function saveName() {
  if (!flow.value || !editNameValue.value.trim()) return
  try {
    await updateFlow(flow.value.id, { name: editNameValue.value.trim() })
    flow.value = { ...flow.value, name: editNameValue.value.trim() }
    editingName.value = false
    toast.success('Flow renamed', {
      description: `Flow is now "${editNameValue.value.trim()}".`,
    })
  } catch (error) {
    toast.error('Failed to rename flow')
  }
}

// ── Canvas constants ──
const nodeWidth = 220
const nodeHeight = 72

// ── Canvas refs ──
const canvasContainerRef = ref<HTMLElement | null>(null)
const canvasRef = ref<HTMLElement | null>(null)

// ── Pan state ──
const panOffset = ref({ x: 0, y: 0 })
const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0 })

// ── Load flow data ──
onMounted(async () => {
  const f = await fetchFlow(flowId)
  if (!f) {
    router.push('/flows')
    return
  }
  flow.value = f

  // Load nodes
  const dbNodes = await fetchNodes(flowId)
  const dbConns = await fetchConnections(flowId)

  // Map DB nodes to local nodes
  const dbIdToLocal = new Map<string, number>()
  for (const dn of dbNodes) {
    const localId = nextId.value++
    dbIdToLocal.set(dn.id, localId)
    nodes.value.push({
      id: localId,
      dbId: dn.id,
      type: dn.node_type,
      label: dn.label,
      x: dn.position_x,
      y: dn.position_y,
      config: typeof dn.config === 'object' && dn.config !== null ? dn.config as Record<string, any> : {},
    })
  }

  // Map DB connections
  for (const dc of dbConns) {
    const fromLocal = dbIdToLocal.get(dc.from_node_id)
    const toLocal = dbIdToLocal.get(dc.to_node_id)
    if (fromLocal !== undefined && toLocal !== undefined) {
      connections.value.push({
        id: dc.id,
        from: fromLocal,
        to: toLocal,
        label: dc.label || undefined,
        fromPort: dc.label === 'Yes' ? 'yes' : dc.label === 'No' ? 'no' : 'default',
      })
    }
  }

  flowLoaded.value = true

  // Center the canvas initially
  nextTick(() => {
    if (nodes.value.length > 0) {
      const minX = Math.min(...nodes.value.map(n => n.x))
      const minY = Math.min(...nodes.value.map(n => n.y))
      panOffset.value = { x: -minX + 60, y: -minY + 40 }
    } else {
      panOffset.value = { x: 0, y: 0 }
    }
  })

  window.addEventListener('keydown', onKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('mousemove', onNodeDragMove)
  window.removeEventListener('mouseup', onNodeDragEnd)
  window.removeEventListener('mousemove', onPanMove)
  window.removeEventListener('mouseup', onPanEnd)
  window.removeEventListener('mousemove', onDrawingMove)
  window.removeEventListener('mouseup', onDrawingEnd)
})

// ── Mark changes ──
function markDirty() {
  hasUnsavedChanges.value = true
}

// ── SAVE ──
async function handleSave() {
  if (!flow.value) return
  saving.value = true

  // Build index: local id -> array index
  const nodesData = nodes.value.map((n, i) => ({
    node_type: n.type,
    label: n.label,
    config: n.config || {},
    position_x: n.x,
    position_y: n.y,
  }))

  const localIdToIndex = new Map<number, number>()
  nodes.value.forEach((n, i) => localIdToIndex.set(n.id, i))

  const connectionsData = connections.value
    .filter(c => localIdToIndex.has(c.from) && localIdToIndex.has(c.to))
    .map(c => ({
      from_local_id: localIdToIndex.get(c.from)!,
      to_local_id: localIdToIndex.get(c.to)!,
      label: c.label || null,
    }))

  try {
    await saveFlowData(flow.value.id, nodesData, connectionsData, new Map())
    hasUnsavedChanges.value = false
    toast.success('Flow saved', {
      description: `"${flow.value.name}" has been saved with ${nodes.value.length} nodes.`,
    })
  } catch (error) {
    toast.error('Failed to save flow')
  }
  saving.value = false
}

// ═══════════════════════════════════════════
// NODE DRAGGING
// ═══════════════════════════════════════════
const draggingNode = ref(false)
const dragNodeId = ref<number | null>(null)
const dragOffset = ref({ x: 0, y: 0 })

function onNodeMouseDown(e: MouseEvent, nodeId: number) {
  if ((e.target as HTMLElement)?.closest('.port-dot') || (e.target as HTMLElement)?.closest('.node-delete-btn')) return
  e.preventDefault()
  e.stopPropagation()

  const node = nodes.value.find(n => n.id === nodeId)
  if (!node) return

  selectedNodeId.value = nodeId
  draggingNode.value = true
  dragNodeId.value = nodeId

  const scale = zoom.value / 100
  dragOffset.value = {
    x: e.clientX / scale - (node.x + panOffset.value.x),
    y: e.clientY / scale - (node.y + panOffset.value.y),
  }

  window.addEventListener('mousemove', onNodeDragMove)
  window.addEventListener('mouseup', onNodeDragEnd)
}

function onNodeDragMove(e: MouseEvent) {
  if (!draggingNode.value || dragNodeId.value === null) return

  const scale = zoom.value / 100
  const newX = e.clientX / scale - dragOffset.value.x - panOffset.value.x
  const newY = e.clientY / scale - dragOffset.value.y - panOffset.value.y

  const idx = nodes.value.findIndex(n => n.id === dragNodeId.value)
  if (idx !== -1) {
    const node = nodes.value[idx]!
    nodes.value[idx] = {
      id: node.id,
      dbId: node.dbId,
      type: node.type,
      label: node.label,
      x: Math.round(newX),
      y: Math.round(newY),
      config: node.config,
    }
    markDirty()
  }
}

function onNodeDragEnd() {
  draggingNode.value = false
  dragNodeId.value = null
  window.removeEventListener('mousemove', onNodeDragMove)
  window.removeEventListener('mouseup', onNodeDragEnd)
}

// ═══════════════════════════════════════════
// CANVAS PAN
// ═══════════════════════════════════════════
function onCanvasMouseDown(e: MouseEvent) {
  // Only pan on direct canvas click (not on nodes)
  if (e.button !== 0) return
  isPanning.value = true
  panStart.value = { x: e.clientX - panOffset.value.x, y: e.clientY - panOffset.value.y }

  selectedNodeId.value = null // deselect
  if (drawingConnection.value) {
    // Cancel connection drawing
    drawingConnection.value = false
    drawingFrom.value = null
    drawingFromPort.value = 'default'
    drawingMousePos.value = { x: 0, y: 0 }
  }

  window.addEventListener('mousemove', onPanMove)
  window.addEventListener('mouseup', onPanEnd)
}

function onPanMove(e: MouseEvent) {
  if (!isPanning.value) return
  panOffset.value = {
    x: e.clientX - panStart.value.x,
    y: e.clientY - panStart.value.y,
  }
}

function onPanEnd() {
  isPanning.value = false
  window.removeEventListener('mousemove', onPanMove)
  window.removeEventListener('mouseup', onPanEnd)
}

// ── Zoom with scroll wheel ──
function onWheel(e: WheelEvent) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -5 : 5
  zoom.value = Math.max(30, Math.min(200, zoom.value + delta))
}

// ═══════════════════════════════════════════
// CONNECTION DRAWING
// ═══════════════════════════════════════════
const drawingConnection = ref(false)
const drawingFrom = ref<number | null>(null)
const drawingFromPort = ref<string>('default')
const drawingMousePos = ref({ x: 0, y: 0 })

function onPortMouseDown(e: MouseEvent, nodeId: number, port: string = 'default') {
  e.preventDefault()
  e.stopPropagation()

  drawingConnection.value = true
  drawingFrom.value = nodeId
  drawingFromPort.value = port

  updateDrawingPos(e)
  window.addEventListener('mousemove', onDrawingMove)
  window.addEventListener('mouseup', onDrawingEnd)
}

function updateDrawingPos(e: MouseEvent) {
  const container = canvasContainerRef.value
  if (!container) return
  const rect = container.getBoundingClientRect()
  const scale = zoom.value / 100
  drawingMousePos.value = {
    x: (e.clientX - rect.left) / scale - panOffset.value.x,
    y: (e.clientY - rect.top) / scale - panOffset.value.y,
  }
}

function onDrawingMove(e: MouseEvent) {
  if (!drawingConnection.value) return
  updateDrawingPos(e)
}

function onDrawingEnd(e: MouseEvent) {
  window.removeEventListener('mousemove', onDrawingMove)
  window.removeEventListener('mouseup', onDrawingEnd)

  if (!drawingConnection.value || drawingFrom.value === null) {
    drawingConnection.value = false
    return
  }

  // Check if we dropped on a node's input port
  const container = canvasContainerRef.value
  if (container) {
    const rect = container.getBoundingClientRect()
    const scale = zoom.value / 100
    const mouseX = (e.clientX - rect.left) / scale - panOffset.value.x
    const mouseY = (e.clientY - rect.top) / scale - panOffset.value.y

    // Find the target node (check if mouse is near the top center of any node)
    for (const node of nodes.value) {
      if (node.id === drawingFrom.value) continue
      if (node.type === 'trigger') continue // Can't connect TO a trigger

      const inputX = node.x + nodeWidth / 2
      const inputY = node.y
      const dist = Math.sqrt((mouseX - inputX) ** 2 + (mouseY - inputY) ** 2)

      if (dist < 30) {
        // Check for duplicates
        const exists = connections.value.some(
          c => c.from === drawingFrom.value && c.to === node.id && c.fromPort === drawingFromPort.value
        )
        if (!exists) {
          const label = drawingFromPort.value === 'yes' ? 'Yes' : drawingFromPort.value === 'no' ? 'No' : undefined
          connections.value.push({
            id: `local-${Date.now()}-${Math.random()}`,
            from: drawingFrom.value!,
            to: node.id,
            fromPort: drawingFromPort.value,
            label,
          })
          markDirty()
        }
        break
      }
    }
  }

  drawingConnection.value = false
  drawingFrom.value = null
  drawingFromPort.value = 'default'
}

// Get the output port position for a node
function getOutputPos(nodeId: number, port: string = 'default') {
  const node = nodes.value.find(n => n.id === nodeId)
  if (!node) return { x: 0, y: 0 }

  let x = node.x + nodeWidth / 2
  const y = node.y + nodeHeight

  if (node.type === 'condition') {
    if (port === 'yes') x = node.x + nodeWidth / 4
    else if (port === 'no') x = node.x + (nodeWidth * 3) / 4
  }

  return { x, y }
}

function getInputPos(nodeId: number) {
  const node = nodes.value.find(n => n.id === nodeId)
  if (!node) return { x: 0, y: 0 }
  return { x: node.x + nodeWidth / 2, y: node.y }
}

// ── Drawing path (for in-progress connection) ──
const drawingPath = computed(() => {
  if (!drawingConnection.value || drawingFrom.value === null) return ''
  const start = getOutputPos(drawingFrom.value, drawingFromPort.value)
  const end = drawingMousePos.value
  const midY = (start.y + end.y) / 2
  return `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`
})

// ═══════════════════════════════════════════
// SVG PATH COMPUTATION
// ═══════════════════════════════════════════
function computePath(conn: Connection): string {
  const start = getOutputPos(conn.from, conn.fromPort || 'default')
  const end = getInputPos(conn.to)
  if (start.x === 0 && start.y === 0) return ''
  const midY = (start.y + end.y) / 2
  return `M ${start.x} ${start.y} C ${start.x} ${midY}, ${end.x} ${midY}, ${end.x} ${end.y}`
}

function connMidpoint(conn: Connection) {
  const start = getOutputPos(conn.from, conn.fromPort || 'default')
  const end = getInputPos(conn.to)
  return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }
}

// ═══════════════════════════════════════════
// NODE OPERATIONS
// ═══════════════════════════════════════════

// Delete node
function deleteNode(nodeId: number) {
  nodes.value = nodes.value.filter(n => n.id !== nodeId)
  connections.value = connections.value.filter(c => c.from !== nodeId && c.to !== nodeId)
  if (selectedNodeId.value === nodeId) selectedNodeId.value = null
  markDirty()
}

// Delete connection
function removeConnection(connId: string) {
  connections.value = connections.value.filter(c => c.id !== connId)
  markDirty()
}

// ── Palette drag & drop ──
function onPaletteDragStart(e: DragEvent, nodeType: typeof nodeTypes[number]) {
  if (!e.dataTransfer) return
  e.dataTransfer.setData('application/json', JSON.stringify({ type: nodeType.type, label: nodeType.label }))
  e.dataTransfer.effectAllowed = 'copy'
}

function onCanvasDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
}

function onCanvasDrop(e: DragEvent) {
  e.preventDefault()
  if (!e.dataTransfer) return
  const raw = e.dataTransfer.getData('application/json')
  if (!raw) return

  const data = JSON.parse(raw) as { type: string; label: string }
  const container = canvasContainerRef.value
  if (!container) return

  const rect = container.getBoundingClientRect()
  const scale = zoom.value / 100
  const x = Math.round((e.clientX - rect.left) / scale - panOffset.value.x - nodeWidth / 2)
  const y = Math.round((e.clientY - rect.top) / scale - panOffset.value.y - nodeHeight / 2)

  const newNode: FlowNode = {
    id: nextId.value++,
    type: data.type,
    label: data.label,
    x, y,
    config: {},
  }

  nodes.value = [...nodes.value, newNode]
  selectedNodeId.value = newNode.id
  markDirty()
}

// ── Edit node label ──
const editingNodeId = ref<number | null>(null)
const editNodeLabel = ref('')

function startEditLabel(nodeId: number) {
  const node = nodes.value.find(n => n.id === nodeId)
  if (!node) return
  editingNodeId.value = nodeId
  editNodeLabel.value = node.label
}

function saveNodeLabel() {
  if (editingNodeId.value === null) return
  const idx = nodes.value.findIndex(n => n.id === editingNodeId.value)
  if (idx !== -1 && editNodeLabel.value.trim()) {
    const node = nodes.value[idx]!
    nodes.value[idx] = { ...node, label: editNodeLabel.value.trim() }
    markDirty()
  }
  editingNodeId.value = null
}

// ── Keyboard ──
function onKeyDown(e: KeyboardEvent) {
  if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId.value !== null) {
    deleteNode(selectedNodeId.value)
  }
  if (e.key === 'Escape') {
    selectedNodeId.value = null
    editingNodeId.value = null
    if (drawingConnection.value) {
      drawingConnection.value = false
      drawingFrom.value = null
    }
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    handleSave()
  }
}

// ── Activate flow ──
async function handleActivate() {
  if (!flow.value) return
  try {
    const f = await updateFlow(flow.value.id, { status: 'active' })
    if (f) {
      flow.value = f
      toast.success('Flow activated', {
        description: `"${f.name}" is now active.`,
      })
    }
  } catch (error) {
    toast.error('Failed to activate flow')
  }
}

// ── Fit to view ──
function fitToView() {
  if (nodes.value.length === 0) {
    panOffset.value = { x: 0, y: 0 }
    zoom.value = 100
    return
  }
  const container = canvasContainerRef.value
  if (!container) return

  const minX = Math.min(...nodes.value.map(n => n.x))
  const maxX = Math.max(...nodes.value.map(n => n.x + nodeWidth))
  const minY = Math.min(...nodes.value.map(n => n.y))
  const maxY = Math.max(...nodes.value.map(n => n.y + nodeHeight))

  const contentW = maxX - minX + 120
  const contentH = maxY - minY + 120

  const containerW = container.clientWidth
  const containerH = container.clientHeight

  const scaleX = containerW / contentW
  const scaleY = containerH / contentH
  const newScale = Math.min(scaleX, scaleY, 1.2) * 100

  zoom.value = Math.round(Math.max(30, Math.min(200, newScale)))

  const scale = zoom.value / 100
  panOffset.value = {
    x: (containerW / scale - contentW) / 2 - minX + 60,
    y: (containerH / scale - contentH) / 2 - minY + 60,
  }
}
</script>

<template>
  <div class="-m-4 md:-m-6 flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
    <!-- Toolbar -->
    <div class="flex items-center justify-between border-b border-border bg-card px-4 py-2 shrink-0 z-20">
      <div class="flex items-center gap-3">
        <NuxtLink to="/flows" class="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft class="size-5" />
        </NuxtLink>

        <!-- Editable flow name -->
        <div v-if="editingName" class="flex items-center gap-1">
          <Input
            v-model="editNameValue"
            class="h-7 w-48 text-sm"
            @keydown.enter="saveName"
            @keydown.escape="editingName = false"
          />
          <Button variant="ghost" size="icon" class="h-7 w-7" @click="saveName">
            <Check class="size-3" />
          </Button>
          <Button variant="ghost" size="icon" class="h-7 w-7" @click="editingName = false">
            <X class="size-3" />
          </Button>
        </div>
        <div v-else class="flex items-center gap-2 cursor-pointer group" @click="startEditName">
          <h2 class="text-sm font-semibold">{{ flow?.name || 'Loading...' }}</h2>
          <Pencil class="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <Badge v-if="flow" :variant="flow.status === 'active' ? 'default' : 'secondary'" class="capitalize">
          {{ flow.status }}
        </Badge>
        <Badge v-if="hasUnsavedChanges" variant="outline" class="text-xs">Unsaved</Badge>
      </div>

      <div class="flex items-center gap-2">
        <!-- Zoom controls -->
        <div class="flex items-center rounded-md border border-border">
          <Button variant="ghost" size="icon" class="h-7 w-7" @click="zoom = Math.max(30, zoom - 10)">
            <Minus class="size-3" />
          </Button>
          <span class="w-12 text-center text-xs text-muted-foreground">{{ zoom }}%</span>
          <Button variant="ghost" size="icon" class="h-7 w-7" @click="zoom = Math.min(200, zoom + 10)">
            <Plus class="size-3" />
          </Button>
        </div>
        <Button variant="ghost" size="icon" class="h-7 w-7" title="Fit to view" @click="fitToView">
          <Maximize2 class="size-4" />
        </Button>

        <div class="w-px h-5 bg-border" />

        <Button variant="outline" size="sm" :disabled="flow?.status === 'active'" @click="handleActivate">
          <Play class="size-4 mr-1" />
          Activate
        </Button>
        <Button size="sm" :disabled="saving || !hasUnsavedChanges" @click="handleSave">
          <Save class="size-4 mr-1" />
          {{ saving ? 'Saving...' : 'Save' }}
        </Button>
      </div>
    </div>

    <!-- Main area -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Node palette -->
      <div class="w-56 border-r border-border bg-card p-3 overflow-y-auto shrink-0 z-10">
        <h3 class="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wider">Nodes</h3>
        <p class="text-[11px] text-muted-foreground mb-3">Drag onto canvas</p>
        <div class="space-y-1.5">
          <div
            v-for="nodeType in nodeTypes"
            :key="nodeType.type"
            draggable="true"
            class="flex items-center gap-2.5 rounded-lg border border-border p-2.5 cursor-grab active:cursor-grabbing hover:bg-muted/50 transition-colors select-none"
            @dragstart="(e) => onPaletteDragStart(e, nodeType)"
          >
            <div :class="[nodeType.color, 'rounded-md p-1 text-white shrink-0']">
              <component :is="nodeType.icon" class="size-3.5" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-medium leading-tight">{{ nodeType.label }}</p>
              <p class="text-[10px] text-muted-foreground leading-tight">{{ nodeType.description }}</p>
            </div>
          </div>
        </div>

        <!-- Help section -->
        <div class="mt-6 pt-4 border-t border-border">
          <h3 class="text-xs font-semibold uppercase text-muted-foreground mb-2 tracking-wider">Controls</h3>
          <div class="space-y-1.5 text-[11px] text-muted-foreground">
            <p><kbd class="px-1 rounded bg-muted text-[10px]">Click + Drag</kbd> Pan canvas</p>
            <p><kbd class="px-1 rounded bg-muted text-[10px]">Scroll</kbd> Zoom in/out</p>
            <p><kbd class="px-1 rounded bg-muted text-[10px]">Del</kbd> Delete node</p>
            <p><kbd class="px-1 rounded bg-muted text-[10px]">Cmd+S</kbd> Save flow</p>
            <p>Drag from <span class="text-primary font-medium">output dots</span> to connect</p>
          </div>
        </div>
      </div>

      <!-- Canvas area -->
      <div
        ref="canvasContainerRef"
        class="flex-1 relative overflow-hidden bg-muted/30"
        :class="[
          isPanning ? 'cursor-grabbing' : drawingConnection ? 'cursor-crosshair' : 'cursor-grab',
        ]"
        @mousedown.self="onCanvasMouseDown"
        @wheel.prevent="onWheel"
        @dragover="onCanvasDragOver"
        @drop="onCanvasDrop"
      >
        <!-- Dot grid background (moves with pan) -->
        <div
          class="absolute inset-0 pointer-events-none"
          :style="{
            backgroundImage: 'radial-gradient(circle, hsl(0 0% 70% / 0.2) 1px, transparent 1px)',
            backgroundSize: `${24 * zoom / 100}px ${24 * zoom / 100}px`,
            backgroundPosition: `${panOffset.x * zoom / 100}px ${panOffset.y * zoom / 100}px`,
          }"
        />

        <!-- Empty state -->
        <div
          v-if="flowLoaded && nodes.length === 0 && !drawingConnection"
          class="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
        >
          <div class="text-center">
            <MousePointer2 class="size-10 text-muted-foreground/40 mx-auto mb-3" />
            <p class="text-sm font-medium text-muted-foreground/60">Drag nodes from the palette to get started</p>
            <p class="text-xs text-muted-foreground/40 mt-1">Connect them by dragging from output to input dots</p>
          </div>
        </div>

        <!-- Transform container (zoom + pan) -->
        <div
          ref="canvasRef"
          class="absolute"
          :style="{
            transform: `scale(${zoom / 100})`,
            transformOrigin: '0 0',
            left: `${panOffset.x * zoom / 100}px`,
            top: `${panOffset.y * zoom / 100}px`,
          }"
          @mousedown.self="onCanvasMouseDown"
        >
          <!-- SVG Layer -->
          <svg
            class="absolute pointer-events-none overflow-visible"
            style="z-index: 1; left: 0; top: 0; width: 1px; height: 1px;"
          >
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" class="fill-muted-foreground/50" />
              </marker>
              <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" class="fill-primary" />
              </marker>
            </defs>

            <!-- Existing connections -->
            <g v-for="conn in connections" :key="conn.id" class="connection-group">
              <!-- Invisible wide path for click target -->
              <path
                :d="computePath(conn)"
                fill="none"
                stroke="transparent"
                stroke-width="16"
                class="pointer-events-auto cursor-pointer"
                @click.stop="removeConnection(conn.id)"
              />
              <!-- Visible path -->
              <path
                :d="computePath(conn)"
                fill="none"
                class="stroke-muted-foreground/40"
                stroke-width="2"
                marker-end="url(#arrowhead)"
              />
              <!-- Connection label -->
              <g v-if="conn.label">
                <rect
                  :x="connMidpoint(conn).x - 16"
                  :y="connMidpoint(conn).y - 9"
                  width="32" height="18" rx="4"
                  class="fill-background stroke-border"
                  stroke-width="1"
                />
                <text
                  :x="connMidpoint(conn).x"
                  :y="connMidpoint(conn).y + 4"
                  text-anchor="middle"
                  class="fill-muted-foreground"
                  font-size="11"
                  font-weight="500"
                >
                  {{ conn.label }}
                </text>
              </g>
              <!-- Delete indicator on hover path -->
              <circle
                :cx="connMidpoint(conn).x + (conn.label ? 22 : 0)"
                :cy="connMidpoint(conn).y"
                r="7"
                class="fill-destructive pointer-events-auto cursor-pointer conn-delete-dot"
                @click.stop="removeConnection(conn.id)"
              />
              <text
                :x="connMidpoint(conn).x + (conn.label ? 22 : 0)"
                :y="connMidpoint(conn).y + 3.5"
                text-anchor="middle"
                fill="white"
                font-size="9"
                font-weight="bold"
                class="pointer-events-none conn-delete-label"
              >
                ×
              </text>
            </g>

            <!-- Drawing connection (in-progress) -->
            <path
              v-if="drawingConnection && drawingPath"
              :d="drawingPath"
              fill="none"
              class="stroke-primary"
              stroke-width="2"
              stroke-dasharray="6 3"
              marker-end="url(#arrowhead-active)"
            />
          </svg>

          <!-- Nodes Layer -->
          <div
            v-for="node in nodes"
            :key="node.id"
            :class="[
              'absolute w-[220px] rounded-xl border bg-card shadow-sm select-none group',
              selectedNodeId === node.id
                ? 'border-primary ring-2 ring-primary/20 shadow-md z-10'
                : 'border-border hover:shadow-md z-[2]',
              draggingNode && dragNodeId === node.id ? 'cursor-grabbing opacity-80' : 'cursor-grab',
            ]"
            :style="{ left: `${node.x}px`, top: `${node.y}px` }"
            @mousedown="(e) => onNodeMouseDown(e, node.id)"
            @click.stop="selectedNodeId = node.id"
            @mouseenter="hoveredNodeId = node.id"
            @mouseleave="hoveredNodeId = null"
            @dblclick.stop="startEditLabel(node.id)"
          >
            <!-- Delete button (on hover) -->
            <button
              v-show="hoveredNodeId === node.id && editingNodeId !== node.id"
              class="node-delete-btn absolute -top-2.5 -right-2.5 z-20 size-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-sm hover:bg-destructive/90 transition-colors"
              @click.stop="deleteNode(node.id)"
              @mousedown.stop
            >
              <X class="size-3" />
            </button>

            <!-- Input port (top center) -->
            <div
              v-if="node.type !== 'trigger'"
              class="port-dot absolute -top-2 left-1/2 -translate-x-1/2 size-4 rounded-full border-2 border-border bg-card hover:border-primary hover:bg-primary/20 transition-colors cursor-crosshair z-10"
            />

            <!-- Content -->
            <div class="p-3.5">
              <div class="flex items-center gap-2.5">
                <div :class="[colorMap[node.type] || 'bg-gray-500', 'rounded-lg p-1.5 text-white shrink-0']">
                  <component :is="iconMap[node.type] || Cog" class="size-4" />
                </div>
                <div class="flex-1 min-w-0">
                  <!-- Inline edit -->
                  <div v-if="editingNodeId === node.id" class="flex items-center gap-1" @mousedown.stop>
                    <input
                      v-model="editNodeLabel"
                      class="text-sm font-medium bg-transparent border-b border-primary outline-none w-full"
                      @keydown.enter="saveNodeLabel"
                      @keydown.escape="editingNodeId = null"
                      @blur="saveNodeLabel"
                    />
                  </div>
                  <template v-else>
                    <p class="text-sm font-medium truncate leading-tight">{{ node.label }}</p>
                    <p class="text-[11px] text-muted-foreground capitalize leading-tight">{{ node.type }}</p>
                  </template>
                </div>
              </div>
            </div>

            <!-- Output ports -->
            <template v-if="node.type === 'condition'">
              <!-- Yes port -->
              <div
                class="port-dot absolute -bottom-2 left-1/4 -translate-x-1/2 size-4 rounded-full border-2 border-green-500 bg-green-500 hover:scale-125 transition-transform cursor-crosshair z-10"
                title="Yes"
                @mousedown="(e) => onPortMouseDown(e, node.id, 'yes')"
              />
              <!-- No port -->
              <div
                class="port-dot absolute -bottom-2 left-3/4 -translate-x-1/2 size-4 rounded-full border-2 border-red-500 bg-red-500 hover:scale-125 transition-transform cursor-crosshair z-10"
                title="No"
                @mousedown="(e) => onPortMouseDown(e, node.id, 'no')"
              />
            </template>
            <div
              v-else
              class="port-dot absolute -bottom-2 left-1/2 -translate-x-1/2 size-4 rounded-full border-2 border-primary bg-primary hover:scale-125 transition-transform cursor-crosshair z-10"
              @mousedown="(e) => onPortMouseDown(e, node.id, 'default')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.conn-delete-dot {
  opacity: 0;
  transition: opacity 150ms;
}
.conn-delete-label {
  opacity: 0;
  transition: opacity 150ms;
}
.connection-group:hover .conn-delete-dot,
.connection-group:hover .conn-delete-label {
  opacity: 1;
}
</style>
