"use client";

import { UserRole } from "@/shared/lib/types";
import { Button } from "@/shared/ui/Button";
import { ArrowLeft, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UserEditModal } from "../UserEditModal";
import { UsersFilters } from "../UsersFilters";
import { UsersPagination } from "../UsersPagination";
import { UsersTable } from "../UsersTable";
import { UserViewModal } from "../UserViewModal";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Фильтры и пагинация
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Модальные окна
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Загрузка пользователей
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(role && role !== "all" && { role }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data: UsersResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка загрузки пользователей");
      }

      setUsers(data.users);
      setTotalPages(data.pagination.pages);
      setTotalItems(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  // Обработчики фильтров
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // Сбрасываем на первую страницу при поиске
  };

  const handleRoleChange = (value: string) => {
    setRole(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch("");
    setRole("all");
    setPage(1);
  };

  // Обработчики пагинации
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  // Обработчики пользователей
  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsCreating(true);
    setEditModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsCreating(false);
    setEditModalOpen(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ошибка удаления пользователя");
      }

      // Обновляем список пользователей
      await fetchUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка удаления пользователя"
      );
    }
  };

  const handleSaveUser = async (userData: {
    name: string;
    email: string;
    role: UserRole;
    password?: string;
  }) => {
    try {
      if (isCreating) {
        // Создание нового пользователя
        const response = await fetch("/api/admin/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Ошибка создания пользователя");
        }
      } else if (selectedUser) {
        // Обновление существующего пользователя
        const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Ошибка обновления пользователя");
        }
      }

      // Обновляем список пользователей
      await fetchUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ошибка сохранения пользователя"
      );
      throw err; // Пробрасываем ошибку для отображения в модальном окне
    }
  };

  const handleRefresh = () => {
    fetchUsers();
  };

  // Загружаем пользователей при изменении параметров
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, search, role]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Управление пользователями
              </h1>
              <p className="mt-2 text-gray-600">
                Создание, редактирование и управление пользователями системы
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleCreateUser}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Создать пользователя
            </Button>
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              Обновить
            </Button>
          </div>
        </div>

        {/* Фильтры */}
        <div className="mb-6">
          <UsersFilters
            search={search}
            role={role}
            onSearchChange={handleSearchChange}
            onRoleChange={handleRoleChange}
            onClear={handleClearFilters}
          />
        </div>

        {/* Ошибка */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Таблица пользователей */}
        <div className="bg-white rounded-lg border">
          <UsersTable
            users={users}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onView={handleViewUser}
            loading={loading}
          />
        </div>

        {/* Пагинация */}
        {totalPages > 0 && (
          <div className="mt-6">
            <UsersPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          </div>
        )}

        {/* Модальные окна */}
        <UserEditModal
          user={selectedUser}
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveUser}
        />

        <UserViewModal
          user={selectedUser}
          open={viewModalOpen}
          onClose={() => setViewModalOpen(false)}
        />
      </div>
    </div>
  );
}
