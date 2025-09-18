import { Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { PostList } from '@/components/posts/PostList'
import { CommunityList } from '@/components/communities/CommunityList'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Posts Feed */}
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-white">
                    Neueste Beiträge
                  </h2>
                </div>
                <div className="card-body p-0">
                  <Suspense fallback={<LoadingSpinner />}>
                    <PostList />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <Sidebar />
              
              {/* Communities */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-white">
                    Beliebte Communities
                  </h3>
                </div>
                <div className="card-body p-0">
                  <Suspense fallback={<LoadingSpinner />}>
                    <CommunityList limit={5} />
                  </Suspense>
                </div>
              </div>

              {/* Network Info */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-white">
                    Netzwerk-Informationen
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Netzwerk:</span>
                      <span className="text-sm font-medium text-white">COMNet Hauptnetzwerk</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Status:</span>
                      <span className="badge badge-success">Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Föderation:</span>
                      <span className="badge badge-primary">Aktiv</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Benutzer:</span>
                      <span className="text-sm font-medium text-white">3</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Communities:</span>
                      <span className="text-sm font-medium text-white">3</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-white">
                    Schnellaktionen
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    <button className="btn btn-primary w-full">
                      Community erstellen
                    </button>
                    <button className="btn btn-secondary w-full">
                      Beitrag verfassen
                    </button>
                    <button className="btn btn-secondary w-full">
                      Netzwerk beitreten
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
