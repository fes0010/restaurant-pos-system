'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { UsersList } from '@/components/users/UsersList'

export default function UsersPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AppLayout>
        <UsersList />
      </AppLayout>
    </ProtectedRoute>
  )
}
