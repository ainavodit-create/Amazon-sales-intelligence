import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download } from 'lucide-react';
import { useState } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  chart?: any[];
}

function MetricCard({ title, value, subtitle }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function KnowledgeCard({ title, value, chart }: { title: string; value: string; chart: any[] }) {
  return (
    <div className="bg-white rounded-lg p-6 border border-gray-200">
      <h3 className="text-gray-600 text-sm font-medium mb-4">{title}</h3>
      <div className="text-2xl font-bold text-gray-900 mb-4">{value}</div>
      <div className="h-12">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart}>
            <Line type="monotone" dataKey="value" stroke="#3b82f6" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TopicBar({ icon, title, correctness, isStrong }: any) {
  const color = isStrong ? '#10b981' : '#ef4444';
  return (
    <div className="flex items-center gap-4 mb-6">
      <img src={icon} alt={title} className="w-12 h-12 rounded" />
      <div className="flex-1">
        <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full"
            style={{ width: `${correctness}%`, backgroundColor: color }}
          ></div>
        </div>
      </div>
      <div className="text-right">
        <span className={`font-semibold ${isStrong ? 'text-green-600' : 'text-red-600'}`}>
          {correctness}%
        </span>
        <span className="text-gray-500 text-sm ml-1">Correct</span>
      </div>
    </div>
  );
}

function LeaderboardEntry({ rank, name, points, trend }: any) {
  const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`;
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full" />
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">{name}</h4>
          <p className="text-xs text-gray-500">{points} Points</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-bold text-gray-900">{rank}</span>
        <span className={`text-lg ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {trend === 'up' ? '▲' : '▼'}
        </span>
      </div>
    </div>
  );
}

const activityData = [
  { month: 'JAN', value: 100 },
  { month: 'FEB', value: 150 },
  { month: 'MAR', value: 120 },
  { month: 'APR', value: 180 },
  { month: 'MAY', value: 220 },
  { month: 'JUN', value: 190 },
  { month: 'JUL', value: 150 },
  { month: 'AUG', value: 100 },
  { month: 'SEP', value: 220 },
  { month: 'OCT', value: 280 },
  { month: 'NOV', value: 320 },
  { month: 'DEC', value: 350 },
];

const knowledgeChartData = [
  { value: 50 },
  { value: 60 },
  { value: 55 },
  { value: 70 },
];

export function ReportsPage() {
  const [timeframe, setTimeframe] = useState('All-time');
  const [people, setPeople] = useState('All');
  const [topic, setTopic] = useState('All');

  return (
    <div className="min-h-screen bg-gray-50 ml-64">
      <div className="max-w-7xl mx-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center z-10">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <button className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition">
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>

        <div className="px-8 py-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
            <div className="flex gap-6">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-2">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none"
                >
                  <option>All-time</option>
                  <option>Last Year</option>
                  <option>Last Month</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-2">People</label>
                <select
                  value={people}
                  onChange={(e) => setPeople(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none"
                >
                  <option>All</option>
                  <option>Team A</option>
                  <option>Team B</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-2">Topic</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none"
                >
                  <option>All</option>
                  <option>Topic 1</option>
                  <option>Topic 2</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-6 mb-8">
            <MetricCard title="Active Users" value="27/80" />
            <MetricCard title="Questions Answered" value="3,298" />
            <MetricCard title="Av. Session Length" value="2m 34s" />
            <div className="col-span-1"></div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Activity</h2>
              <button className="text-blue-600 text-sm hover:text-blue-700">Month</button>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <KnowledgeCard title="Starting Knowledge" value="64%" chart={knowledgeChartData} />
            <KnowledgeCard title="Current Knowledge" value="86%" chart={knowledgeChartData} />
            <KnowledgeCard title="Knowledge Gain" value="+34%" chart={knowledgeChartData} />
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Weakest Topics</h2>
              <TopicBar
                icon="https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=100&h=100&fit=crop"
                title="Food Safety"
                correctness={74}
                isStrong={false}
              />
              <TopicBar
                icon="https://images.unsplash.com/photo-1553729783-8a2b5e27d5c0?w=100&h=100&fit=crop"
                title="Compliance Basics Procedures"
                correctness={52}
                isStrong={false}
              />
              <TopicBar
                icon="https://images.unsplash.com/photo-1633356122544-f134324ef6db?w=100&h=100&fit=crop"
                title="Company Networking"
                correctness={36}
                isStrong={false}
              />
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Strongest Topics</h2>
              <TopicBar
                icon="https://images.unsplash.com/photo-1573871328626-bcda6d4b2b96?w=100&h=100&fit=crop"
                title="Covid Protocols"
                correctness={95}
                isStrong={true}
              />
              <TopicBar
                icon="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop"
                title="Cyber Security Basics"
                correctness={92}
                isStrong={true}
              />
              <TopicBar
                icon="https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=100&h=100&fit=crop"
                title="Social Media Policies"
                correctness={89}
                isStrong={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">User Leaderboard</h2>
              <LeaderboardEntry rank="1" name="Jesse Thomas" points={637} trend="up" />
              <LeaderboardEntry rank="2" name="Thisal Mathiyazahgan" points={637} trend="down" />
            </div>

            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Groups Leaderboard</h2>
              <LeaderboardEntry rank="1" name="Houston Facility" points="52 Points / User - 97% Correct" trend="up" />
              <LeaderboardEntry rank="2" name="Test Group" points="52 Points / User - 95% Correct" trend="down" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
