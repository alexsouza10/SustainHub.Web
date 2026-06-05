import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit2, Power, Search, Trash2, Key } from 'lucide-react'
import { useTenants, useCreateTenant, useAdminUsers, useCreateUser, useUpdateUserRole, useUpdateUserStatus, useUpdateTenant, useDeleteUser, useResetPassword } from '@/hooks/useAdmin'
import { MainLayout } from '@/components/layout/MainLayout'
import { cn } from '@/lib/utils'

export function Admin() {
  const [tab, setTab] = useState<'companies' | 'users'>('companies')
  const [searchTenants, setSearchTenants] = useState('')
  const [searchUsers, setSearchUsers] = useState('')
  const [selectedTenant, setSelectedTenant] = useState<string>()
  const [showTenantForm, setShowTenantForm] = useState(false)
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingTenant, setEditingTenant] = useState<{ id: string; name: string } | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null)

  const { data: tenants = [], isLoading: loadingTenants } = useTenants()
  const { data: users = [], isLoading: loadingUsers } = useAdminUsers(selectedTenant)

  const filteredTenants = tenants.filter(t => t.name.toLowerCase().includes(searchTenants.toLowerCase()))
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchUsers.toLowerCase()) ||
    u.email.toLowerCase().includes(searchUsers.toLowerCase())
  )

  return (
    <MainLayout title="Administration" subtitle="Manage companies, users, and roles">
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b overflow-x-auto">
        {(['companies', 'users'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 font-medium border-b-2 transition-colors capitalize whitespace-nowrap',
              tab === t
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t === 'companies' ? 'Companies' : 'Users'}
          </button>
        ))}
      </div>

      {/* Edit Tenant Modal */}
      {editingTenant && <EditTenantModal tenant={editingTenant} onClose={() => setEditingTenant(null)} />}

      {/* Delete User Confirmation */}
      {deletingUserId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Delete User</h3>
                <p className="text-sm text-muted-foreground mt-1">Are you sure? This action cannot be undone.</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setDeletingUserId(null)}>Cancel</Button>
                <DeleteUserButton userId={deletingUserId} onSuccess={() => setDeletingUserId(null)} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUserId && (
        <ResetPasswordModal userId={resetPasswordUserId} onClose={() => setResetPasswordUserId(null)} />
      )}

      {/* Companies Tab */}
      {tab === 'companies' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search companies..." className="pl-8" value={searchTenants}
                onChange={e => setSearchTenants(e.target.value)} />
            </div>
            <Button onClick={() => setShowTenantForm(!showTenantForm)} className="gap-2 shrink-0">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">New Company</span>
            </Button>
          </div>

          {showTenantForm && <TenantForm onClose={() => setShowTenantForm(false)} />}

          {loadingTenants ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {filteredTenants.map(tenant => (
                  <Card key={tenant.id}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{tenant.name}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-500">
                              {tenant.plan}
                            </Badge>
                            <span className={cn('text-[10px] font-medium', tenant.isActive ? 'text-green-500' : 'text-red-500')}>
                              {tenant.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{tenant.userCount} users</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(tenant.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="shrink-0 text-xs"
                          onClick={() => { setSelectedTenant(tenant.id); setTab('users') }}>
                          Users
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Name</th>
                      <th className="px-4 py-3 text-left font-medium">Plan</th>
                      <th className="px-4 py-3 text-left font-medium">Users</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Created</th>
                      <th className="px-4 py-3 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenants.map(tenant => (
                      <tr key={tenant.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{tenant.name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                            {tenant.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3">{tenant.userCount}</td>
                        <td className="px-4 py-3">
                          <span className={tenant.isActive ? 'text-green-500' : 'text-red-500'}>
                            {tenant.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right space-x-1">
                          <Button variant="ghost" size="sm"
                            onClick={() => setEditingTenant({ id: tenant.id, name: tenant.name })}>
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm"
                            onClick={() => { setSelectedTenant(tenant.id); setTab('users') }}>
                            Manage Users
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div className="space-y-4">
          {selectedTenant ? (
            <>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search users..." className="pl-8" value={searchUsers}
                    onChange={e => setSearchUsers(e.target.value)} />
                </div>
                <Button onClick={() => setShowUserForm(!showUserForm)} className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" /><span className="hidden sm:inline">New User</span>
                </Button>
              </div>

              {showUserForm && <UserForm tenantId={selectedTenant} onClose={() => setShowUserForm(false)} />}

              {loadingUsers ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />)}
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="md:hidden space-y-2">
                    {filteredUsers.map(user => (
                      <Card key={user.id}>
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{user.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={cn(
                                  'text-[10px] font-medium px-1.5 py-0.5 rounded',
                                  user.role === 'TenantAdmin' ? 'bg-purple-500/10 text-purple-500'
                                  : user.role === 'Manager' ? 'bg-orange-500/10 text-orange-500'
                                  : 'bg-blue-500/10 text-blue-500'
                                )}>
                                  {user.role}
                                </span>
                                <span className={cn('text-[10px] font-medium', user.isActive ? 'text-green-500' : 'text-red-500')}>
                                  {user.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <UserActions userId={user.id} currentRole={user.role} currentStatus={user.isActive}
                                onDelete={() => setDeletingUserId(user.id)}
                                onResetPassword={() => setResetPasswordUserId(user.id)} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Name</th>
                          <th className="px-4 py-3 text-left font-medium">Email</th>
                          <th className="px-4 py-3 text-left font-medium">Role</th>
                          <th className="px-4 py-3 text-left font-medium">Status</th>
                          <th className="px-4 py-3 text-right font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map(user => (
                          <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium">{user.name}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{user.email}</td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                'inline-flex items-center px-2 py-1 rounded text-xs font-medium',
                                user.role === 'TenantAdmin' ? 'bg-purple-500/10 text-purple-500'
                                : user.role === 'Manager' ? 'bg-orange-500/10 text-orange-500'
                                : 'bg-blue-500/10 text-blue-500'
                              )}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={user.isActive ? 'text-green-500' : 'text-red-500'}>
                                {user.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right space-x-1">
                              <UserActions userId={user.id} currentRole={user.role} currentStatus={user.isActive}
                                onDelete={() => setDeletingUserId(user.id)}
                                onResetPassword={() => setResetPasswordUserId(user.id)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground p-4">
              Go to Companies tab and select a company to manage its users.
            </p>
          )}
        </div>
      )}
    </MainLayout>
  )
}

function TenantForm({ onClose }: { onClose: () => void }) {
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: '', plan: 'Free' } })
  const createTenant = useCreateTenant()

  const onSubmit = async (data: any) => {
    await createTenant.mutateAsync(data)
    reset(); onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 bg-muted/30 rounded-lg space-y-3 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Input placeholder="Company name" {...register('name', { required: true })} />
        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register('plan')}>
          <option value="Free">Free</option>
          <option value="Pro">Pro</option>
          <option value="Enterprise">Enterprise</option>
        </select>
        <div className="flex gap-2">
          <Button type="submit" disabled={createTenant.isPending} className="flex-1">
            {createTenant.isPending ? 'Creating...' : 'Create'}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </form>
  )
}

function UserForm({ tenantId, onClose }: { tenantId: string; onClose: () => void }) {
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: '', email: '', password: '', role: 'Developer' } })
  const createUser = useCreateUser()

  const onSubmit = async (data: any) => {
    await createUser.mutateAsync({ ...data, tenantId })
    reset(); onClose()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 bg-muted/30 rounded-lg space-y-3 mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input placeholder="Full name" {...register('name', { required: true })} />
        <Input type="email" placeholder="Email" {...register('email', { required: true })} />
        <Input type="password" placeholder="Password" {...register('password', { required: true })} />
        <select className="rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" {...register('role')}>
          <option value="Developer">Developer</option>
          <option value="Manager">Manager</option>
          <option value="TenantAdmin">Tenant Admin</option>
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={createUser.isPending}>
          {createUser.isPending ? 'Creating...' : 'Create User'}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  )
}

function UserActions({ userId, currentRole, currentStatus, onDelete, onResetPassword }: { userId: string; currentRole: string; currentStatus: boolean; onDelete?: () => void; onResetPassword?: () => void }) {
  const updateRole   = useUpdateUserRole()
  const updateStatus = useUpdateUserStatus()
  const roles = ['Developer', 'Manager', 'TenantAdmin']
  const nextRole = roles[(roles.indexOf(currentRole) + 1) % roles.length]

  return (
    <>
      <Button variant="ghost" size="sm" title="Change role"
        onClick={() => updateRole.mutate({ id: userId, role: nextRole })}>
        <Edit2 className="h-3 w-3" />
      </Button>
      <Button variant="ghost" size="sm" title={currentStatus ? 'Deactivate' : 'Activate'}
        onClick={() => updateStatus.mutate({ id: userId, isActive: !currentStatus })}>
        <Power className="h-3 w-3" />
      </Button>
      {onResetPassword && (
        <Button variant="ghost" size="sm" title="Reset password" onClick={onResetPassword}>
          <Key className="h-3 w-3" />
        </Button>
      )}
      {onDelete && (
        <Button variant="ghost" size="sm" title="Delete user" onClick={onDelete} className="text-destructive hover:text-destructive">
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </>
  )
}

function EditTenantModal({ tenant, onClose }: { tenant: { id: string; name: string }; onClose: () => void }) {
  const { register, handleSubmit, reset } = useForm({ defaultValues: { name: tenant.name } })
  const updateTenant = useUpdateTenant()

  const onSubmit = async (data: any) => {
    await updateTenant.mutateAsync({ id: tenant.id, name: data.name })
    reset(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Edit Organization Name</h3>
              <Input {...register('name', { required: true })} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={updateTenant.isPending}>
                {updateTenant.isPending ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function DeleteUserButton({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const deleteUser = useDeleteUser()

  const handleDelete = async () => {
    await deleteUser.mutateAsync(userId)
    onSuccess()
  }

  return (
    <Button variant="destructive" size="sm" disabled={deleteUser.isPending} onClick={handleDelete}>
      {deleteUser.isPending ? 'Deleting...' : 'Delete'}
    </Button>
  )
}

function ResetPasswordModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { register, handleSubmit, reset } = useForm({ defaultValues: { password: '' } })
  const resetPassword = useResetPassword()

  const onSubmit = async (data: any) => {
    await resetPassword.mutateAsync({ id: userId, password: data.password })
    reset(); onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">Reset Password</h3>
              <Input type="password" placeholder="New password" {...register('password', { required: true })} />
              <p className="text-xs text-muted-foreground mt-1">Enter a new password for this user.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={resetPassword.isPending}>
                {resetPassword.isPending ? 'Resetting...' : 'Reset'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
