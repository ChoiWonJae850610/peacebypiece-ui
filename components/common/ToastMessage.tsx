"use client";

export default function ToastMessage({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[95] flex justify-center px-4 md:bottom-6">
      <div className="rounded-full px-4 py-2 text-sm font-medium pbp-toast">
        {message}
      </div>
    </div>
  );
}
