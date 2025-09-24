"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Users, Shield, User, UserCheck, UserX, Crown } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserManagementProps {
  users: any[]
}

export function UserManagement({ users }: UserManagementProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const router = useRouter()
  const supabase = createClient()

  const filteredUsers = users.filter((user) => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false
    if (statusFilter === "active" && !user.is_active) return false
    if (statusFilter === "inactive" && user.is_active) return false
    return true
  })

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: "default",
      manager: "secondary",
      user: "outline",
    } as const

    const icons = {
      admin: <Crown className="h-3 w-3 mr-1" />,
      manager: <Shield className="h-3 w-3 mr-1" />,
      user: <User className="h-3 w-3 mr-1" />,
    }

    return (
      <Badge variant={variants[role as keyof typeof variants] || "outline"} className="text-xs">
        {icons[role as keyof typeof icons]}
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
        {isActive ? (
          <>
            <UserCheck className="h-3 w-3 mr-1" />
            Active
          </>
        ) : (
          <>
            <UserX className="h-3 w-3 mr-1" />
            Inactive
          </>
        )}
      </Badge>
    )
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoading(userId)
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq("user_id", userId)

      if (error) throw error

      // Log admin action
      await supabase.from("admin_logs").insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        target_user_id: userId,
        action: "role_change",
        details: { new_role: newRole },
      })

      router.refresh()
    } catch (error) {
      console.error("Error updating user role:", error)
      alert("Failed to update user role")
    } finally {
      setLoading(null)
    }
  }

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    setLoading(userId)
    try {
      const newStatus = !currentStatus
      const { error } = await supabase
        .from("user_profiles")
        .update({ is_active: newStatus, updated_at: new Date().toISOString() })
        .eq("user_id", userId)

      if (error) throw error

      // Log admin action
      await supabase.from("admin_logs").insert({
        admin_user_id: (await supabase.auth.getUser()).data.user?.id,
        target_user_id: userId,
        action: newStatus ? "user_activated" : "user_deactivated",
        details: { previous_status: currentStatus },
      })

      router.refresh()
    } catch (error) {
      console.error("Error updating user status:", error)
      alert("Failed to update user status")
    } finally {
      setLoading(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2 text-foreground">
              <Users className="h-5 w-5" />
              <span>User Management</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage user roles and permissions ({filteredUsers.length} of {users.length} users)
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-foreground">Role:</label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-foreground">Status:</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground">User</TableHead>
              <TableHead className="text-muted-foreground">Role</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
              <TableHead className="text-muted-foreground">Resources</TableHead>
              <TableHead className="text-muted-foreground">Joined</TableHead>
              <TableHead className="text-muted-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <div className="font-medium text-foreground">{user.full_name || "Unnamed User"}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                <TableCell>
                  <div className="text-sm text-muted-foreground">
                    <div>{user.phone_numbers?.[0]?.count || 0} numbers</div>
                    <div>{user.cadences?.[0]?.count || 0} cadences</div>
                    <div>{user.calls?.[0]?.count || 0} calls</div>
                  </div>
                </TableCell>
                <TableCell className="text-foreground">{formatDate(user.created_at)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading === user.user_id}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRoleChange(user.user_id, "admin")}>
                        <Crown className="h-4 w-4 mr-2" />
                        Make Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRoleChange(user.user_id, "manager")}>
                        <Shield className="h-4 w-4 mr-2" />
                        Make Manager
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRoleChange(user.user_id, "user")}>
                        <User className="h-4 w-4 mr-2" />
                        Make User
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusToggle(user.user_id, user.is_active)}>
                        {user.is_active ? (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No users match the current filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
