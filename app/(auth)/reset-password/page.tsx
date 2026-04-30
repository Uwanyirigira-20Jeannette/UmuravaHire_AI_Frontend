'use client';

import { Suspense } from 'react';
import ResetPasswordForm from './form';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}


