'use client';

import { useUser } from '@/context/userContext';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import SubPocketItem from './subPocketItem';
import { Pocket } from '@/types';


async function fetchPockets(selectedUser: any): Promise<Pocket[]> {
  const res = await fetch('http://localhost:8000/pockets/user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify({ selectedUser }),
  });

  if (!res.ok) throw new Error('Failed to fetch pockets');
  
  return res.json();
}

export default function PocketListUser() {
  const { selectedUser } = useUser() ;
  const [openPocketId, setOpenPocketId] = useState<string | null>(null);

  const { data: pockets, isLoading, isError } = useQuery({
    queryKey: ['pockets', selectedUser],
    queryFn: () => fetchPockets(selectedUser),
    enabled: !!selectedUser, // wait for selectedUser to be selected - it will not work until the user is selected
  });

  if (!selectedUser) return <p>Please select a user.</p>;
  if (isLoading) return <p>Loading...</p>;
  if (isError) return <p>Failed to load data.</p>;

  return (
    <div className="space-y-6 p-4">
      {pockets && pockets.length > 0 ? (
      pockets?.map((pocket) => {
        const isOpen = openPocketId === pocket.id;

        return (
          <div key={pocket.id} className="border p-4 rounded-lg shadow-sm bg-white">
            <h2
              className="text-xl font-semibold text-blue-600 mb-2 cursor-pointer"
              onClick={() => setOpenPocketId(isOpen ? null : pocket.id)}
            >
              {pocket.name}
            </h2>
            <p className="text-gray-500 mb-4">{pocket.description}</p>

            {isOpen && (
              <ul className="space-y-3">
                {pocket.subPockets?.length === 0 ? (
                  <li className="italic text-gray-400">No subpockets</li>
                ) : (
                    pocket.subPockets.map((sub) => (
                        <SubPocketItem key={sub.id} sub={sub} />
                  ))
                )}
              </ul>
            )}
          </div>
        );
      })
    ) : (
  <p className="text-gray-400 italic">No pockets found.</p>
)}
    </div>
  );
}
