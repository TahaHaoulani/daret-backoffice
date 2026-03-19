import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getReferenceDomains } from '../../api/referenceData';
import { useI18n } from '../../app/i18n/I18nContext';

export function ReferenceDataPage() {
  const { t } = useI18n();
  const { data: domains = [], isLoading } = useQuery({
    queryKey: ['reference-data', 'domains'],
    queryFn: () => getReferenceDomains(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="text-daret-muted">{t('common.loading')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-daret-fg">{t('nav.referenceData')}</h1>
        <p className="text-sm text-daret-muted mt-1">
          Manage list values used in the KYC journey and scoring (employment status, profession, countries, etc.).
        </p>
      </div>
      <div className="rounded-lg border border-daret-border bg-daret-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-daret-border bg-daret-dark/50">
              <th className="text-left py-3 px-4 font-medium text-daret-fg">Code</th>
              <th className="text-left py-3 px-4 font-medium text-daret-fg">Name</th>
              <th className="text-right py-3 px-4 font-medium text-daret-fg">Items</th>
              <th className="w-20" />
            </tr>
          </thead>
          <tbody>
            {domains.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-daret-muted">
                  No reference domains. Run the seed script: <code className="bg-daret-dark px-1 rounded">node prisma/scripts/seed-reference-data.js</code>
                </td>
              </tr>
            ) : (
              domains.map((d) => (
                <tr key={d.id} className="border-b border-daret-border/50 hover:bg-daret-dark/30">
                  <td className="py-3 px-4 font-mono text-daret-fg">{d.code}</td>
                  <td className="py-3 px-4 text-daret-fg">{d.name}</td>
                  <td className="py-3 px-4 text-right text-daret-muted">{d.itemCount}</td>
                  <td className="py-3 px-4">
                    <Link
                      to={`/settings/reference-data/${d.code}`}
                      className="text-daret-green hover:underline text-sm font-medium"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
