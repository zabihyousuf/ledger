import {
  LayoutDashboard,
  Users,
  Contact,
  Settings,
  Workflow,
  Bot,
  Radar,
  Activity,
  type LucideIcon,
} from 'lucide-vue-next'

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  badge?: string | number
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export function useCrmNavigation(): NavGroup[] {
  return [
    {
      label: 'Overview',
      items: [
        { title: 'Dashboard', url: '/', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Intelligence',
      items: [
        { title: 'Discovery', url: '/discovery', icon: Radar },
        { title: 'Agents', url: '/agents', icon: Bot },
        { title: 'Activity', url: '/activity', icon: Activity },
      ],
    },
    {
      label: 'CRM',
      items: [
        { title: 'Leads', url: '/leads', icon: Users },
        { title: 'Contacts', url: '/contacts', icon: Contact },
      ],
    },
    {
      label: 'Automation',
      items: [
        { title: 'Flows', url: '/flows', icon: Workflow },
      ],
    },
    {
      label: 'System',
      items: [
        { title: 'Settings', url: '/settings', icon: Settings },
      ],
    },
  ]
}
