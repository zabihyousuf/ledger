import {
  LayoutDashboard,
  Users,
  Contact,
  Handshake,
  FileText,
  BarChart3,
  Settings,
  Workflow,
  Bot,
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
      label: 'CRM',
      items: [
        { title: 'Leads', url: '/leads', icon: Users },
        { title: 'Contacts', url: '/contacts', icon: Contact },
        { title: 'Deals', url: '/deals', icon: Handshake },
      ],
    },
    {
      label: 'Automation',
      items: [
        { title: 'Flows', url: '/flows', icon: Workflow },
        { title: 'Agents', url: '/agents', icon: Bot },
      ],
    },
    {
      label: 'Reports',
      items: [
        { title: 'Analytics', url: '/analytics', icon: BarChart3 },
        { title: 'Documents', url: '/documents', icon: FileText },
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
