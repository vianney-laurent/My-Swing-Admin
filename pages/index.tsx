import Head from 'next/head';
import type { GetServerSideProps } from 'next';
import { requireAdminSession } from '../lib/auth';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { AnalyticsChart } from '../components/analytics/AnalyticsChart';
import {
  ArrowRightIcon,
  ChartBarIcon,
  UsersIcon,
  VideoCameraIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import {
  subDays,
  format,
  eachDayOfInterval,
  isSameDay,
  parseISO,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'next/router';

type MessageStats = {
  total: number;
  active: number;
  targeted: number;
  upcoming: number;
  lastMessageTitle: string | null;
  lastMessageUpdatedAt: string | null;
  generatedAt: string;
};

type MetricData = {
  current: number;
  previous: number | null;
  delta: number;
  deltaPercentage: number | null;
};

type RateMetricData = {
  optedIn: number;
  total: number;
  rate: number;
};

type DashboardMetrics = {
  generatedAt: string;
  totalUsers: MetricData;
  weeklySignups: MetricData;
  analyses: MetricData;
  waitlist: MetricData;
  consent: {
    marketing: RateMetricData;
    improvement: RateMetricData;
  };
  userGrowthData: { name: string; value: number }[];
  analysisActivityData: { name: string; value: number }[];
  waitlistGrowthData: { name: string; value: number }[];
};

type HomeProps = {
  messageStats: MessageStats;
  dashboardMetrics: DashboardMetrics;
  selectedPeriod: string;
};

const PERIODS = [
  { value: '7d', label: '7j' },
  { value: '30d', label: '30j' },
  { value: 'month', label: 'Mois' },
  { value: 'last_month', label: 'M-1' },
];

const numberFormatter = new Intl.NumberFormat('fr-FR');
const percentFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const formatTrend = (metric: MetricData, comparisonLabel: string) => {
  const { delta, deltaPercentage, previous } = metric;

  if (previous === null) {
    return { text: `— ${comparisonLabel}`, variant: 'neutral' as const };
  }

  const variant = delta === 0 ? 'neutral' : delta > 0 ? 'positive' : 'negative';

  if (deltaPercentage !== null && Number.isFinite(deltaPercentage)) {
    const absValue = Math.abs(deltaPercentage);
    const formatted = `${percentFormatter.format(absValue)} %`;
    const prefix = delta > 0 ? '+' : delta < 0 ? '-' : '';
    return {
      text: `${prefix}${formatted} ${comparisonLabel}`,
      variant,
    };
  }

  const absDelta = Math.abs(delta);
  const prefix = delta > 0 ? '+' : delta < 0 ? '-' : '';
  return {
    text: `${prefix}${numberFormatter.format(absDelta)} ${comparisonLabel}`,
    variant,
  };
};

const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

export default function Home({ messageStats, dashboardMetrics, selectedPeriod }: HomeProps) {
  const router = useRouter();
  const generatedAt = new Date(messageStats.generatedAt);

  const handlePeriodChange = (newPeriod: string) => {
    router.push({
      pathname: router.pathname,
      query: { ...router.query, period: newPeriod },
    });
  };
  const metricsGeneratedAt = new Date(dashboardMetrics.generatedAt);

  const messageMetrics = [
    { label: 'Messages actifs', value: messageStats.active },
    { label: 'Messages totaux', value: messageStats.total },
    { label: 'Campagnes ciblées', value: messageStats.targeted },
    { label: 'Débuts à venir', value: messageStats.upcoming },
  ];

  const metricCards = [
    {
      label: 'Utilisateurs totaux',
      value: numberFormatter.format(dashboardMetrics.totalUsers.current),
      trend: formatTrend(dashboardMetrics.totalUsers, 'vs période préc.'),
    },
    {
      label: 'Nouveaux comptes',
      value: numberFormatter.format(dashboardMetrics.weeklySignups.current),
      trend: formatTrend(dashboardMetrics.weeklySignups, 'vs période préc.'),
    },
    {
      label: 'Analyses effectuées',
      value: numberFormatter.format(dashboardMetrics.analyses.current),
      trend: formatTrend(dashboardMetrics.analyses, 'vs période préc.'),
    },
    {
      label: 'Inscriptions waitlist',
      value: numberFormatter.format(dashboardMetrics.waitlist.current),
      trend: formatTrend(dashboardMetrics.waitlist, 'vs période préc.'),
    },
  ];

  const consentCards = [
    {
      label: 'Opt-in marketing',
      description: 'Communications marketing',
      metric: dashboardMetrics.consent.marketing,
      variant: 'marketing' as const,
    },
    {
      label: 'Opt-in amélioration produit',
      description: 'Partage pour améliorer My Swing',
      metric: dashboardMetrics.consent.improvement,
      variant: 'improvement' as const,
    },
  ];

  return (
    <>
      <Head>
        <title>Admin - Tableau de bord</title>
        <meta
          name="description"
          content="Aperçu rapide des métriques clés My Swing."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AppShell
        title="Tableau de bord"
        description="Visualisez les indicateurs clés actualisés pour piloter My Swing."
        actions={
          <div className="ms-segmented-control">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePeriodChange(p.value)}
                className={`ms-segmented-control__item ${selectedPeriod === p.value ? 'ms-segmented-control__item--active' : ''
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      >
        <div className="ms-dashboard-grid">
          {/* Key Metrics Section */}
          <section className="ms-dashboard-section">
            <h2 className="ms-section-title">Performance</h2>
            <div className="ms-metric-grid">
              {metricCards.map((metric) => (
                <Card key={metric.label} className="ms-metric-card-wrapper">
                  <div className="ms-metric-card">
                    <span className="ms-metric-card__label">{metric.label}</span>
                    <div className="ms-metric-card__content">
                      <span className="ms-metric-card__value">{metric.value}</span>
                      <span className={`ms-trend ms-trend--${metric.trend.variant}`}>
                        {metric.trend.text}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Analytics Section */}
          <section className="ms-dashboard-section">
            <h2 className="ms-section-title">Activité</h2>
            <div className="ms-dashboard-grid ms-dashboard-grid--two">
              <AnalyticsChart
                title="Nouveaux Utilisateurs"
                description="Évolution des inscriptions sur la période"
                data={dashboardMetrics.userGrowthData}
                type="area"
                color="var(--ms-color-primary)"
              />
              <AnalyticsChart
                title="Vidéos Analysées"
                description="Nombre de vidéos traitées par jour"
                data={dashboardMetrics.analysisActivityData}
                type="bar"
                color="var(--ms-color-secondary)"
              />
            </div>
            <div className="ms-dashboard-grid ms-dashboard-grid--two" style={{ marginTop: '1.5rem' }}>
              <AnalyticsChart
                title="Inscriptions Waitlist"
                description="Évolution de la waitlist sur la période"
                data={dashboardMetrics.waitlistGrowthData}
                type="area"
                color="#F59E0B" // Amber-500
              />
            </div>
          </section>

          <div className="ms-dashboard-split">
            {/* Consent Section */}
            <section className="ms-dashboard-section">
              <h2 className="ms-section-title">Consentements</h2>
              <Card>
                <div className="ms-consent-grid">
                  {consentCards.map((card) => {
                    const rateValue = percentFormatter.format(card.metric.rate);
                    const clampedRate = Math.max(0, Math.min(card.metric.rate, 100));
                    return (
                      <div
                        key={card.label}
                        className={`ms-consent-item ms-consent-item--${card.variant}`}
                      >
                        <div className="ms-consent-item__header">
                          <div className="ms-consent-item__titles">
                            <span className="ms-consent-item__label">{card.label}</span>
                            <p className="ms-consent-item__description">{card.description}</p>
                          </div>
                          <span className="ms-consent-item__rate">{rateValue} %</span>
                        </div>
                        <div className="ms-progress">
                          <div className="ms-progress__track">
                            <div
                              className="ms-progress__bar"
                              style={{ width: `${clampedRate}%` }}
                            />
                          </div>
                          <span className="ms-progress__value">
                            {numberFormatter.format(card.metric.optedIn)} /{' '}
                            {numberFormatter.format(card.metric.total)} utilisateurs
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </section>

            {/* In-App Messages Section */}
            <section className="ms-dashboard-section">
              <h2 className="ms-section-title">Messages In-App</h2>
              <Card
                actions={
                  <Button variant="secondary" size="sm" href="/messages">
                    Gérer
                  </Button>
                }
              >
                <div className="ms-message-stats">
                  {messageMetrics.map((metric) => (
                    <div key={metric.label} className="ms-stat-row">
                      <span className="ms-stat-row__label">{metric.label}</span>
                      <span className="ms-stat-row__value">{metric.value}</span>
                    </div>
                  ))}
                </div>
                <div className="ms-card-footer-action">
                  <Button href="/messages/new" fullWidth>Créer un message</Button>
                </div>
              </Card>
            </section>
          </div>

          {/* Quick Access */}
          <section className="ms-dashboard-section">
            <h2 className="ms-section-title">Accès Rapides</h2>
            <div className="ms-quick-access-grid">
              <Card className="ms-quick-access-card">
                <div className="ms-quick-access-content">
                  <h3>Utilisateurs</h3>
                  <p>Gérer les profils et les coachs</p>
                  <Button href="/users" variant="secondary">Accéder</Button>
                </div>
              </Card>
              <Card className="ms-quick-access-card">
                <div className="ms-quick-access-content">
                  <h3>Messages</h3>
                  <p>Campagnes et notifications</p>
                  <Button href="/messages" variant="secondary">Accéder</Button>
                </div>
              </Card>
            </div>
          </section>
        </div>
      </AppShell>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const adminSession = await requireAdminSession(context);
  if (!('session' in adminSession)) {
    return adminSession;
  }
  const { session } = adminSession;

  const { supabaseAdmin } = await import('../lib/supabase-admin');

  const now = new Date();
  const nowIso = now.toISOString();

  const period = typeof context.query.period === 'string' ? context.query.period : '7d';

  let startDate: Date;
  let endDate: Date = now;
  let previousStartDate: Date;
  let previousEndDate: Date;

  // Determine date ranges based on period
  switch (period) {
    case '30d':
      startDate = subDays(now, 29);
      previousStartDate = subDays(startDate, 30);
      previousEndDate = subDays(endDate, 30);
      break;
    case 'month':
      startDate = startOfMonth(now);
      endDate = now; // Up to now
      previousStartDate = startOfMonth(subMonths(now, 1));
      previousEndDate = endOfMonth(subMonths(now, 1));
      break;
    case 'last_month':
      startDate = startOfMonth(subMonths(now, 1));
      endDate = endOfMonth(subMonths(now, 1));
      previousStartDate = startOfMonth(subMonths(now, 2));
      previousEndDate = endOfMonth(subMonths(now, 2));
      break;
    case '7d':
    default:
      startDate = subDays(now, 6);
      previousStartDate = subDays(startDate, 7);
      previousEndDate = subDays(endDate, 7);
      break;
  }

  const startOfPeriod = startOfDay(startDate);
  const endOfPeriod = endOfDay(endDate);
  const startOfPreviousPeriod = startOfDay(previousStartDate);
  const endOfPreviousPeriod = endOfDay(previousEndDate);

  const [
    totalUsersResponse,
    periodUsersResponse,
    previousPeriodUsersResponse,
    periodAnalysesResponse,
    previousPeriodAnalysesResponse,
    consentTotalResponse,
    consentMarketingResponse,
    consentImprovementResponse,
    waitlistPeriodResponse,
    waitlistPreviousPeriodResponse,
    chartProfilesResponse,
    chartAnalysesResponse,
    chartWaitlistResponse,
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfPeriod.toISOString())
      .lt('created_at', endOfPeriod.toISOString()),
    supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfPreviousPeriod.toISOString())
      .lt('created_at', endOfPreviousPeriod.toISOString()),
    supabaseAdmin
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfPeriod.toISOString())
      .lt('created_at', endOfPeriod.toISOString()),
    supabaseAdmin
      .from('analyses')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfPreviousPeriod.toISOString())
      .lt('created_at', endOfPreviousPeriod.toISOString()),
    supabaseAdmin.from('consent').select('*', { count: 'exact', head: true }),
    supabaseAdmin
      .from('consent')
      .select('*', { count: 'exact', head: true })
      .eq('marketing', true),
    supabaseAdmin
      .from('consent')
      .select('*', { count: 'exact', head: true })
      .eq('improvement', true),
    supabaseAdmin
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfPeriod.toISOString())
      .lt('created_at', endOfPeriod.toISOString()),
    supabaseAdmin
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfPreviousPeriod.toISOString())
      .lt('created_at', endOfPreviousPeriod.toISOString()),
    supabaseAdmin
      .from('profiles')
      .select('created_at')
      .gte('created_at', startOfPeriod.toISOString())
      .lt('created_at', endOfPeriod.toISOString()),
    supabaseAdmin
      .from('analyses')
      .select('created_at')
      .gte('created_at', startOfPeriod.toISOString())
      .lt('created_at', endOfPeriod.toISOString()),
    supabaseAdmin
      .from('waitlist')
      .select('created_at')
      .gte('created_at', startOfPeriod.toISOString())
      .lt('created_at', endOfPeriod.toISOString()),
  ]);

  const getCountOrZero = (
    response: Awaited<typeof totalUsersResponse>,
    label: string
  ) => {
    if (response.error) {
      console.error(`Erreur lors du chargement de ${label}:`, response.error);
      return 0;
    }
    return response.count ?? 0;
  };

  const totalUsersCount = getCountOrZero(totalUsersResponse, 'profiles (total)');
  const periodUsersCount = getCountOrZero(periodUsersResponse, 'profiles (période)');
  const previousPeriodUsersCount = getCountOrZero(
    previousPeriodUsersResponse,
    'profiles (période précédente)'
  );
  const periodAnalysesCount = getCountOrZero(
    periodAnalysesResponse,
    'analyses (période)'
  );
  const previousPeriodAnalysesCount = getCountOrZero(
    previousPeriodAnalysesResponse,
    'analyses (période précédente)'
  );
  const consentTotalCount = getCountOrZero(
    consentTotalResponse,
    'consent (total)'
  );
  const marketingOptInCount = getCountOrZero(
    consentMarketingResponse,
    'consent (marketing true)'
  );
  const improvementOptInCount = getCountOrZero(
    consentImprovementResponse,
    'consent (improvement true)'
  );
  const waitlistPeriodCount = getCountOrZero(
    waitlistPeriodResponse,
    'waitlist (période)'
  );
  const waitlistPreviousPeriodCount = getCountOrZero(
    waitlistPreviousPeriodResponse,
    'waitlist (période précédente)'
  );

  const previousTotalUsers = Math.max(totalUsersCount - periodUsersCount, 0);
  const totalUsersDelta = totalUsersCount - previousTotalUsers;
  const totalUsersDeltaPercent =
    previousTotalUsers > 0
      ? (totalUsersDelta / previousTotalUsers) * 100
      : null;

  const signupsDelta = periodUsersCount - previousPeriodUsersCount;
  const signupsDeltaPercent =
    previousPeriodUsersCount > 0
      ? (signupsDelta / previousPeriodUsersCount) * 100
      : null;

  const analysesDelta = periodAnalysesCount - previousPeriodAnalysesCount;
  const analysesDeltaPercent =
    previousPeriodAnalysesCount > 0
      ? (analysesDelta / previousPeriodAnalysesCount) * 100
      : null;

  const waitlistDelta = waitlistPeriodCount - waitlistPreviousPeriodCount;
  const waitlistDeltaPercent =
    waitlistPreviousPeriodCount > 0
      ? (waitlistDelta / waitlistPreviousPeriodCount) * 100
      : null;

  const marketingRate =
    consentTotalCount > 0 ? (marketingOptInCount / consentTotalCount) * 100 : 0;
  const improvementRate =
    consentTotalCount > 0 ? (improvementOptInCount / consentTotalCount) * 100 : 0;

  const dashboardMetrics: DashboardMetrics = {
    generatedAt: nowIso,
    totalUsers: {
      current: totalUsersCount,
      previous: previousTotalUsers,
      delta: totalUsersDelta,
      deltaPercentage: totalUsersDeltaPercent,
    },
    weeklySignups: {
      current: periodUsersCount,
      previous: previousPeriodUsersCount,
      delta: signupsDelta,
      deltaPercentage: signupsDeltaPercent,
    },
    analyses: {
      current: periodAnalysesCount,
      previous: previousPeriodAnalysesCount,
      delta: analysesDelta,
      deltaPercentage: analysesDeltaPercent,
    },
    waitlist: {
      current: waitlistPeriodCount,
      previous: waitlistPreviousPeriodCount,
      delta: waitlistDelta,
      deltaPercentage: waitlistDeltaPercent,
    },
    consent: {
      marketing: {
        optedIn: marketingOptInCount,
        total: consentTotalCount,
        rate: marketingRate,
      },
      improvement: {
        optedIn: improvementOptInCount,
        total: consentTotalCount,
        rate: improvementRate,
      },
    },
    userGrowthData: eachDayOfInterval({ start: startDate, end: endDate }).map(
      (day) => {
        const count = (chartProfilesResponse.data || []).filter((item) =>
          isSameDay(parseISO(item.created_at), day)
        ).length;
        return {
          name: format(day, 'EEE dd', { locale: fr }),
          value: count,
        };
      }
    ),
    analysisActivityData: eachDayOfInterval({ start: startDate, end: endDate }).map(
      (day) => {
        const count = (chartAnalysesResponse.data || []).filter((item) =>
          isSameDay(parseISO(item.created_at), day)
        ).length;
        return {
          name: format(day, 'EEE dd', { locale: fr }),
          value: count,
        };
      }
    ),
    waitlistGrowthData: eachDayOfInterval({ start: startDate, end: endDate }).map(
      (day) => {
        const count = (chartWaitlistResponse.data || []).filter((item) =>
          isSameDay(parseISO(item.created_at), day)
        ).length;
        return {
          name: format(day, 'EEE dd', { locale: fr }),
          value: count,
        };
      }
    ),
  };

  const { data, error } = await supabaseAdmin
    .from('in_app_messages')
    .select('id, title, is_active, start_date, target_user_ids, updated_at, created_at')
    .order('updated_at', { ascending: false });

  const baseStats: MessageStats = {
    total: 0,
    active: 0,
    targeted: 0,
    upcoming: 0,
    lastMessageTitle: null,
    lastMessageUpdatedAt: null,
    generatedAt: nowIso,
  };

  if (error) {
    console.error('Erreur lors du chargement des messages:', error);
    return {
      props: {
        initialSession: session,
        messageStats: baseStats,
        dashboardMetrics,
      },
    };
  }

  const messages = data ?? [];
  const nowForMessages = new Date();

  const stats: MessageStats = {
    total: messages.length,
    active: messages.filter((message) => message.is_active).length,
    targeted: messages.filter(
      (message) =>
        Array.isArray(message.target_user_ids) && message.target_user_ids.length > 0
    ).length,
    upcoming: messages.filter((message) => {
      if (!message.start_date) return false;
      return new Date(message.start_date) > nowForMessages;
    }).length,
    lastMessageTitle: messages[0]?.title ?? null,
    lastMessageUpdatedAt: messages[0]?.updated_at ?? messages[0]?.created_at ?? null,
    generatedAt: nowIso,
  };

  return {
    props: {
      initialSession: session,
      messageStats: stats,
      dashboardMetrics,
      selectedPeriod: period,
    },
  };
};
