'use client';

import { useUser } from '@/context/userContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  firstName: string;
  role: string;
}

export default function UserSelection() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const { setSelectedUser } = useUser();
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://localhost:8000/user', {
          headers: {
            'Cache-Control': 'no-store',
          },
        });
        const response = await res.json();
        setUsers(response);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleGoToPage = () => {
    const user = users.find((u) => u.id === selectedUserId);
    if (!user) return;

    setSelectedUser(user); // ✅ Save to context

    if (user.role === 'ADMIN') {
      router.push('/admin');
    } else if (user.role === 'USER') {
      router.push('/user');
    }
  };

  return (
    <div className="flex items-center gap-4">
      <select
        value={selectedUserId}
        onChange={(e) => setSelectedUserId(e.target.value)}
        className="p-2 border border-gray-800 rounded-lg"
      >
        <option value="" disabled>
          Select a user
        </option>
        {users.map((user) => (
          <option key={user.id} value={user.id} className="bg-gray-700">
            {user.firstName} ({user.role})
          </option>
        ))}
      </select>

      <button
        onClick={handleGoToPage}
        disabled={!selectedUserId}
        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        Go to page
      </button>
    </div>
  );
}
