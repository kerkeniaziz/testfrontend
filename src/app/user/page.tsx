'use client';

import { useUser } from '@/context/userContext';
import { useQuery } from '@tanstack/react-query';

import { useState } from 'react';

interface Subpocket {
  id: string;
  title: string;
  visible: boolean;
  pocketId: string;
}

interface Pocket {
  id: string;
  name: string;
  description: string;
  subpockets: Subpocket[];
}

const fetchPockets = async (): Promise<Pocket[]> => {
  const res = await fetch('http://localhost:8000/pockets');
  if (!res.ok) throw new Error('Failed to fetch pockets');
  return res.json();
};

export default function UserPocketView() {
  const { selectedUser } = useUser();
  const { data: pockets, isLoading, isError } = useQuery({
    queryKey: ['pockets'],
    queryFn: fetchPockets,
    enabled: !!selectedUser,
  });

  const [notes, setNotes] = useState<Record<string, string>>({}); // key = subpocket.id

  if (!selectedUser) return <p>Please select a user.</p>;
  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Failed to load data</p>;

  return (
    <div className="space-y-6 p-4">
      {pockets?.map((pocket) => {

        return (
          <div key={pocket.id} className="border p-4 rounded-lg shadow-sm bg-white">
            <h2 className="text-xl font-semibold text-blue-600 mb-2">{pocket.name}</h2>
            <p className="text-gray-500 mb-4">{pocket.description}</p>

            <ul className="space-y-3">
              {pocket.subpockets.map((sub) => (
                <li key={sub.id} className="border-l-4 border-blue-400 pl-2">
                  <div className="font-medium mb-1">📂 {sub.title}</div>
                  <textarea
                    placeholder="Your private notes..."
                    value={notes[sub.id] || ''}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [sub.id]: e.target.value }))
                    }
                    className="w-full p-2 border rounded bg-gray-50"
                    rows={3}
                  />
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
