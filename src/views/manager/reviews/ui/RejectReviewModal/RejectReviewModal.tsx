"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/Dialog";
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Textarea";

interface RejectReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isSubmitting?: boolean;
}

export function RejectReviewModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}: RejectReviewModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // Сброс формы при закрытии модального окна
  useEffect(() => {
    if (!isOpen) {
      setReason("");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError("Причина отклонения обязательна");
      return;
    }

    onConfirm(reason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отклонить отзыв</DialogTitle>
          <DialogDescription>
            Укажите причину отклонения отзыва. Пользователь получит
            уведомление с указанной причиной.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Причина отклонения *
            </label>
            <Textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError("");
              }}
              placeholder="Укажите причину отклонения отзыва..."
              rows={4}
              variant={error ? "error" : "default"}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Отклонение..." : "Отклонить отзыв"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

