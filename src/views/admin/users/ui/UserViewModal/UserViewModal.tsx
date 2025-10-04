"use client";

import { UserRole } from "@/shared/lib/types";
import { Badge } from "@/shared/ui/Badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/Dialog";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

interface UserViewModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
}

export function UserViewModal({ user, open, onClose }: UserViewModalProps) {
  if (!user) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRoleBadgeVariant = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return "destructive";
      case UserRole.USER:
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Информация о пользователе</DialogTitle>
          <DialogDescription>
            Подробная информация о пользователе
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Имя</label>
            <p className="text-sm font-medium">{user.name}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-sm font-medium">{user.email}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Роль</label>
            <div>
              <Badge variant={getRoleBadgeVariant(user.role)}>
                {user.role === UserRole.ADMIN
                  ? "Администратор"
                  : "Пользователь"}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              ID пользователя
            </label>
            <p className="text-sm font-mono text-gray-600">{user.id}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Дата создания
            </label>
            <p className="text-sm">{formatDate(user.createdAt)}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">
              Последнее обновление
            </label>
            <p className="text-sm">{formatDate(user.updatedAt)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
