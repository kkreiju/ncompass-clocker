import { redirect } from 'next/navigation'

export default function AdminPage() {
  // Redirect to main login page for authentication
  redirect('/?redirect=/admin/dashboard')
}