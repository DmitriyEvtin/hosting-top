"use client";

import { UserRole } from "@/shared/lib/types";
import { Button } from "@/shared/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/Dialog";
import { Input } from "@/shared/ui/Input";
import { Label } from "@/shared/ui/Label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/Select";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

interface UserEditModalProps {
  user: User | null;
  open: boolean;
  onClose: () => void;
  onSave: (userData: {
    name: string;
    email: string;
    role: UserRole;
    password?: string;
  }) => Promise<void>;
  loading?: boolean;
}

export function UserEditModal({
  user,
  open,
  onClose,
  onSave,
  loading = false,
}: UserEditModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: UserRole.USER,
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        role: UserRole.USER,
        password: "",
      });
    }
    setErrors({});
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Имя обязательно";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email обязателен";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Некорректный email";
    }

    if (!user && !formData.password) {
      newErrors.password = "Пароль обязателен для нового пользователя";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Пароль должен содержать минимум 6 символов";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSave({
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        password: formData.password || undefined,
      });
      onClose();
    } catch (error) {
      console.error("Ошибка сохранения пользователя:", error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {user ? "Редактировать пользователя" : "Создать пользователя"}
          </DialogTitle>
          <DialogDescription>
            {user
              ? "Внесите изменения в данные пользователя"
              : "Заполните форму для создания нового пользователя"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={e => handleInputChange("name", e.target.value)}
              placeholder="Введите имя пользователя"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={e => handleInputChange("email", e.target.value)}
              placeholder="Введите email пользователя"
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Роль *</Label>
            <Select
              value={formData.role}
              onValueChange={value => handleInputChange("role", value)}
            >
              <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.USER}>Пользователь</SelectItem>
                <SelectItem value={UserRole.ADMIN}>Администратор</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-sm text-red-500">{errors.role}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Пароль {user ? "(оставьте пустым, чтобы не изменять)" : "*"}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={e => handleInputChange("password", e.target.value)}
              placeholder={
                user ? "Введите новый пароль (необязательно)" : "Введите пароль"
              }
              className={errors.password ? "border-red-500" : ""}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Сохранение..." : user ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
