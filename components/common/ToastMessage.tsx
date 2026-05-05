"use client";

export default function ToastMessage({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[95] flex justify-center px-4 md:bottom-6">
      <div className="min-h-10 rounded-full px-5 py-2.5 text-sm font-semibold leading-5 pbp-toast">
        {message}
      </div>
    </div>
  );
}
