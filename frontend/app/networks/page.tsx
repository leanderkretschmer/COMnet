'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GlobeAltIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface Network {
  id: string;
  name: string;
  display_name: string;
  description: string;
  domain: string;
  is_public: boolean;
  is_federated: boolean;
  member_count: number;
  created_at: string;
}

export default function NetworksPage() {
  const { user } = useAuth();
  const [networks, setNetworks] = useState<Network[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const response = await fetch('/api/networks');
        if (response.ok) {
          const data = await response.json();
          setNetworks(data.networks || []);
        }
      } catch (error) {
        console.error('Fehler beim Laden der Netzwerke:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNetworks();
  }, []);

  const filteredNetworks = networks.filter(network =>
    network.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    network.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Netzwerke</h1>
              <p className="text-gray-400 mt-2">
                Entdecke andere COMNet-Instanzen und verbinde dich mit der dezentralen Community
              </p>
            </div>
            {user && (
              <button className="btn btn-primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                Netzwerk beitreten
              </button>
            )}
          </div>

          {/* Search */}
          <div className="max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Netzwerke durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full pl-10"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {filteredNetworks.length === 0 ? (
                <div className="card">
                  <div className="card-body text-center py-12">
                    <GlobeAltIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Keine Netzwerke gefunden
                    </h3>
                    <p className="text-gray-400">
                      {searchTerm ? 'Keine Netzwerke entsprechen deiner Suche.' : 'Noch keine anderen Netzwerke verfügbar.'}
                    </p>
                  </div>
                </div>
              ) : (
                filteredNetworks.map((network) => (
                  <div key={network.id} className="card hover:shadow-lg transition-shadow duration-200">
                    <div className="card-body">
                      <div className="flex items-start space-x-4">
                        {/* Network Icon */}
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-olive-500 flex items-center justify-center">
                            <GlobeAltIcon className="h-6 w-6 text-white" />
                          </div>
                        </div>

                        {/* Network Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {network.display_name}
                            </h3>
                            {network.is_public && (
                              <span className="badge badge-success">Öffentlich</span>
                            )}
                            {network.is_federated && (
                              <span className="badge badge-primary">Föderiert</span>
                            )}
                          </div>
                          
                          <p className="text-gray-300 text-sm mb-3">
                            {network.description}
                          </p>

                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>Domain: {network.domain}</span>
                            <span>•</span>
                            <span>{network.member_count} Mitglieder</span>
                            <span>•</span>
                            <span>Seit {new Date(network.created_at).toLocaleDateString('de-DE')}</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0">
                          <button className="btn btn-primary btn-sm">
                            Beitreten
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Info Card */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-white">
                    Über Netzwerke
                  </h3>
                </div>
                <div className="card-body">
                  <p className="text-gray-300 text-sm mb-4">
                    COMNet ist dezentral aufgebaut. Jeder kann sein eigenes Netzwerk (COM) hosten 
                    und trotzdem mit anderen vernetzt bleiben.
                  </p>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-olive-500 rounded-full"></div>
                      <span>Dezentrale Architektur</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-olive-500 rounded-full"></div>
                      <span>Föderation zwischen Netzwerken</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-olive-500 rounded-full"></div>
                      <span>Eigene Datenkontrolle</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Network */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-white">
                    Aktuelles Netzwerk
                  </h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-300">Name:</span>
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
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              {user && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-white">
                      Schnellaktionen
                    </h3>
                  </div>
                  <div className="card-body">
                    <div className="space-y-3">
                      <button className="btn btn-primary w-full">
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Netzwerk beitreten
                      </button>
                      <button className="btn btn-secondary w-full">
                        Eigenes Netzwerk hosten
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
