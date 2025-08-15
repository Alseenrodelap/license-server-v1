import { useEffect, useState } from 'react';
import { useI18n } from '../i18n';
import { PageHeader, StatsCard, Table, ChartBarIcon, CreditCardIcon, UserGroupIcon } from '../components/ui';
import { BanknotesIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const { t } = useI18n();
  
  useEffect(() => {
    (async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}/dashboard`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setData(await res.json());
    })();
  }, []);
  
  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-pulse text-zinc-500">{t('common.loading')}</div>
    </div>
  );
  
  const euro = (cents: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format((cents || 0) / 100);
  
  return (
    <div className="space-y-8">
      <PageHeader 
        title="Dashboard" 
        subtitle="Overzicht van uw licentiestatistieken en inkomsten"
      />
      
      {/* License Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title={t('dash.active')} 
          value={data.active} 
          icon={ChartBarIcon}
          color="green"
        />
        <StatsCard 
          title={t('dash.inactive')} 
          value={data.inactive} 
          icon={UserGroupIcon}
          color="orange"
        />
        <StatsCard 
          title={t('dash.expired')} 
          value={data.expired} 
          icon={CalendarDaysIcon}
          color="purple"
        />
        <StatsCard 
          title={t('dash.total')} 
          value={data.total} 
          icon={CreditCardIcon}
          color="blue"
        />
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title={t('dash.monthlyRevenue')} 
          value={euro(data.monthlyRevenueCents)} 
          icon={BanknotesIcon}
          color="green"
        />
        <StatsCard 
          title={t('dash.yearlyRevenue')} 
          value={euro(data.yearlyRevenueCents)} 
          icon={BanknotesIcon}
          color="blue"
        />
        <StatsCard 
          title={t('dash.oneTimeThisYear')} 
          value={euro(data.oneTimeRevenueThisYearCents)} 
          icon={BanknotesIcon}
          color="purple"
        />
        <StatsCard 
          title="Totale inkomsten jaar" 
          value={euro(data.totalYearRevenueCents)} 
          icon={BanknotesIcon}
          color="orange"
        />
      </div>

      {/* Recent API Activity */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{t('dash.recentApi')}</h2>
        <Table>
          <thead>
            <tr>
              <th>{t('licenses.code')}</th>
              <th>{t('licenses.customerName')}</th>
              <th>{t('licenses.priceInterval')}</th>
              <th>{t('licenses.lastApiAccessAt')}</th>
            </tr>
          </thead>
          <tbody>
            {(data.recentApi || []).map((l: any) => (
              <tr key={l.id}>
                <td className="font-mono text-sm">{l.code}</td>
                <td>{l.customerName}</td>
                <td>
                  <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                    l.priceInterval === 'MONTHLY' ? 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-300' :
                    l.priceInterval === 'YEARLY' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300' :
                    'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300'
                  }`}>
                    {l.priceInterval}
                  </span>
                </td>
                <td className="text-zinc-500 dark:text-zinc-400">
                  {l.lastApiAccessAt ? new Date(l.lastApiAccessAt).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
