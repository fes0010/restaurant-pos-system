'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { UsersList } from '@/components/users/UsersList'
import { TourHelpButton } from '@/components/tour/TourHelpButton'

export default function UsersPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AppLayout>
        <div data-tour="users-container">
          <UsersList />
        </div>
        
        <TourHelpButton pageId="users" />
      </AppLayout>
    </ProtectedRoute>
  )
}
