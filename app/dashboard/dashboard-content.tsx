'use client';

import { useActionState } from 'react';
import { deleteSubdomainAction } from '@/app/actions';
import Link from 'next/link';
import { protocol, rootDomain } from '@/lib/utils';

type Tenant = {
  subdomain: string;
  emoji: string;
  displayName: string;
  createdAt: number;
};

export function DashboardContent({
  tenants,
  userEmail,
}: {
  tenants: Tenant[];
  userEmail: string;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Sites</h3>
        {tenants.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No portfolios yet. Create your first one!
          </p>
        ) : (
          <div className="space-y-3">
            {tenants.map((tenant) => (
              <TenantCard key={tenant.subdomain} tenant={tenant} />
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Quick Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Your portfolio will be available at yourname.{rootDomain}</li>
          <li>• You can customize your portfolio content after creation</li>
          <li>• Choose an emoji that represents you or your brand</li>
        </ul>
      </div>
    </div>
  );
}

function TenantCard({ tenant }: { tenant: Tenant }) {
  const [state, formAction, isPending] = useActionState(deleteSubdomainAction, null);
  const url = `${protocol}://${tenant.subdomain}.${rootDomain}`;

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
      <div className="flex items-center gap-3">
        <div className="text-3xl">{tenant.emoji}</div>
        <div>
          <Link
            href={url}
            target="_blank"
            className="font-medium text-blue-600 hover:text-blue-700"
          >
            {tenant.subdomain}.{rootDomain}
          </Link>
          <p className="text-sm text-gray-500">{tenant.displayName}</p>
        </div>
      </div>
      <form action={formAction}>
        <input type="hidden" name="subdomain" value={tenant.subdomain} />
        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
        >
          {isPending ? 'Deleting...' : 'Delete'}
        </button>
      </form>
    </div>
  );
}

