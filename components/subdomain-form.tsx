'use client';

import { useActionState } from 'react';
import { createSubdomainAction } from '@/app/actions';
import { useState } from 'react';

export function SubdomainForm() {
  const [state, formAction, isPending] = useActionState(createSubdomainAction, null);
  const [emoji, setEmoji] = useState('🚀');

  return (
    <form action={formAction} className="space-y-6 bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Portfolio</h2>
        <p className="text-gray-600">Choose a subdomain and emoji for your portfolio site</p>
      </div>

      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
          Display Name
        </label>
        <input
          type="text"
          id="displayName"
          name="displayName"
          defaultValue={state?.displayName || ''}
          placeholder="Your Name"
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="subdomain" className="block text-sm font-medium text-gray-700 mb-2">
          Subdomain
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            id="subdomain"
            name="subdomain"
            defaultValue={state?.subdomain || ''}
            placeholder="yourname"
            required
            pattern="[a-z0-9-]+"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-gray-500">.{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'}</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">Only lowercase letters, numbers, and hyphens</p>
      </div>

      <div>
        <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-2">
          Emoji Icon
        </label>
        <div className="flex items-center gap-3">
          <div className="text-5xl">{emoji}</div>
          <input
            type="text"
            id="icon"
            name="icon"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="🚀"
            maxLength={10}
            required
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">Maximum 10 characters</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? 'Creating...' : 'Create Portfolio'}
      </button>
    </form>
  );
}

