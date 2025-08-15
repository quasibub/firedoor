import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Home {
  id: string;
  name: string;
  address?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

interface HomeContextType {
  selectedHome: Home | null;
  homes: Home[];
  loading: boolean;
  error: string | null;
  setSelectedHome: (home: Home | null) => void;
  fetchHomes: () => Promise<void>;
  refreshHomes: () => Promise<void>;
}

const HomeContext = createContext<HomeContextType | undefined>(undefined);

export const useHome = () => {
  const context = useContext(HomeContext);
  if (context === undefined) {
    throw new Error('useHome must be used within a HomeProvider');
  }
  return context;
};

interface HomeProviderProps {
  children: ReactNode;
}

export const HomeProvider: React.FC<HomeProviderProps> = ({ children }) => {
  const [selectedHome, setSelectedHome] = useState<Home | null>(null);
  const [homes, setHomes] = useState<Home[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHomes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/homes');
      if (!response.ok) {
        throw new Error('Failed to fetch homes');
      }
      
      const data = await response.json();
      if (data.success) {
        setHomes(data.data);
        
        // If no home is selected and we have homes, select the first one
        if (!selectedHome && data.data.length > 0) {
          setSelectedHome(data.data[0]);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch homes');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching homes:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshHomes = async () => {
    await fetchHomes();
  };

  useEffect(() => {
    fetchHomes();
  }, []);

  const value: HomeContextType = {
    selectedHome,
    homes,
    loading,
    error,
    setSelectedHome,
    fetchHomes,
    refreshHomes,
  };

  return (
    <HomeContext.Provider value={value}>
      {children}
    </HomeContext.Provider>
  );
}; 