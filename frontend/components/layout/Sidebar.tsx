'use client'

import Link from 'next/link'
import { 
  HomeIcon, 
  UserGroupIcon, 
  GlobeAltIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

export function Sidebar() {
  const navigation = [
    { name: 'Startseite', href: '/', icon: HomeIcon },
    { name: 'Communities', href: '/communities', icon: UserGroupIcon },
    { name: 'Netzwerke', href: '/networks', icon: GlobeAltIcon },
    { name: 'Statistiken', href: '/stats', icon: ChartBarIcon },
    { name: 'Einstellungen', href: '/settings', icon: Cog6ToothIcon },
    { name: 'Über', href: '/about', icon: InformationCircleIcon },
  ]

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-semibold text-gray-900">
          Navigation
        </h3>
      </div>
      <div className="card-body p-0">
        <nav className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="group flex items-center px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
            >
              <item.icon
                className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500"
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
